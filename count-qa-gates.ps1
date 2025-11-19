# Script pour compter combien de stories dans docs/stories ont des QA gates PASS
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

# Compter les stories qui ont des QA gates PASS
$storiesWithQAGates = Get-ChildItem "docs/stories/story-*.md" | Where-Object {
    Test-StoryHasQAGatePass -StoryFileName $_.Name
}

Write-Host "Stories avec QA Gates PASS: $($storiesWithQAGates.Count)"

# Lister les stories qui n'ont pas encore été déplacées mais qui ont des QA gates PASS
$alreadyMoved = Get-ChildItem "docs/archive/v1.2-and-earlier/story-*.md" | Select-Object -ExpandProperty Name
$remainingWithGates = $storiesWithQAGates | Where-Object { $alreadyMoved -notcontains $_.Name }

Write-Host "Stories restantes avec QA Gates PASS (pas encore déplacées): $($remainingWithGates.Count)"
foreach ($story in $remainingWithGates) {
    Write-Host "  - $($story.Name)"
}
