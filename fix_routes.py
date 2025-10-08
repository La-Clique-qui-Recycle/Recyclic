#!/usr/bin/env python3
"""Script to reorder routes in categories.py"""

import re

file_path = "api/src/recyclic_api/api/api_v1/endpoints/categories.py"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the export route
export_pattern = r'(@router\.get\(\s*"/export".*?return breadcrumb)\n\n\n@router\.get\(\s*"/export".*?\n\)'
match = re.search(r'@router\.get\(\s*"/export".*?\n\)', content, re.DOTALL)

if not match:
    print("Export route not found!")
    exit(1)

export_route = match.group(0)

# Remove export route from its current position
content_without_export = content.replace('\n\n\n' + export_route, '')

# Find where to insert (after /hierarchy, before /{category_id})
insertion_point = content_without_export.find('@router.get(\n    "/{category_id}"')

if insertion_point == -1:
    print("Insertion point not found!")
    exit(1)

# Insert export route before /{category_id}
new_content = (
    content_without_export[:insertion_point] +
    export_route + '\n\n\n' +
    content_without_export[insertion_point:]
)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Routes reordered successfully!")
