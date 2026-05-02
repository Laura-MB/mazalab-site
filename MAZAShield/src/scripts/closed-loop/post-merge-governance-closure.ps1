# MAZALab — post-merge closure: DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1, OQ-GOV-SUP-001, SOP-001 §12
# Requires: MERGED_PR_URL (env) = full URL of merged PR; run on `main` after merge, from repo root.
# Replaces TBD_PR_URL in RVTM + validation index + OQ; __MERGE_SHA_MAIN__ in OQ; `PENDING_V11_0_OP_CLOSE` in PROJECT_CONTEXT.
# Runs npm run typecheck + npm test; commits documentation.
# Usage:
#   $env:MERGED_PR_URL = "https://github.com/ORG/REPO/pull/NNN"
#   .\scripts\closed-loop\post-merge-governance-closure.ps1

param(
  [Parameter(Mandatory = $false)]
  [string] $PrUrl = $env:MERGED_PR_URL
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

if ([string]::IsNullOrWhiteSpace($PrUrl)) {
  Write-Error "Set MERGED_PR_URL to the merged pull request URL, e.g. [Environment]::SetEnvironmentVariable('MERGED_PR_URL','https://github.com/ORG/REPO/pull/42','Process')"
}

$tdbPaths = @(
  "docs\qmsr-iso13485\records\rvtm\rvtm-light-v1.1.md",
  "docs\qmsr-iso13485\records\validation\README.md",
  "docs\qmsr-iso13485\records\validation\oq\OQ-GOV-SUP-001.md"
)
foreach ($p in $tdbPaths) {
  $full = Join-Path $Root $p
  if (-not (Test-Path $full)) { Write-Warning "Skip missing: $p"; continue }
  $c = [System.IO.File]::ReadAllText($full)
  if ($c -notmatch "TBD_PR_URL") { continue }
  $c2 = $c.Replace("TBD_PR_URL", $PrUrl)
  [System.IO.File]::WriteAllText($full, $c2)
  Write-Host "Replaced TBD_PR_URL in: $p"
}

Write-Host "`n== npm run typecheck; npm test (OQ-GOV-SUP-001 evidence) =="
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$sha = git rev-parse HEAD
$oqPath = Join-Path $Root "docs\qmsr-iso13485\records\validation\oq\OQ-GOV-SUP-001.md"
if (Test-Path $oqPath) {
  $oq = [System.IO.File]::ReadAllText($oqPath)
  if ($oq -match "__MERGE_SHA_MAIN__") {
    $oq2 = $oq.Replace("__MERGE_SHA_MAIN__", $sha)
    [System.IO.File]::WriteAllText($oqPath, $oq2)
    Write-Host "OQ: set __MERGE_SHA_MAIN__ -> $sha"
  }
}

$pcPath = Join-Path $Root "docs\PROJECT_CONTEXT.md"
$releaseLine = @"
**v1.1.0 released** on ``main`` — PR: $PrUrl — merge commit ``$sha`` — OQ-GOV-SUP-001 (npm typecheck + npm test *Pass*). Regulatory: [DP-2026-GOV-001 v1.1](qmsr-iso13485/records/design-plans/DP-2026-GOV-001.md), [DR-2026-GOV-001-001](qmsr-iso13485/records/design-reviews/DR-2026-GOV-001-001.md), [RVTM v1.1](qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md); [SOP-001 §12](qmsr-iso13485/sop-design-and-development.md#12-design-changes--change-control-integración-con-audit-trail-y-re-validation); [RELEASE-2026-Q2-v1.0](qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md) (ER/RS baseline); [Management Sign-off Q2 2026](qmsr-iso13485/records/management-signoff-q2-2026.md).
"@
if (Test-Path $pcPath) {
  $pc = [System.IO.File]::ReadAllText($pcPath)
  if ($pc -match "PENDING_V11_0_OP_CLOSE") {
    $pc2 = $pc.Replace('`PENDING_V11_0_OP_CLOSE`', $releaseLine.Trim())
    [System.IO.File]::WriteAllText($pcPath, $pc2)
    Write-Host "PROJECT_CONTEXT: v1.1.0 released line applied."
  } else { Write-Warning "PROJECT_CONTEXT: token PENDING_V11_0_OP_CLOSE not found (already closed?)" }
}

$line1 = "docs(qmsr): post-merge v1.1.0 -- RVTM, OQ-GOV-SUP-001, PROJECT_CONTEXT; PR $PrUrl; SHA $sha"
$line2 = "SOP-001 12. DP-2026-GOV-001 v1.1. DR-2026-GOV-001-001. RVTM v1.1. OQ-GOV-SUP-001. Baseline RELEASE-2026-Q2-v1.0. Management Sign-off Q2 2026."
$toAdd = @(
  "docs\qmsr-iso13485\records\rvtm\rvtm-light-v1.1.md",
  "docs\qmsr-iso13485\records\validation\README.md",
  "docs\qmsr-iso13485\records\validation\oq\OQ-GOV-SUP-001.md",
  "docs\PROJECT_CONTEXT.md"
) | ForEach-Object { Join-Path $Root $_ } | Where-Object { Test-Path $_ }
foreach ($f in $toAdd) { if (Test-Path $f) { & git 'add' '--' $f } }
$st = git status --porcelain
if ($st) {
  & git @('commit', '-m', $line1, '-m', $line2)
} else { Write-Warning "Nothing to commit (files unchanged or no staged diff)" }
Write-Host "`nCommitted post-merge documentation. Next: OQ §7 sign-off, then see TAG-v1.1.0.md for annotated tag and push."
Write-Host "Tag command (see docs/qmsr-iso13485/records/change-control/TAG-v1.1.0.md): git tag -a v1.1.0 -m \"...\" ; git push origin main; git push origin v1.1.0"