param([string]$Src, [string]$Out)
Add-Type -AssemblyName System.Drawing

$enc = New-Object Text.UTF8Encoding $false
$html = [IO.File]::ReadAllText((Join-Path $Src "index.html"), $enc)
$css  = [IO.File]::ReadAllText((Join-Path $Src "style.css"), $enc)
$js   = [IO.File]::ReadAllText((Join-Path $Src "script.js"), $enc)

# JPEG encoder, quality 80
$codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object Drawing.Imaging.EncoderParameter([Drawing.Imaging.Encoder]::Quality, [long]80)

function Get-DataUri([string]$path) {
  $img = [Drawing.Image]::FromFile($path)
  $max = 1400
  $scale = [Math]::Min(1.0, $max / [Math]::Max($img.Width, $img.Height))
  $w = [int]($img.Width * $scale); $h = [int]($img.Height * $scale)
  $bmp = New-Object Drawing.Bitmap $w, $h
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = "HighQualityBicubic"
  $g.DrawImage($img, 0, 0, $w, $h)
  $ms = New-Object IO.MemoryStream
  $bmp.Save($ms, $codec, $params)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  return "data:image/jpeg;base64," + [Convert]::ToBase64String($ms.ToArray())
}

$cache = @{}
$html = [regex]::Replace($html, 'src="images/([^"]+)"', {
  param($m)
  $name = $m.Groups[1].Value
  if (-not $cache.ContainsKey($name)) { $cache[$name] = Get-DataUri (Join-Path $Src "images\$name") }
  'src="' + $cache[$name] + '"'
})
# og:image meta points to a local file; not needed in a shared file
$html = [regex]::Replace($html, '\s*<meta property="og:image"[^>]*>', '')

$html = $html.Replace('<link rel="stylesheet" href="style.css">', "<style>`n$css`n</style>")
$html = $html.Replace('<script src="script.js"></script>', "<script>`n$js`n</script>")

[IO.File]::WriteAllText($Out, $html, $enc)
"images embedded: $($cache.Count)"
"size MB: {0:N2}" -f ((Get-Item $Out).Length / 1MB)
