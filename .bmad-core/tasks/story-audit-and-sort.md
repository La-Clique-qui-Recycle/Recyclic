<!-- Powered by BMAD™ Core -->

# story-audit-and-sort

Audit and sort all story files in the stories directory based on completion status and relevance. Automatically archive completed stories and flag uncertain ones for manual review.

## Purpose

Clean up the stories directory by automatically categorizing stories into:
- Completed/Archived stories → `docs/archive/v1.2-and-earlier/`
- Future proposals → `docs/archive/future-versions/`
- Active tech debt → `docs/pending-tech-debt/`
- Uncertain/Need manual review → `docs/stories/to-review/`

## Inputs

```yaml
required:
  - stories_directory: 'docs/stories/' # Directory containing all story files
  - archive_completed: 'docs/archive/v1.2-and-earlier/' # Where to move completed stories
  - archive_future: 'docs/archive/future-versions/' # Where to move future proposals
  - pending_debt: 'docs/pending-tech-debt/' # Where to move active tech debt
  - manual_review: 'docs/stories/to-review/' # Where to move uncertain stories
```

## Prerequisites

- Stories directory exists and contains story files
- Archive directories are created and ready
- User has confirmed the categorization approach

## Process

### 1. Directory Scan and Analysis

**For each .md file in docs/stories/:**

#### A. File Type Detection
- **Epic files**: Files starting with "epic-" or containing "epic" in filename
- **Story files**: Files starting with "story-" or following story naming pattern
- **Archived files**: Files with .archived extension (skip, already archived)

#### B. Status Analysis
**Check for completion indicators:**

**✅ COMPLETED indicators:**
- Status: "✅ Terminé" or "✅ Done" or "Completed"
- Contains: "Story terminée" or "Implementation completed"
- Has: "Validation" or "Review" sections with positive outcomes
- Contains: Implementation details with code changes
- File has significant content (>100 lines) suggesting real work

**🔄 ACTIVE indicators:**
- Status: "En cours" or "In Progress" or "Draft"
- Contains: "TODO" or "À faire" sections
- Has: "Next steps" or "Remaining work" sections
- File created recently (< 30 days)

**💭 FUTURE indicators:**
- Contains: "Proposition" or "Future" or "Roadmap" in title/content
- File created > 90 days ago with no implementation details
- Contains version numbers > current version
- Purely conceptual without concrete implementation

**🔍 UNCERTAIN indicators:**
- No clear status indicators
- Mixed signals (some completed, some pending)
- File needs manual verification

### 2. Automatic Categorization

#### Rule-Based Sorting:

**→ Archive (Completed):**
```yaml
if status == "✅ Terminé" OR status == "✅ Done" OR
   contains("Story terminée") OR contains("Implementation completed") OR
   has_validation_section AND file_size > 100:
   move to docs/archive/v1.2-and-earlier/
```

**→ Future Proposals:**
```yaml
if contains("Proposition") OR contains("Future") OR contains("Roadmap") OR
   contains("v1.4") OR contains("v1.5") OR contains("v2.0") OR
   created > 90_days AND no_implementation_details:
   move to docs/archive/future-versions/
```

**→ Active Tech Debt:**
```yaml
if contains("tech-debt") OR contains("dette technique") OR
   contains("debt") OR filename contains "debt" OR
   contains("stabilization") OR contains("fix") AND ongoing:
   move to docs/pending-tech-debt/
```

**→ Manual Review:**
```yaml
if uncertain_signals OR mixed_indicators OR needs_human_judgment:
   move to docs/stories/to-review/
```

### 3. File Movement with Metadata

**For each moved file:**
- Preserve original filename
- Create symlink in original location pointing to new location
- Add categorization metadata as YAML frontmatter:

```yaml
---
categorized_by: story-audit-and-sort
categorized_date: 2025-11-17
category: completed|future|debt|review
original_path: docs/stories/filename.md
rationale: "Status shows 'Terminé' and has validation section"
---
```

### 4. Summary Report

**Generate categorization report:**

```markdown
# Story Audit Report - 2025-11-17

## Summary
- Total files processed: X
- Completed stories archived: X
- Future proposals moved: X
- Active tech debt preserved: X
- Files needing review: X

## Detailed Actions
### Archived Stories
- story-b33-p1-filename.md → Completed IAM work
- story-b35-p2-filename.md → Performance optimization done

### Future Proposals
- story-future-ai-integration.md → v2.0 feature proposal

### Active Tech Debt
- story-tech-debt-testing-fixes.md → Ongoing stabilization work

### Manual Review Needed
- story-unclear-status.md → Mixed completion signals
```

## Quality Gates

### Completion Verification
- [ ] All files processed
- [ ] No files lost during movement
- [ ] Symlinks created for backward compatibility
- [ ] Categorization report generated

### Safety Checks
- [ ] No active stories accidentally archived
- [ ] Important files flagged for manual review
- [ ] Archive structure maintained

## Error Handling

**If categorization uncertain:**
- Move to `docs/stories/to-review/` for manual decision
- Add detailed rationale in metadata

**If file movement fails:**
- Log error and continue with next file
- Generate error report for manual fixing

## Success Criteria

- Stories directory cleaned and organized
- Archive directories populated with correctly categorized files
- Manual review folder contains only truly uncertain files
- Backward compatibility maintained via symlinks
- Comprehensive audit report generated

## Usage

```bash
@dev
*story-audit-and-sort
```

This task will systematically clean up the stories directory while preserving access to all content.
