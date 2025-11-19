$gatesPass = (Get-ChildItem docs/qa/gates/*.yml | Where-Object { (Get-Content $_.FullName) -match 'gate:.*PASS' }).Count
Write-Host "Total QA Gates PASS: $gatesPass"

$storiesInStories = (Get-ChildItem docs/stories/story-*.md).Count
Write-Host "Stories dans docs/stories: $storiesInStories"

$storiesInArchive = (Get-ChildItem docs/archive/v1.2-and-earlier/story-*.md).Count
Write-Host "Stories déjà archivées: $storiesInArchive"
