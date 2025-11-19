# Script pour déplacer les fichiers qui ont Gate: **PASS** dans leur contenu

$filesWithGatePass = Get-ChildItem "docs/stories/story-*.md" | Where-Object {
    (Get-Content $_.FullName -Raw) -match 'Gate:\s*\*\*PASS\*\*'
}

Write-Host "Fichiers avec Gate PASS trouvés: $($filesWithGatePass.Count)"

foreach ($file in $filesWithGatePass) {
    $destination = "docs/archive/v1.2-and-earlier"
    if (-not (Test-Path $destination)) {
        New-Item -ItemType Directory -Path $destination -Force | Out-Null
    }

    $filename = Split-Path $file.FullName -Leaf
    $destinationPath = Join-Path $destination $filename

    if (Test-Path $destinationPath) {
        $backupName = "$filename.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        $backupPath = Join-Path $destination $backupName
        Move-Item $destinationPath $backupPath -Force
        Write-Host "Sauvegarde créée: $backupName"
    }

    Move-Item $file.FullName $destinationPath -Force
    Write-Host "Déplacé: $filename → $destination"
}

Write-Host "Migration des fichiers Gate PASS terminée: $($filesWithGatePass.Count) fichiers déplacés"
