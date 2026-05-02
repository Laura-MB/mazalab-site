<#
.SYNOPSIS
    MAZALab Mother Brain - One-click Gaming Demo launcher.

.DESCRIPTION
    Premium, zero-friction starter for the G2E / casino demo:
      1. Resolves the API PORT from .env (fallback: 3010).
      2. Detects whether the server is already running via GET /health.
      3. If not, launches `npm run dev` in a dedicated PowerShell window
         (so stakeholders see the logs, can Ctrl+C, or close the window to stop).
      4. Polls /health until the server is ready (up to 40s).
      5. Opens http://localhost:<port>/demo/gaming-dashboard.html in the
         default browser.

    Once the dashboard loads, the presenter workflow is:
      - Click "Run Full Demo" to execute the six gaming scenarios live against POST /assess.
      - Inspect KPIs, Risk-tier distribution, Audit Log Overview, and the
        "Adaptive Combos Detected" card.
      - Click the gold-outlined "Export Report" button (beside Run Full Demo)
        and choose:
          * "Copy Markdown"   -> clipboard (paste into Notion / Slack / PR).
          * "Download .md"    -> mazalab-gaming-demo-report-<stamp>.md file.
        The export is produced entirely client-side from the last run and
        carries the executive summary, adaptive combos, artefact checklist,
        per-scenario drivers + recommended actions, and a collapsed raw-JSON
        appendix per scenario.

.NOTES
    - Run from any location:  powershell -ExecutionPolicy Bypass -File demo\start-demo.ps1
    - Or from repo root:      .\demo\start-demo.ps1
    - Stop the server: close the "MAZALab Mother Brain" window or press Ctrl+C inside it.
    - The "Export Report" button in the dashboard is the recommended way to
      produce a reviewer-grade leave-behind for a specific run; the
      -WithPresentation flag below remains the way to regenerate the
      canonical executive deck.

.PARAMETER WithPresentation
    Regenerates a dated snapshot of demo-presentation.md in demo/package/
    before launching. The canonical file is never overwritten; a sibling
    file named `demo-presentation-YYYYMMDD-HHMMSS.md` is written with a
    generation header so stakeholders receive a timestamped leave-behind.

    Note: this snapshot is the static executive deck (pipeline explainer,
    six gaming cases, benefits, roadmap). For a run-specific Markdown
    report tied to the live results on screen, use the dashboard's
    "Export Report" button once "Run Full Demo" has completed.
#>

#requires -Version 5.1
[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 40,
    [switch]$NoBrowser,
    [switch]$WithPresentation
)

$ErrorActionPreference = "Stop"

# -------- paths --------
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Split-Path -Parent $scriptDir
Set-Location $repoRoot

# -------- pretty output helpers --------
$script:UseEmoji = $true
try {
    # Older consoles (pre Windows Terminal) may not render emoji well.
    if ($Host.UI.RawUI.WindowTitle -and $env:WT_SESSION -eq $null -and $PSVersionTable.PSVersion.Major -lt 7) {
        $script:UseEmoji = $false
    }
} catch { $script:UseEmoji = $false }

