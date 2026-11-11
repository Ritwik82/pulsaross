param([string]$Mode = 'cursor')
# Agent Stop hook: run quick checks before the agent says "done".
$ErrorActionPreference = 'Continue'
$raw = [Console]::In.ReadToEnd()
try { $in = $raw | ConvertFrom-Json } catch { $in = $null }
function Pass { if ($Mode -eq 'cursor') { '{}' }; exit 0 }
if ($Mode -eq 'cursor' -and $in -and $in.status -and $in.status -ne 'completed') { Pass }
if ($Mode -eq 'codex' -and $in -and $in.stop_hook_active) { Pass }
Set-Location (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
if (-not (git status --porcelain 2>$null)) { Pass }
$checks = @('lint','test:unit')
foreach ($c in $checks) {
  $out = cmd /c "npm run $c 2>&1"
  if ($LASTEXITCODE -ne 0) {
    $tail = (($out | Select-Object -Last 25) -join "`n")
    $msg = "``npm run $c`` failed. Fix it before finishing:`n$tail"
    if ($Mode -eq 'cursor') { @{ followup_message = $msg } | ConvertTo-Json -Compress }
    else { @{ decision = 'block'; reason = $msg } | ConvertTo-Json -Compress }
    exit 0
  }
}
Pass