function Resolve-DevelopmentPython {
  param([string]$Requested, [string]$Kind = 'all', [switch]$ManagementOnly)

  $required = @('psutil')
  if (-not $ManagementOnly) {
    $required += 'dotenv'
    if ($Kind -in @('all','assessment','vision','api')) { $required += 'cryptography' }
    if ($Kind -in @('all','assessment')) { $required += @('langchain_core','pydantic') }
    if ($Kind -in @('all','vision')) { $required += @('torch','numpy','PIL') }
    if ($Kind -in @('all','api')) { $required += @('fastapi','uvicorn','sqlalchemy','mysql.connector','psycopg','psycopg_pool','oss2') }
  }
  $probe = 'import importlib.util,json,sys; missing=[]' + "`n" + 'for name in sys.argv[1:]: ' + "`n" + ' try: found=importlib.util.find_spec(name)' + "`n" + ' except (ImportError,ValueError): found=None' + "`n" + ' if found is None: missing.append(name)' + "`n" + 'print(json.dumps(dict(executable=sys.executable,missing=missing)))'
  $candidates = if ($Requested) {
    @($Requested)
  } else {
    @((Get-Command python -All -ErrorAction SilentlyContinue | ForEach-Object { $_.Source })) +
      @("$env:USERPROFILE\anaconda3\python.exe", "$env:USERPROFILE\miniconda3\python.exe")
  }
  $failures = @()
  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    if (-not $candidate -or $candidate -like '*\WindowsApps\*') { continue }
    try {
      $output = & $candidate -c $probe @required 2>$null
      if ($LASTEXITCODE -ne 0) { $failures += "${candidate}: cannot run"; continue }
      $result = $output | ConvertFrom-Json
      if ($result.missing.Count -eq 0) { return $result.executable }
      $failures += "${candidate}: missing $($result.missing -join ', ')"
    } catch { $failures += "${candidate}: cannot run" }
  }
  throw ("No Python environment has the dependencies for '$Kind'. Use -Python <path> or set IDL_PYTHON to your configured interpreter.`n" + ($failures -join "`n"))
}
