param(
  [switch]$Status,
  [ValidateSet('all','vision','assessment','proxy','records','api')][string]$Kind = 'all',
  [int]$Port = 0,
  [string]$Course = '',
  [ValidateSet('auto','cpu','cuda','mps')][string]$Device = 'auto',
  [string]$Python = $env:IDL_PYTHON
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot 'backend\src'
$previousPythonPath = $env:PYTHONPATH
. (Join-Path $PSScriptRoot 'development-python.ps1')
try {
  $env:PYTHONPATH = if ($previousPythonPath) { "$sourcePath;$previousPythonPath" } else { $sourcePath }
  $serviceAction = if ($Status) { 'status' } else { 'start' }
  $serviceArguments = @('-m','idl_backend.local.development','--action',$serviceAction,'--kind',$Kind,'--device',$Device)
  if ($Port) { $serviceArguments += @('--port',"$Port") }
  if ($Course) { $serviceArguments += @('--course',$Course) }
  $interpreter = Resolve-DevelopmentPython -Requested $Python -Kind $Kind -ManagementOnly:$Status
  Write-Host "Python: $interpreter"
  & $interpreter @serviceArguments
  exit $LASTEXITCODE
} finally {
  $env:PYTHONPATH = $previousPythonPath
}