function Write-Color {
    param(
        [Parameter(Mandatory = $true)][string]$Text,
        [ValidateSet("White","Gray","DarkGray","Yellow","Green","Red","Cyan","Magenta","DarkYellow","DarkCyan")]
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Step {
    param([string]$Text)
    Write-Color ("  -> " + $Text) -Color DarkCyan
}
function Write-Ok {
    param([string]$Text)
    $glyph = if ($script:UseEmoji) { "OK" } else { "OK" }
    Write-Color ("  [" + $glyph + "] " + $Text) -Color Green
}
function Write-Warn {
    param([string]$Text)
    Write-Color ("  [!] " + $Text) -Color Yellow
}
function Write-Err {
    param([string]$Text)
    Write-Color ("  [X] " + $Text) -Color Red
}
function Write-Info {
    param([string]$Text)
    Write-Color ("   -  " + $Text) -Color Gray
}

function Show-Banner {
    $diamond = if ($script:UseEmoji) { "[*]" } else { "*" }
    Write-Host ""
    Write-Color ("  " + $diamond + " MAZALab Mother Brain v0.1") -Color Yellow
    Write-Color  "  Gaming Demo Launcher"                       -Color DarkYellow
    Write-Color  "  ----------------------------------------"   -Color DarkGray
    Write-Host ""
}

# -------- read PORT from .env --------
function Get-EnvPort {
    param([int]$Default = 3010)
    $envFile = Join-Path $repoRoot ".env"
    if (-not (Test-Path $envFile)) { return $Default }
    $line = Get-Content -LiteralPath $envFile -ErrorAction SilentlyContinue |
        Where-Object { $_ -match '^\s*PORT\s*=' } |
        Select-Object -First 1
    if (-not $line) { return $Default }
    if ($line -match '^\s*PORT\s*=\s*"?(\d+)"?\s*(#.*)?$') { return [int]$Matches[1] }
    return $Default
}

# -------- health probe --------
function Test-ServerHealth {
    param([Parameter(Mandatory=$true)][string]$Url)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        return ($r.StatusCode -eq 200)
    } catch {
        return $false
    }
}

function Wait-ForServer {
    param(
        [Parameter(Mandatory=$true)][string]$Url,
        [int]$TimeoutSec = 40
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $attempt  = 0
    while ((Get-Date) -lt $deadline) {
        $attempt++
        if (Test-ServerHealth -Url $Url) { return $true }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

# -------- presentation snapshot --------
function New-PresentationSnapshot {
    param(
        [Parameter(Mandatory=$true)][string]$RepoRoot
    )
    $packageDir = Join-Path $RepoRoot "demo\package"
    $source     = Join-Path $packageDir "demo-presentation.md"

    if (-not (Test-Path $packageDir)) {
        Write-Err "demo/package/ not found. Aborting snapshot."
        return $null
    }
    if (-not (Test-Path $source)) {
        Write-Err ("Canonical presentation missing: " + $source)
        return $null
    }

    $stamp  = Get-Date -Format "yyyyMMdd-HHmmss"
    $target = Join-Path $packageDir ("demo-presentation-" + $stamp + ".md")

    $header = @(
        "<!--",
        "  Snapshot generated by demo/start-demo.ps1 -WithPresentation",
        ("  Generated at : " + (Get-Date).ToString("u")),
        ("  Source       : demo/package/demo-presentation.md"),
        ("  Intent       : timestamped leave-behind for stakeholder session"),
        "-->",
        ""
    ) -join [Environment]::NewLine

    # Read source as UTF-8 and write target as UTF-8 without BOM so em-dashes,
    # non-ASCII names, and Mermaid blocks round-trip cleanly across editors
    # and PDF converters. PowerShell 5.1 `Get-Content -Raw` relies on the
    # default ANSI codepage, which mangles the MD; .NET keeps it byte-exact.
    $body     = [System.IO.File]::ReadAllText($source, [System.Text.Encoding]::UTF8)
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($target, $header + $body, $utf8NoBom)
    return $target
}

# -------- launch server in its own window --------
function Start-DevServer {
    param(
        [Parameter(Mandatory=$true)][int]$Port,
        [Parameter(Mandatory=$true)][string]$RepoRoot
    )
    $title = "MAZALab Mother Brain (port $Port)"
    # We use a new PowerShell window so:
    #   - logs are visible to the presenter
    #   - Ctrl+C or closing the window cleanly stops the dev server
    #   - this launcher returns immediately
    $command = "`$Host.UI.RawUI.WindowTitle = '$title'; " +
               "Set-Location -LiteralPath '$RepoRoot'; " +
               "`$env:PORT = '$Port'; " +
               "Write-Host 'MAZALab dev server - port $Port. Press Ctrl+C to stop.' -ForegroundColor Yellow; " +
               "npm run dev"
    $psArgs = @("-NoExit", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $command)
    Start-Process -FilePath "powershell.exe" -ArgumentList $psArgs -WindowStyle Normal | Out-Null
}

# =========================================================================
# main
# =========================================================================
Show-Banner

$port      = Get-EnvPort -Default 3010
$baseUrl   = "http://localhost:$port"
$healthUrl = "$baseUrl/health"
$dashUrl   = "$baseUrl/demo/gaming-dashboard.html"

Write-Info ("Repo root : " + $repoRoot)
Write-Info ("Port      : " + $port + "   (from .env, fallback 3010)")
Write-Info ("Dashboard : " + $dashUrl)
Write-Host ""

if ($WithPresentation) {
    Write-Step "Generating dated presentation snapshot in demo/package/..."
    try {
        $snapshot = New-PresentationSnapshot -RepoRoot $repoRoot
        if ($snapshot) {
            Write-Ok ("Snapshot written: " + $snapshot)
        } else {
            Write-Warn "Snapshot generation skipped (see messages above)."
        }
    } catch {
        Write-Warn ("Snapshot generation failed: " + $_.Exception.Message)
    }
    Write-Host ""
}

Write-Step "Checking if the server is already running..."
if (Test-ServerHealth -Url $healthUrl) {
    Write-Ok ("Server already alive on port " + $port + " - reusing it.")
} else {
    Write-Warn "Server not responding. Launching 'npm run dev' in a dedicated window..."
    try {
        Start-DevServer -Port $port -RepoRoot $repoRoot
    } catch {
        Write-Err ("Failed to launch dev server: " + $_.Exception.Message)
        exit 1
    }

    Write-Step ("Waiting for /health (up to " + $TimeoutSeconds + "s)...")
    if (Wait-ForServer -Url $healthUrl -TimeoutSec $TimeoutSeconds) {
        Write-Ok ("Server ready on port " + $port + ".")
    } else {
        Write-Err ("Server did not respond within " + $TimeoutSeconds + "s.")
        Write-Info "Check the 'MAZALab Mother Brain' window for errors (port conflict? .env? npm install missing?)."
        exit 1
    }
}

if ($NoBrowser) {
    Write-Info "-NoBrowser flag set - skipping browser launch."
} else {
    Write-Step "Opening dashboard in default browser..."
    try {
        Start-Process $dashUrl | Out-Null
        Write-Ok "Dashboard opened."
    } catch {
        Write-Warn ("Could not auto-open browser: " + $_.Exception.Message)
        Write-Info ("Open manually: " + $dashUrl)
    }
}

Write-Host ""
Write-Color "  ----------------------------------------" -Color DarkGray
Write-Color "  How to stop the demo"                     -Color Yellow
Write-Color "  ----------------------------------------" -Color DarkGray
Write-Info "Close the 'MAZALab Mother Brain' PowerShell window, or press Ctrl+C inside it."
Write-Info "If you reused an existing server, stop it where it was originally launched."
Write-Host ""
Write-Color "  Tip: re-run this script any time - it is safe and idempotent." -Color DarkGray
Write-Color "  Tip: pass -WithPresentation to drop a dated snapshot in demo/package/." -Color DarkGray
Write-Color "  Tip: after 'Run Full Demo', use the gold 'Export Report' button to copy" -Color DarkGray
Write-Color "       a Markdown report to clipboard or download it as a timestamped .md file." -Color DarkGray
Write-Host ""
