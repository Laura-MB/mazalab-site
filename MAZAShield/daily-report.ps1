# daily-report.ps1 — Daily change report for MAZA Shield (MAZALab)
# Run from repository root: npm run daily
#requires -Version 5.1
$ErrorActionPreference = "Stop"

$repoRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location -LiteralPath $repoRoot

$date = Get-Date -Format "yyyy-MM-dd"
$outDir = Join-Path $repoRoot "docs\daily-changes"
$reportPath = Join-Path $outDir "$date.md"

if (-not (Test-Path -LiteralPath $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$version = "unknown"
try {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $version = node -p "require('./package.json').version" 2>$null
    }
    if (-not $version) {
        $raw = npm pkg get version 2>$null
        if ($raw) { $version = ($raw | ConvertFrom-Json) }
    }
} catch { }

$branch = git -C $repoRoot branch --show-current 2>$null
if (-not $branch) { $branch = "(detached HEAD or no branch)" }

$rawLog = git -C $repoRoot log --since="1 day ago" --pretty=format:"%h|%s" 2>$null
$entries = @()
if ($rawLog) {
    $entries = @($rawLog -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })
}

function Format-CommitLine {
    param([string]$Hash, [string]$Subject)
    return "- ``$Hash`` $Subject"
}

function Classify-Commit {
    param([string]$Subject)

    $marketingScopes = @(
        "docs", "doc", "readme", "i18n", "l10n", "brand", "branding",
        "marketing", "content", "copy", "website", "web", "presentation"
    )
    $marketingPattern = "(?i)(documentation|documentaci|readme|changelog|branding|marketing|mazalab\.com|presentation|presentaci|one[\s-]?pager|runbook|g2e|copywriting|landing)"

    $m = [regex]::Match(
        $Subject,
        '^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<desc>.+)$'
    )

    if ($m.Success) {
        $type = $m.Groups["type"].Value.ToLowerInvariant()
        $scope = if ($m.Groups["scope"].Success) { $m.Groups["scope"].Value.ToLowerInvariant() } else { "" }
        $desc = $m.Groups["desc"].Value

        if ($type -eq "docs") {
            return "marketing"
        }
        if ($marketingScopes -contains $scope) {
            return "marketing"
        }
        if ($type -eq "feat" -or $type -eq "fix") {
            if ($desc -match $marketingPattern) { return "marketing" }
            return "core"
        }
        $techTypes = @(
            "refactor", "perf", "test", "tests", "build", "ci", "chore", "style", "revert"
        )
        if ($techTypes -contains $type) {
            return "technical"
        }
        return "other"
    }

    if ($Subject -match $marketingPattern) { return "marketing" }
    if ($Subject -match "(?i)(release|husky|commitlint|toolchain|bump|dependenc)") {
        return "technical"
    }
    return "other"
}

$technical = [System.Collections.ArrayList]@()
$core = [System.Collections.ArrayList]@()
$marketing = [System.Collections.ArrayList]@()
$other = [System.Collections.ArrayList]@()

foreach ($line in $entries) {
    $parts = $line -split "\|", 2
    if ($parts.Count -lt 2) { continue }
    $h = $parts[0].Trim()
    $s = $parts[1].Trim()
    $bucket = Classify-Commit -Subject $s
    $formatted = Format-CommitLine -Hash $h -Subject $s
    switch ($bucket) {
        "technical" { [void]$technical.Add($formatted) }
        "core" { [void]$core.Add($formatted) }
        "marketing" { [void]$marketing.Add($formatted) }
        default { [void]$other.Add($formatted) }
    }
}

function Join-Bullets {
    param([System.Collections.ArrayList]$Items, [string]$EmptyMsg)
    if ($Items.Count -eq 0) { return $EmptyMsg }
    return ($Items | ForEach-Object { $_ }) -join [Environment]::NewLine
}

$msgEmptyTech = "_No technical commits (refactor, perf, test, build, ci, chore, etc.) in the last 24 hours._"
$msgEmptyCore = "_No product-facing commits (feat/fix) in the last 24 hours._"
$msgEmptyMkt = "_No marketing, branding, or documentation commits detected._"
$msgEmptyAll = "_No commits on this branch in the last 24 hours._"

if ($entries.Count -eq 0) {
    $secTechnical = $msgEmptyAll
    $secCore = $msgEmptyAll
    $secMarketing = $msgEmptyAll
    $secOtherBlock = ""
    $execSummary = @"
- No Git activity in the reporting window; capture customer or operator-facing progress under **Manual Notes**.
- If work happened on another branch or repository, record it there to preserve commercial traceability.
"@
}
else {
    $secTechnical = Join-Bullets -Items $technical -EmptyMsg $msgEmptyTech
    $secCore = Join-Bullets -Items $core -EmptyMsg $msgEmptyCore
    $secMarketing = Join-Bullets -Items $marketing -EmptyMsg $msgEmptyMkt

    if ($other.Count -gt 0) {
        $secOtherBlock = @"


### Other commits (non-conventional)

$($other -join [Environment]::NewLine)
"@
    } else {
        $secOtherBlock = ""
    }

    $nTotal = $entries.Count
    $nCore = $core.Count
    $nTech = $technical.Count
    $nMkt = $marketing.Count
    $nOth = $other.Count

    $execSummary = "- **Throughput:** $nTotal commit(s) in the last 24 hours on ``$branch``." + [Environment]::NewLine
    $execSummary += "- **MAZA Shield product signal:** $nCore commit(s) with visible product impact (feat/fix)." + [Environment]::NewLine
    $execSummary += "- **Engineering & platform:** $nTech commit(s) supporting quality, tooling, CI, and refactors." + [Environment]::NewLine
    $execSummary += "- **Go-to-market narrative:** $nMkt commit(s) in docs, branding, or commercial content." + [Environment]::NewLine
    if ($nOth -gt 0) {
        $execSummary += "- **Review:** $nOth commit(s) are non-conventional; triage under *Other commits*." + [Environment]::NewLine
    }
    $execSummary += "- **Suggested next step:** tie today's changes to pipeline milestones (live demo, pilot, compliance) in Manual Notes."
}

$body = @"
# MAZA Shield - Daily Change Report

## 1. Date and current version

| Field | Value |
|--------|--------|
| **Report date** | $date |
| **Version (`package.json`)** | $version |
| **Git branch** | ``$branch`` |
| **Analysis window** | Last 24 hours |

---

## 2. Technical Changes

Conventional types *refactor*, *perf*, *test*, *build*, *ci*, *chore*, *style*, *revert*, plus tooling heuristics (release automation, Husky, lint config, dependency bumps).

$secTechnical

---

## 3. Core / Product Changes

*feat* and *fix* commits that advance MAZA Shield capabilities (API, core intelligence, operational demo, casino risk workflows), excluding changes that are clearly documentation- or marketing-only.

$secCore

---

## 4. Marketing / Branding / Documentation Changes

Type *docs*, content scopes, README and runbooks, presentations, i18n, and messaging aligned with buyer-facing narrative.

$secMarketing
$secOtherBlock

---

## 5. Manual Notes

_Use this section for: operator meetings, demo feedback, risks, sales opportunities, regulatory blockers, stakeholder follow-ups._

- 
- 

---

## 6. Executive Summary (short)

$execSummary

---

_Generated by **daily-report.ps1**. Classification follows [Conventional Commits](https://www.conventionalcommits.org/); re-label under **Other commits** if a change was miscategorized._
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($reportPath, $body, $utf8NoBom)

Write-Host "Daily report written: $reportPath" -ForegroundColor Green
