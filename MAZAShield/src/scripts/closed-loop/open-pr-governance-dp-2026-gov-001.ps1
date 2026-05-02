# DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1
# Open PR from feat/governance-dp-2026-gov-001 with regulatory body (requires GitHub CLI: gh)
# Usage: ./open-pr-governance-dp-2026-gov-001.ps1
#        From repo root; ensure branch is pushed: git push -u origin feat/governance-dp-2026-gov-001

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$Body = Join-Path $Root "docs\qmsr-iso13485\records\change-control\pr-body-governance-dp-2026-gov-001.md"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) is not installed. Install: https://cli.github.com/"
}

gh pr create `
  --base main `
  --head feat/governance-dp-2026-gov-001 `
  --title "feat(governance): add Audit Trail & Compliance Metadata enhancement (DP-2026-GOV-001)" `
  --body-file $Body

Write-Host "After merge, set env MERGED_PR_URL and run post-merge-governance-closure.ps1, or follow PR-feat-governance-dp-2026-gov-001.md"
