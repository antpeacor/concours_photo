# Scans photos/ and rewrites photos.json: filenames become both the id (slug)
# and the displayed title. Run this after adding/removing/renaming files in photos/.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$photosDir = Join-Path $root "photos"
$outFile = Join-Path $root "photos.json"
$extensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif")

$files = Get-ChildItem -Path $photosDir -File |
  Where-Object { $extensions -contains $_.Extension.ToLowerInvariant() } |
  Sort-Object -Property Name -Culture "fr-FR"

function ConvertTo-Slug([string]$text) {
  $normalized = $text.Normalize([Text.NormalizationForm]::FormD)
  $sb = New-Object System.Text.StringBuilder
  foreach ($ch in $normalized.ToCharArray()) {
    $cat = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($ch)
    if ($cat -ne [Globalization.UnicodeCategory]::NonSpacingMark) { [void]$sb.Append($ch) }
  }
  $slug = $sb.ToString().ToLowerInvariant()
  $slug = [Regex]::Replace($slug, "[^a-z0-9]+", "-")
  return $slug.Trim("-")
}

function ConvertTo-JsonString([string]$text) {
  $escaped = $text -replace '\\', '\\\\' -replace '"', '\"'
  return '"' + $escaped + '"'
}

$seen = @{}
$lines = @("[")
$entries = @()
foreach ($f in $files) {
  $title = [IO.Path]::GetFileNameWithoutExtension($f.Name) -replace "[_-]+", " "
  $title = ($title -replace "\s+", " ").Trim()
  $id = ConvertTo-Slug $title
  if (-not $id) { $id = "photo" }
  $unique = $id
  $n = 2
  while ($seen.ContainsKey($unique)) { $unique = "$id-$n"; $n++ }
  $seen[$unique] = $true
  $entries += "  { ""id"": $(ConvertTo-JsonString $unique), ""file"": $(ConvertTo-JsonString "photos/$($f.Name)"), ""title"": $(ConvertTo-JsonString $title) }"
}
$lines += ($entries -join ",`n")
$lines += "]"

$content = ($lines -join "`n") + "`n"
[IO.File]::WriteAllText($outFile, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "photos.json updated with $($files.Count) photo(s)."
