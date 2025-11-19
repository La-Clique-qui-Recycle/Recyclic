# Test script pour vérifier les QA gates
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
        Write-Host "Testing story: $StoryFileName -> ID: $storyIdBase"

        # Recherche par le champ story dans les fichiers YAML
        $allGates = Get-ChildItem "docs/qa/gates/*.yml"
        foreach ($gate in $allGates) {
            $gateContent = Get-Content $gate.FullName -Raw
            # Vérifier si le gate correspond à cette story (via le champ story dans le YAML)
            if ($gateContent -match "story:\s*['`"]${storyIdBase}['`"]") {
                Write-Host "Found matching gate: $($gate.Name)"
                if ($gateContent -match 'gate:.*PASS') {
                    Write-Host "Gate status: PASS"
                    return $true
                } else {
                    Write-Host "Gate status: NOT PASS"
                }
            }
        }
        Write-Host "No matching gate found for story ID: $storyIdBase"
    } else {
        Write-Host "Could not extract story ID from: $StoryFileName"
    }

    return $false
}

# Tester avec quelques stories
$testStories = @('story-1.4-authentification-et-routes-protegees.md', 'story-3.1-creation-super-admin-roles.md', 'story-b34-p11-validation-migrations.md')
foreach ($story in $testStories) {
    $hasGate = Test-StoryHasQAGatePass -StoryFileName $story
    Write-Host ($story + ' -> QA Gate PASS: ' + $hasGate)
}
