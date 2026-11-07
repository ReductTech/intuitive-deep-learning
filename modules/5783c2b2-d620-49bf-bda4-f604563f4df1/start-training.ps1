$ErrorActionPreference = 'Stop'
$trainingRepository = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$trainingPython = Join-Path $trainingRepository '.venv/Scripts/python.exe'
if (-not (Test-Path -LiteralPath $trainingPython)) { throw '请先准备项目的 .venv Python 环境。' }
if (-not (Test-Path -LiteralPath (Join-Path $trainingRepository 'datasets/models/resnet18-f37072fd.pth'))) { throw '请先将官方 ResNet-18 预训练权重放到 datasets/models/resnet18-f37072fd.pth。' }
$env:PYTHONPATH = Join-Path $trainingRepository 'backend/src'
try {
    $trainingHealth = Invoke-RestMethod 'http://127.0.0.1:28431/v1/endpoints' -TimeoutSec 2
    if ($trainingHealth.endpoints -contains '/resnet/recycling/train-head' -and $trainingHealth.endpoints -contains '/resnet/recycling/load-backbone' -and $trainingHealth.endpoints -contains '/resnet/recycling/replace-head') {
        Write-Host '真实训练服务已在运行：http://127.0.0.1:28431'
        return
    }
    throw '28431已有旧版视觉服务，请在它的终端停止后再重新启动。'
} catch [System.Net.Http.HttpRequestException] { }
catch [System.Net.WebException] { }
Push-Location $trainingRepository
try {
    & $trainingPython -m idl_backend serve --kind vision --host 127.0.0.1 --port 28431 --workers 1 --device cpu --dev
    if ($LASTEXITCODE -ne 0) { throw '真实训练服务启动失败，请查看上方错误。' }
} finally { Pop-Location }
