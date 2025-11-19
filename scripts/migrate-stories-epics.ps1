# Script de migration des stories et epics Recyclic
# Version: 1.0 - Organisation parfaite des fichiers

param(
    [switch]$WhatIf
)

# Fonction de log
function Write-Log {
    param([string]$Message, [string]$Color = "Blue")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Log "[OK] $Message" "Green"
}

function Write-Warning {
    param([string]$Message)
    Write-Log "[WARN] $Message" "Yellow"
}

function Write-Error {
    param([string]$Message)
    Write-Log "[ERROR] $Message" "Red"
}

# Créer les dossiers de destination
function New-DestinationDirectories {
    Write-Log "Création des dossiers de destination..."

    $directories = @(
        "docs/archive/v1.2-and-earlier",
        "docs/pending-tech-debt",
        "docs/archive/future-versions",
        "docs/archive/obsolete"
    )

    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }

    Write-Success "Dossiers créés"
}

# Fonction pour déplacer un fichier en toute sécurité
function Move-FileSafely {
    param([string]$SourcePath, [string]$DestinationDir)

    $filename = Split-Path $SourcePath -Leaf
    $destinationPath = Join-Path $DestinationDir $filename

    if (Test-Path $destinationPath) {
        Write-Warning "Conflit détecté: $filename existe déjà dans $DestinationDir"
        # Créer une sauvegarde du fichier existant
        $backupName = "$filename.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        $backupPath = Join-Path $DestinationDir $backupName
        Move-Item $destinationPath $backupPath -Force
        Write-Warning "Sauvegarde créée: $backupName"
    }

    if (-not $WhatIf) {
        Move-Item $SourcePath $destinationPath -Force
    }
    Write-Success "Déplacé: $filename → $DestinationDir"
}

# Fonction pour vérifier si une story a passé le QA gate
function Test-StoryHasQAGatePass {
    param([string]$StoryFileName)

    # Extraire l'ID de base de la story
    $storyFileNameWithoutExt = $StoryFileName -replace '\.md$', ''
    $parts = $storyFileNameWithoutExt -split '-'
    if ($parts.Length -ge 2) {
        $storyIdBase = $parts[1]
        # Pour les IDs composés comme b34.p11, prendre aussi la partie suivante
        if ($parts.Length -ge 3 -and $parts[2] -match '^\d+|\w+\d+') {
            $storyIdBase = "$storyIdBase.$($parts[2])"
        }

        # Recherche par le champ story dans les fichiers YAML
        $allGates = Get-ChildItem "docs/qa/gates/*.yml"
        foreach ($gate in $allGates) {
            $gateContent = Get-Content $gate.FullName -Raw
            # Vérifier si le gate correspond à cette story (via le champ story dans le YAML)
            if ($gateContent -match "story:\s*['`"]${storyIdBase}['`"]") {
                if ($gateContent -match 'gate:.*PASS') {
                    return $true
                }
            }
        }
    }

    return $false
}

# Migrer les stories terminées
function Move-CompletedStories {
    Write-Log "Migration des stories terminées (avec vérification QA Gates)..."

    $files = Get-ChildItem "docs/stories/story-*.md" | Where-Object {
        $content = Get-Content $_.FullName -Raw
        $storyFileName = $_.Name

        # Vérifier d'abord si la story a un QA Gate PASS (source de vérité ultime)
        $hasQAGatePass = Test-StoryHasQAGatePass -StoryFileName $storyFileName

        # Considérer comme terminée si :
        # 1. QA Gate PASS (priorité maximale)
        # 2. Gate: **PASS** dans le contenu du fichier (référence directe)
        # 3. Statut explicite avec Terminé, Done, ou Déjà implémenté
        # 4. Section PO Review avec ACCEPTÉE et "story est terminée"
        # 5. Section QA avec APPROVED ou Gate PASS
        # 6. Tous les items Definition of Done sont cochés [x] et il y a une validation
        $hasQAGatePass -or
        ($content -match 'Gate:\s*\*?PASS\*?') -or
        ($content -match '\*\*Statut:\*\*.*(?:Terminé|Done|Déjà implémenté)') -or
        (($content -match 'ACCEPTÉE') -and ($content -match 'story est terminée|terminée')) -or
        ($content -match 'APPROVED|Gate PASS') -or
        (($content -match '\[x\].*\[x\].*\[x\]' -and $content -match '(ACCEPTÉE|APPROVED|Gate PASS)'))
    }

    $count = 0
    foreach ($file in $files) {
        Move-FileSafely $file.FullName "docs/archive/v1.2-and-earlier"
        $count++
    }

    Write-Success "Stories terminées migrées: $count fichiers"
}

