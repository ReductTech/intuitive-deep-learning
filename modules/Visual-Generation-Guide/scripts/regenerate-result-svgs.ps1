param()

$ErrorActionPreference = 'Stop'

$moduleRoot = Split-Path $PSScriptRoot -Parent
$workspaceRoot = Split-Path (Split-Path (Split-Path $moduleRoot -Parent) -Parent) -Parent
$sourcePng = Join-Path $workspaceRoot 'ref_png\00.PNG'
$referenceSvg = Join-Path $workspaceRoot 'ref_svg\00visual-generation.svg'
$assetDirectory = Join-Path $moduleRoot 'assets'
$temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) ("visual-generation-crops-{0}" -f [Guid]::NewGuid())

$results = @(
  @{ Name = '00result-01.svg'; Crop = '2211:1278:6892:2784'; PhotoWidth = 860; PhotoHeight = 500; Width = 399; Height = 234; InnerWidth = 391; InnerHeight = 226 },
  @{ Name = '00result-02.svg'; Crop = '2448:1278:9204:2784'; PhotoWidth = 940; PhotoHeight = 500; Width = 438; Height = 234; InnerWidth = 430; InnerHeight = 226 },
  @{ Name = '00result-03.svg'; Crop = '2211:1288:6892:4153'; PhotoWidth = 860; PhotoHeight = 500; Width = 399; Height = 237; InnerWidth = 391; InnerHeight = 229 },
  @{ Name = '00result-04.svg'; Crop = '2448:1288:9204:4153'; PhotoWidth = 940; PhotoHeight = 500; Width = 438; Height = 237; InnerWidth = 430; InnerHeight = 229 }
)

New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null

try {
  $photoData = @()

  for ($index = 0; $index -lt $results.Count; $index += 1) {
    $result = $results[$index]
    $jpegPath = Join-Path $temporaryDirectory ("result-{0}.jpg" -f ($index + 1))
    & ffmpeg -loglevel error -y -i $sourcePng -vf "crop=$($result.Crop),scale=$($result.PhotoWidth):$($result.PhotoHeight)" -frames:v 1 -q:v 2 -update 1 $jpegPath
    if ($LASTEXITCODE -ne 0) { throw "Failed to crop result $($index + 1)." }

    $dataUri = 'data:image/jpeg;base64,' + [Convert]::ToBase64String([IO.File]::ReadAllBytes($jpegPath))
    $photoData += $dataUri

    $clipId = "resultClip$($index + 1)"
    $cardSvg = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="$($result.Width)" height="$($result.Height)" viewBox="0 0 $($result.Width) $($result.Height)" role="img" aria-label="视觉生成结果 $($index + 1)">
  <defs>
    <clipPath id="$clipId"><rect x="4" y="4" width="$($result.InnerWidth)" height="$($result.InnerHeight)" rx="16"/></clipPath>
  </defs>
  <rect x="0.5" y="0.5" width="$($result.Width - 1)" height="$($result.Height - 1)" rx="19.5" fill="#ffffff" stroke="#dcebe4"/>
  <image x="4" y="4" width="$($result.InnerWidth)" height="$($result.InnerHeight)" preserveAspectRatio="none" clip-path="url(#$clipId)" href="$dataUri" xlink:href="$dataUri"/>
</svg>
"@

    foreach ($directory in @((Split-Path $referenceSvg -Parent), $assetDirectory)) {
      [IO.File]::WriteAllText((Join-Path $directory $result.Name), $cardSvg, [Text.UTF8Encoding]::new($false))
    }
  }

  $overview = [IO.File]::ReadAllText($referenceSvg)
  $imageIndex = 0
  $overview = [regex]::Replace($overview, '<image\s+[^>]+/>', [Text.RegularExpressions.MatchEvaluator]{
    param($match)
    $currentIndex = $script:imageIndex
    $script:imageIndex += 1
    if ($currentIndex -eq 0) { return $match.Value }
    $uri = $photoData[$currentIndex - 1]
    return [regex]::Replace($match.Value, 'data:image/jpeg;base64,[^"]+', $uri)
  })

  [IO.File]::WriteAllText($referenceSvg, $overview, [Text.UTF8Encoding]::new($false))
  $moduleOverview = $overview.Replace(
    'width="2400" height="1350" viewBox="0 0 2400 1350"',
    'width="2120" height="840" viewBox="40 160 2120 840"'
  )
  $moduleOverview = [regex]::Replace(
    $moduleOverview,
    '(?s)\s*<!-- Four independently cropped generated photographs -->.*?</svg>',
    "`r`n  <!-- Generated photographs are revealed as independent SVG cards in the lesson. -->`r`n</svg>"
  )
  [IO.File]::WriteAllText((Join-Path $assetDirectory '00visual-generation.svg'), $moduleOverview, [Text.UTF8Encoding]::new($false))
}
finally {
  if (Test-Path -LiteralPath $temporaryDirectory) {
    Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
  }
}
