---
name: search-past-sessions
description: Use when needing to find past Claude Code conversations, search session history, or recall previous work - indexes and searches sessions with qmd
---

# Search Past Sessions

Search and retrieve past Claude Code conversations.

## Setup (One-Time)

### Keep Sessions Forever
Add to `~/.claude/settings.json`:
```json
{ "cleanupPeriodDays": 99999 }
```

### Add to PATH (optional)
```bash
ln -s ~/.claude/skills/search-past-sessions/claude-sessions ~/.local/bin/
```

## CLI Usage

### Project Scope
By default, searches only the **current project** (detected from git root).
- Use `--all` to search all projects
- Use `-p <name>` for a specific project

### Sync (parse & index new sessions)
```bash
claude-sessions sync
```

### Search
```bash
claude-sessions search "authentication"              # current project
claude-sessions search "refactor" --all              # all projects
claude-sessions search "bug" -p web-mono --after 7d  # specific project
```

### List Sessions
```bash
claude-sessions list                    # current project
claude-sessions list --all              # all projects
claude-sessions list --after 7d         # last 7 days
claude-sessions list --json             # machine-readable
```

### Get Full Session
```bash
claude-sessions get <session-id>
claude-sessions get abc123 -l 100       # first 100 lines
```

## Flags

| Flag | Description |
|------|-------------|
| `-a, --all` | Search all projects (default: current project) |
| `-n, --limit N` | Number of results (default: 10) |
| `--after DATE` | After date (YYYY-MM-DD, "7d", "2w", "1m") |
| `--before DATE` | Before date |
| `-p, --project PATH` | Filter by project (partial match) |
| `-b, --branch NAME` | Filter by git branch |
| `--json` | Machine-readable JSON output |
| `-q, --quiet` | Suppress non-essential output |

## What Gets Indexed

**Extracted:**
- User messages (questions, requests)
- Assistant text responses
- Thinking blocks (reasoning)
- Session summary
- Metadata: project, branch, date

**Filtered out:**
- JSON syntax noise
- file-history-snapshot, progress, system
- Tool calls & results
- System reminders

## Direct qmd Access

For advanced queries, use qmd directly:

```bash
# Vector search (requires embeddings)
qmd embed -c claude-sessions
qmd vsearch "concept" -c claude-sessions

# Combined search with reranking
qmd query "topic" -c claude-sessions

# Read specific file
qmd get qmd://claude-sessions/path/to/session.md
```

## Files

```
~/.claude/skills/search-past-sessions/
├── SKILL.md           # This doc
├── claude-sessions    # CLI tool
└── parse-sessions.js  # JSONL → Markdown parser

~/.cache/claude-sessions-md/   # Parsed sessions
```