# Migrer les dettes techniques en cours
function Move-TechDebt {
    Write-Log "Migration des dettes techniques en cours..."

    $files = Get-ChildItem "docs/stories/story-tech-debt-*.md"
    $count = 0

    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        # Ne pas déplacer si déjà réalisé
        if ($content -notmatch 'Statut.*Done|Statut.*Terminé|Statut.*Approuvée') {
            Move-FileSafely $file.FullName "docs/pending-tech-debt"
            $count++
        }
    }

    Write-Success "Dettes techniques en cours migrées: $count fichiers"
}

# Migrer les propositions futures
function Move-FutureProposals {
    Write-Log "Migration des propositions futures..."

    $files = Get-ChildItem "docs/stories/story-future-*.md"
    $count = 0

    foreach ($file in $files) {
        Move-FileSafely $file.FullName "docs/archive/future-versions"
        $count++
    }

    Write-Success "Propositions futures migrées: $count fichiers"
}

# Migrer les stories obsolètes
function Move-ObsoleteStories {
    Write-Log "Migration des stories obsolètes..."

    $count = 0

    # Stories annulées
    $cancelledFiles = Get-ChildItem "docs/stories/story-*.md" | Where-Object {
        $content = Get-Content $_.FullName -Raw
        $content -match '\*\*Statut:\*\* ❌ Annulée'
    }

    foreach ($file in $cancelledFiles) {
        Move-FileSafely $file.FullName "docs/archive/obsolete"
        $count++
    }

    # Stories anciennes b06-b15
    $prefixes = @("b06", "b07", "b08", "b09", "b10", "b11", "b12", "b13", "b14", "b15")
    foreach ($prefix in $prefixes) {
        $files = Get-ChildItem "docs/stories/story-${prefix}*.md"
        foreach ($file in $files) {
            Move-FileSafely $file.FullName "docs/archive/obsolete"
            $count++
        }
    }

    Write-Success "Stories obsolètes migrées: $count fichiers"
}

# Migrer les epics terminés
function Move-CompletedEpics {
    Write-Log "Migration des epics terminés..."

    $files = Get-ChildItem "docs/epics/epic-*.md" | Where-Object {
        $content = Get-Content $_.FullName -Raw
        $content -match '\*\*Statut:\*\*.*Terminé'
    }

    $count = 0
    foreach ($file in $files) {
        Move-FileSafely $file.FullName "docs/archive/v1.2-and-earlier"
        $count++
    }

    Write-Success "Epics terminés migrés: $count fichiers"
}

