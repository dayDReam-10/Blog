$notesDir = Join-Path $PSScriptRoot "..\notes"
$outputFile = "notes_data.js"

$notes = @()
if (Test-Path $notesDir) {
    Write-Host "Searching notes in: $notesDir"
    $files = Get-ChildItem -Path $notesDir -Filter *.txt
    foreach ($file in $files) {
        Write-Host "Processing: $($file.Name)"
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        # 兼容可能有不同换行符和编码导致的分割问题
        $parts = $content -split "`r?`n---`r?`n|---`r?`n"
        if ($parts.Count -lt 2) {
            $parts = $content -split "---"
        }
        if ($parts.Count -ge 2) {
            $metaLines = $parts[0] -split "`r?`n|`n"
            
            $noteProps = @{
                title = "Untitled"
                datetime = "2024.01.01 / 00:00"
                status = "Note"
                color = "#58a6ff"
                content = ($parts[1].Trim() -replace "`r?`n", "<br>")
            }
            $note = New-Object -TypeName PSObject -Property $noteProps
            
            foreach ($line in $metaLines) {
                if ($line -match "^Title:\s*(.+)$") { $note.title = $matches[1].Trim() }
                if ($line -match "^DateTime:\s*(.+)$") { $note.datetime = $matches[1].Trim() }
                if ($line -match "^Status:\s*(.+)$") { $note.status = $matches[1].Trim() }
                if ($line -match "^Color:\s*(.+)$") { $note.color = $matches[1].Trim() }
            }
            
            $dateOnly = ($note.datetime -split "/")[0].Trim().Replace(".", "-")
            $note | Add-Member -MemberType NoteProperty -Name "date" -Value $dateOnly
            $note | Add-Member -MemberType NoteProperty -Name "idDate" -Value $dateOnly.Replace("-", "")
            
            $notes += $note
        }
    }
}
else {
    Write-Warning "Notes directory not found: $notesDir"
}

Write-Host "Total notes found: $($notes.Count)"
$notes = $notes | Sort-Object -Property @{Expression={$_.date}; Descending=$true}
$json = $notes | ConvertTo-Json -Depth 10

$jsContent = "const notesData = $json;"

# 直接定义完整路径，确保写入位置准确
$assetsPath = Join-Path $PSScriptRoot "notes_data.js"
$rootPath = Join-Path (Split-Path $PSScriptRoot -Parent) "notes_data.js"

[System.IO.File]::WriteAllText($assetsPath, $jsContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($rootPath, $jsContent, [System.Text.Encoding]::UTF8)

Write-Host "Notes updated successfully: $rootPath" -ForegroundColor Green
