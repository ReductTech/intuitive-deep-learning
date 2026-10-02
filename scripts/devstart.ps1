param(
  [switch]$Status,
  [ValidateSet('all','vision','assessment','proxy','records')][string]$Kind = 'all',
  [int]$Port = 0,
  [string]$Course = '',
  [ValidateSet('auto','cpu','cuda','mps')][string]$Device = 'auto'
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot 'backend\src'
$previousPythonPath = $env:PYTHONPATH
try {
  $env:PYTHONPATH = if ($previousPythonPath) { "$sourcePath;$previousPythonPath" } else { $sourcePath }
  $serviceAction = if ($Status) { 'status' } else { 'start' }
  $serviceArguments = @('-m','idl_backend.local.development','--action',$serviceAction,'--kind',$Kind,'--device',$Device)
  if ($Port) { $serviceArguments += @('--port',"$Port") }
  if ($Course) { $serviceArguments += @('--course',$Course) }
  & python @serviceArguments
  exit $LASTEXITCODE
} finally {
  $env:PYTHONPATH = $previousPythonPath
}
