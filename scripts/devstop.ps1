param(
  [ValidateSet('all','vision','assessment','proxy','records','api')][string]$Kind = 'all',
  [string]$Python = $env:IDL_PYTHON
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot 'backend\src'
$previousPythonPath = $env:PYTHONPATH
. (Join-Path $PSScriptRoot 'development-python.ps1')
try {
  $env:PYTHONPATH = if ($previousPythonPath) { "$sourcePath;$previousPythonPath" } else { $sourcePath }
  $interpreter = Resolve-DevelopmentPython -Requested $Python -Kind $Kind -ManagementOnly
  Write-Host "Python: $interpreter"
  & $interpreter -m idl_backend.local.development --action stop --kind $Kind
  exit $LASTEXITCODE
} finally {
  $env:PYTHONPATH = $previousPythonPath
}
