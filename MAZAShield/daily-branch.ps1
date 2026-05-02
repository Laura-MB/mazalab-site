# daily-branch.ps1 — Rama diaria de iteración (MAZA Shield / MAZALab)
# Ejecutar desde la raíz del repo: .\daily-branch.ps1
#requires -Version 5.1
$ErrorActionPreference = "Stop"

$repoRoot = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
Set-Location -LiteralPath $repoRoot

$date = Get-Date -Format "yyyy-MM-dd"
$branchName = "iteration/$date"

# Ensure we are on main and up to date
git checkout main
git pull origin main

# Create and switch to new daily branch
git checkout -b $branchName

Write-Host "✅ Nueva rama diaria creada y activada: $branchName" -ForegroundColor Green
Write-Host "Trabaja en esta rama para mantener el historial organizado." -ForegroundColor Cyan
