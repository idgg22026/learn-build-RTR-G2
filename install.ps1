# Install the RTR skills for Claude Code on Windows (PowerShell).
#   powershell -ExecutionPolicy Bypass -File install.ps1            → all projects (~\.claude\skills)
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Project   → this project (.\.claude\skills)
param([switch]$Project)
$src = Join-Path $PSScriptRoot 'plugin\skills'
$dest = if ($Project) { Join-Path (Get-Location) '.claude\skills' } else { Join-Path $HOME '.claude\skills' }
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Get-ChildItem $src -Directory | ForEach-Object {
  $target = Join-Path $dest $_.Name
  if (Test-Path $target) { Remove-Item $target -Recurse -Force }
  Copy-Item $_.FullName $target -Recurse
  Write-Host "installed $($_.Name) -> $target"
}
Write-Host 'Done. Restart Claude Code, then type /new-project, /add-module or /check-rules.'
