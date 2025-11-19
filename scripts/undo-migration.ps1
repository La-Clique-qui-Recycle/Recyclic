# Script pour annuler la migration des stories et epics Recyclic

function Write-Log {
    param([string]$Message, [string]$Color = "Blue")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Log "[OK] $Message" "Green"
}

# Fonction pour déplacer un fichier
function Move-File {
    param([string]$SourcePath, [string]$DestinationDir)

    $filename = Split-Path $SourcePath -Leaf
    $destinationPath = Join-Path $DestinationDir $filename

    if (-not $WhatIf) {
        Move-Item $SourcePath $destinationPath -Force
    }
    Write-Success "Remis: $filename → $DestinationDir"
}

# Remettre les stories terminées
Write-Log "Remise en place des stories terminées..."
$completedStories = Get-ChildItem "docs/archive/v1.2-and-earlier/story-*.md" -Recurse
foreach ($file in $completedStories) {
    Move-File $file.FullName "docs/stories"
}

# Remettre les epics terminés
Write-Log "Remise en place des epics terminés..."
$completedEpics = Get-ChildItem "docs/archive/v1.2-and-earlier/epic-*.md" -Recurse
foreach ($file in $completedEpics) {
    Move-File $file.FullName "docs/epics"
}

# Remettre les dettes techniques (celles qui étaient déjà réalisées)
Write-Log "Remise en place des dettes techniques réalisées..."
$techDebtDone = Get-ChildItem "docs/archive/v1.2-and-earlier/story-tech-debt-*.md" -Recurse
foreach ($file in $techDebtDone) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match 'Statut.*Done|Statut.*Terminé|Statut.*Approuvée') {
        Move-File $file.FullName "docs/stories"
    }
}

Write-Success "Remise en place terminée - pret pour nouvelle migration"
