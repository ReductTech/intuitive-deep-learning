[CmdletBinding(PositionalBinding=$false)]
param(
  [Parameter(Position=0)][ValidateSet('init','start','status','stop','test')][string]$Command = 'start',
  [string]$Python = $env:IDL_PYTHON,
  [Parameter(ValueFromRemainingArguments=$true)][string[]]$ExtraArguments
)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'development-python.ps1')
$interpreter = Resolve-DevelopmentPython -Requested $Python -Kind shuku
& $interpreter (Join-Path $PSScriptRoot 'shuku-local.py') $Command @ExtraArguments
exit $LASTEXITCODE
