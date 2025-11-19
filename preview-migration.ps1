# Aperçu de la migration - compter combien de stories seraient déplacées

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

# Tester tous les critères
$stories = Get-ChildItem "docs/stories/story-*.md"

$withQAGate = @()
$withStatusTermine = @()
$withPOReview = @()
$withApproved = @()
$withTodosDone = @()

foreach ($story in $stories) {
    $content = Get-Content $story.FullName -Raw
    $storyName = $story.Name

    # Test QA Gate
    if (Test-StoryHasQAGatePass -StoryFileName $storyName) {
        $withQAGate += $storyName
    }

    # Test autres critères
    if ($content -match '\*\*Statut:\*\*.*(?:Terminé|Done|Déjà implémenté)') {
        $withStatusTermine += $storyName
    }

    if (($content -match 'ACCEPTÉE') -and ($content -match 'story est terminée|terminée')) {
        $withPOReview += $storyName
    }

    if ($content -match 'APPROVED|Gate PASS') {
        $withApproved += $storyName
    }

    if (($content -match '\[x\].*\[x\].*\[x\]' -and $content -match '(ACCEPTÉE|APPROVED|Gate PASS)')) {
        $withTodosDone += $storyName
    }
}

Write-Host "=== APERÇU DE LA MIGRATION ==="
Write-Host "Stories dans docs/stories: $($stories.Count)"
Write-Host ""
Write-Host "Stories qui seraient déplacées selon les critères:"
Write-Host "- QA Gate PASS: $($withQAGate.Count)"
Write-Host "- Statut explicite Terminé/Done: $($withStatusTermine.Count)"
Write-Host "- PO Review ACCEPTÉE: $($withPOReview.Count)"
Write-Host "- APPROVED/Gate PASS: $($withApproved.Count)"
Write-Host "- Todos + validation: $($withTodosDone.Count)"
Write-Host ""

# Combinaison unique
$allMatching = $withQAGate + $withStatusTermine + $withPOReview + $withApproved + $withTodosDone | Select-Object -Unique
Write-Host "Total stories qui seraient déplacées (union): $($allMatching.Count)"

# Stories qui resteraient
$remaining = $stories | Where-Object { $allMatching -notcontains $_.Name }
Write-Host "Stories qui resteraient: $($remaining.Count)"
