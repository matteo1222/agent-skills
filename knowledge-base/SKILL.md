---
name: knowledge-base
description: Personal knowledge base workflow using PARA + Evergreen notes structure. Capture, process, and retrieve knowledge.
---

# Knowledge Base Skill

Manage a personal knowledge base using two complementary systems:
- **PARA** (Projects, Areas, Resources, Archive) — action-oriented
- **Evergreen Notes** (Andy Matuschak style) — insight-oriented

## Repository Structure

```
knowledge/
├── para/
│   ├── projects/      # Active work with deadlines
│   ├── areas/         # Ongoing responsibilities
│   ├── resources/     # Topic-based reference
│   └── archive/       # Completed/inactive
├── evergreen/
│   ├── inbox/         # Daily captures (YYYY-MM-DD.md)
│   ├── notes/         # Atomic evergreen notes
│   ├── references/    # Source material summaries
│   └── tags.md        # Canonical tag list
└── README.md
```

## Workflows

### 1. Capture

When user sends content to save:

```bash
# Add to today's inbox
INBOX="~/knowledge/evergreen/inbox/$(date +%Y-%m-%d).md"

# Append with timestamp
echo -e "\n---\n## $(date +%H:%M) - [Title]\n\n[Content]\n\nSource: [URL if applicable]" >> "$INBOX"
```

Always:
1. Timestamp the entry
2. Include source URL if available
3. Add minimal context

### 2. Tag Consistency

Before assigning tags:

```bash
# Check canonical tags
cat ~/knowledge/evergreen/tags.md
```

Rules:
- Use existing tags from `tags.md`
- If new concept needed, add to `tags.md` first
- Prefer broad tags over narrow (e.g., `payments` not `stripe-webhooks`)

### 3. Create Evergreen Note

When an insight is worth keeping permanently:

```markdown
---
tags: [topic1, topic2]
created: YYYY-MM-DD
---

# [Title as declarative statement]

One sentence summary of the insight.

## Why

- Key reason 1
- Key reason 2

## Evidence

- Supporting point
- Example or source

## Links

- [[related-note]]
```

Title rules:
- Write as statement, not topic: "Drizzle beats Prisma on edge" not "Drizzle vs Prisma"
- Should be scannable and searchable
- Capture the insight, not just the subject

### 4. Create Reference

When saving source material:

```markdown
---
tags: [topic]
created: YYYY-MM-DD
source: [URL]
author: [Name]
---

# [Source Title]

## Summary

One paragraph summary in own words.

## Key Points

- Point 1
- Point 2

## Quotes

> Notable quote

## My Take

Personal reaction or application.

## Links

- [[related-note]]
```

### 5. Process Inbox

Periodically review inbox entries:

```bash
# Show recent inbox files
ls -la ~/knowledge/evergreen/inbox/

# Read specific day
cat ~/knowledge/evergreen/inbox/2026-01-06.md
```

For each item decide:
- **Trash** — delete it
- **Reference** — move to `evergreen/references/`
- **Evergreen** — create note in `evergreen/notes/`
- **Project** — move to relevant `para/projects/` folder

### 6. Retrieval

When user asks "what do I know about X":

```bash
# Semantic search (preferred)
qmd query "X" ~/knowledge/

# Keyword search
qmd search "specific term" ~/knowledge/

# Grep fallback
grep -r "keyword" ~/knowledge/evergreen/notes/
```

Synthesize results into coherent answer.

### 7. Tag Maintenance

Periodically audit tags:

```bash
# Find all tags in use
grep -rh "^tags:" ~/knowledge/evergreen/ | sort | uniq -c | sort -rn
```

Look for:
- Orphan tags (used once)
- Variant spellings
- Tags not in `tags.md`

## Commit Convention

```bash
cd ~/knowledge
git add -A
git commit -m "type: description"
git push
```

Types:
- `capture:` — new inbox entry
- `note:` — new evergreen note
- `reference:` — new reference
- `project:` — project updates
- `archive:` — moved to archive
- `tags:` — tag updates

## Integration with qmd

Index for semantic search:

```bash
qmd index ~/knowledge/
```

Re-index after significant additions.

## Key Principles

1. **Capture fast, process later** — inbox is for speed
2. **Titles as insights** — notes should be scannable
3. **Tags from canonical list** — consistency over creativity
4. **Extract before archive** — pull insights from projects before archiving
5. **Link generously** — connections surface patterns
