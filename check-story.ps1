$content = Get-Content 'docs/stories/story-fe-link-account-logic.md' -Raw

$hasGatePass = $content -match 'Gate:\s*\*\*PASS\*\*'
Write-Host "Contient Gate: **PASS**: $hasGatePass"

$hasGatePassSimple = $content -match 'Gate:\s*PASS'
Write-Host "Contient Gate: PASS: $hasGatePassSimple"

$hasReadyForDone = $content -match 'Ready for Done'
Write-Host "Contient Ready for Done: $hasReadyForDone"

# Tester notre logique de détection
$matchesCriteria = $hasGatePass -or $hasGatePassSimple -or $hasReadyForDone
Write-Host "Devrait être déplacée: $matchesCriteria"
