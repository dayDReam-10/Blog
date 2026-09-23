$projectRoot = Split-Path $PSScriptRoot -Parent
$notesDir = Join-Path $projectRoot "notes"
$dataDir = Join-Path $projectRoot "assets\data"

$notes = @()
if (Test-Path -LiteralPath $notesDir) {
    Write-Host "Searching notes in: $notesDir"
    foreach ($file in Get-ChildItem -LiteralPath $notesDir -Filter *.txt -File) {
        Write-Host "Processing: $($file.Name)"
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        $separatorIndex = $content.IndexOf("---")
        if ($separatorIndex -lt 0) {
            Write-Warning "Skipping note without metadata separator: $($file.Name)"
            continue
        }

        $metaPart = $content.Substring(0, $separatorIndex).Trim()
        $contentPart = $content.Substring($separatorIndex + 3).Trim()
        $note = [PSCustomObject]@{
            title = "Untitled"
            datetime = "2024.01.01 / 00:00"
            status = "Note"
            color = "#58a6ff"
            content = ($contentPart -replace '\r?\n', "<br>")
        }

        foreach ($line in ($metaPart -split '\r?\n')) {
            if ($line -match '^Title:\s*(.+)$') { $note.title = $matches[1].Trim() }
            if ($line -match '^DateTime:\s*(.+)$') { $note.datetime = $matches[1].Trim() }
            if ($line -match '^Status:\s*(.+)$') { $note.status = $matches[1].Trim() }
            if ($line -match '^Color:\s*(.+)$') { $note.color = $matches[1].Trim() }
            if ($line -match '^Id:\s*(.+)$') { $note | Add-Member -MemberType NoteProperty -Name noteId -Value $matches[1].Trim() -Force }
        }

        $dateText = ($note.datetime -split "/")[0].Trim()
        $dateOnly = $dateText.Replace(".", "-")
        try { $dateOnly = ([datetime]::Parse($dateText)).ToString("yyyy-MM-dd") } catch { }
        $note | Add-Member -MemberType NoteProperty -Name date -Value $dateOnly
        $idDate = if ($note.noteId) { $note.noteId } else { $dateOnly.Replace("-", "") }
        $note | Add-Member -MemberType NoteProperty -Name idDate -Value $idDate
        $notes += $note
    }
}

Write-Host "Total notes found: $($notes.Count)"
$notes = $notes | Sort-Object -Property @{ Expression = { $_.date }; Descending = $true }
$json = if ($notes.Count) { $notes | ConvertTo-Json -Depth 10 } else { "[]" }
$assetsPath = Join-Path $dataDir "notes_data.js"
if (-not (Test-Path -LiteralPath $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}
[System.IO.File]::WriteAllText($assetsPath, "const notesData = $json;", [System.Text.Encoding]::UTF8)
Write-Host "Notes updated successfully: $assetsPath" -ForegroundColor Green
