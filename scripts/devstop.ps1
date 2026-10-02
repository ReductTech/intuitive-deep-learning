param(
  [ValidateSet('all','vision','assessment','proxy','records')][string]$Kind = 'all'
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $repoRoot 'backend\src'
$previousPythonPath = $env:PYTHONPATH
try {
  $env:PYTHONPATH = if ($previousPythonPath) { "$sourcePath;$previousPythonPath" } else { $sourcePath }
  & python -m idl_backend.local.development --action stop --kind $Kind
  exit $LASTEXITCODE
} finally {
  $env:PYTHONPATH = $previousPythonPath
}
