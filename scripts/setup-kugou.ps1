$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$local = Join-Path $root '.local'
$target = Join-Path $local 'KuGouMusicApi'
$archive = Join-Path $local 'KuGouMusicApi.zip'
$expanded = Join-Path $local 'KuGouMusicApi-main'

if (Test-Path -LiteralPath (Join-Path $target 'main.js')) {
    exit 0
}

New-Item -ItemType Directory -Force -Path $local | Out-Null
Invoke-WebRequest -Uri 'https://codeload.github.com/MakcRe/KuGouMusicApi/zip/refs/heads/main' -OutFile $archive
Expand-Archive -LiteralPath $archive -DestinationPath $local -Force
Move-Item -LiteralPath $expanded -Destination $target
Remove-Item -LiteralPath $archive -Force