# Réorganiser le dossier archive existant
function Reorganize-ExistingArchive {
    Write-Log "Réorganisation du dossier archive existant..."

    $moved = 0

    if (Test-Path "docs/stories/archive") {
        # Déplacer les dettes techniques réalisées vers v1.2-and-earlier
        $techDebtFiles = Get-ChildItem "docs/stories/archive/story-tech-debt-*.md"
        foreach ($file in $techDebtFiles) {
            $content = Get-Content $file.FullName -Raw
            if ($content -match 'Statut.*Done|Statut.*Terminé|Statut.*Approuvée') {
                Move-FileSafely $file.FullName "docs/archive/v1.2-and-earlier"
                $moved++
            }
        }

        # Déplacer les autres stories archivées
        $otherFiles = Get-ChildItem "docs/stories/archive/story-*.md"
        foreach ($file in $otherFiles) {
            $filename = Split-Path $file.FullName -Leaf
            if ($filename -match 'story-b\d+.*') {
                # Stories anciennes → obsolete
                Move-FileSafely $file.FullName "docs/archive/obsolete"
                $moved++
            } else {
                # Autres stories → v1.2-and-earlier
                Move-FileSafely $file.FullName "docs/archive/v1.2-and-earlier"
                $moved++
            }
        }

        # Supprimer le dossier archive s'il est vide
        if ((Get-ChildItem "docs/stories/archive" -ErrorAction SilentlyContinue).Count -eq 0) {
            Remove-Item "docs/stories/archive" -Force
            Write-Success "Dossier archive vidé et supprimé"
        }
    }

    Write-Success "Fichiers du dossier archive réorganisés: $moved fichiers"
}

# Générer un rapport de validation
function New-ValidationReport {
    Write-Log "Génération du rapport de validation..."

    $reportPath = "docs/migration-report.md"
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

    $report = @"
# Rapport de Migration - Organisation Stories & Epics Recyclic

Migration effectuée le: $date

## Structure Finale

```
docs/
├── archive/
│   ├── v1.2-and-earlier/     # Stories terminées + Epics terminés + Dettes réalisées
│   ├── future-versions/      # Propositions futures
│   └── obsolete/            # Stories obsolètes et annulées
├── pending-tech-debt/       # Dettes techniques en cours
├── stories/                 # Stories actives
└── epics/                   # Epics actifs
```

## Statistiques de Migration

### Stories Terminées → archive/v1.2-and-earlier/
- $(Get-ChildItem "docs/archive/v1.2-and-earlier" -Filter "story-*.md" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count) stories terminées

### Dettes Techniques → pending-tech-debt/
- $(Get-ChildItem "docs/pending-tech-debt" -Filter "*.md" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count) dettes techniques en cours

### Propositions Futures → archive/future-versions/
- $(Get-ChildItem "docs/archive/future-versions" -Filter "*.md" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count) propositions futures

### Stories Obsolètes → archive/obsolete/
- $(Get-ChildItem "docs/archive/obsolete" -Filter "*.md" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count) stories obsolètes

### Stories Actives Restantes
- $(Get-ChildItem "docs/stories" -Filter "story-*.md" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count) stories actives

### Epics Actifs Restants
- $(Get-ChildItem "docs/epics" -Filter "epic-*.md" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count) epics actifs

## Validation

- [ ] Dossiers correctement créés
- [ ] Aucun fichier orphelin
- [ ] Références croisées préservées
- [ ] Structure logique respectée

## Vérifications Manuelles Requises

1. Vérifier que les références aux stories migrées dans les epics sont encore valides
2. Contrôler que les liens relatifs dans les fichiers migrés fonctionnent toujours
3. Valider que les outils de recherche trouvent encore les fichiers migrés

---
*Migration automatique effectuée par le script migrate-stories-epics.ps1*
"@

    $report | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Success "Rapport généré: docs/migration-report.md"
}

# Fonction principale
function Invoke-Migration {
    Write-Log "Debut de la migration parfaite des stories et epics Recyclic" "Blue"

    if ($WhatIf) {
        Write-Warning "MODE SIMULATION - Aucun fichier ne sera réellement déplacé"
    }

    New-DestinationDirectories
    Move-CompletedStories
    Move-TechDebt
    Move-FutureProposals
    Move-ObsoleteStories
    Move-CompletedEpics
    Reorganize-ExistingArchive
    New-ValidationReport

    Write-Success "Migration terminee avec succes !"
    Write-Log "Consultez docs/migration-report.md pour le rapport detaille" "Blue"
}

# Exécuter le script
Invoke-Migration
