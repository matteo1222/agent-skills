---
name: session-manager
description: Manage, export, and delete Claude Code sessions. Use when user wants to clean up old sessions, check storage usage, export conversation history, or interactively browse/delete sessions via TUI.
---

# Session Manager

Manage, export, and delete Claude Code sessions with interactive TUI support.

## Setup

```bash
# Add to PATH (optional)
ln -s ~/.claude/skills/session-manager/session-manager ~/.local/bin/
```

## Quick Start

```bash
# Launch interactive TUI (default)
session-manager

# View storage stats
session-manager stats

# List sessions
session-manager list

# Delete old sessions (with confirmation)
session-manager delete --older 30d
```

## Commands

| Command | Description |
|---------|-------------|
| `stats` | Show storage statistics |
| `list` | List sessions with preview of first message |
| `projects` | List projects by size |
| `get <id>` | Show session details + conversation preview |
| `export <id...>` | Export sessions to JSON/markdown |
| `delete <id...>` | Delete sessions |
| `tui` | Interactive browser with live preview (default) |
| `help [cmd]` | Show help |

## TUI Keybindings

### List View
| Key | Action |
|-----|--------|
| `↑/k` | Move up |
| `↓/j` | Move down |
| `space` | Toggle select |
| `a` | Select all / deselect all |
| `p` | Toggle preview pane |
| `d` | Delete selected |
| `e` | Export selected |
| `enter` | View full session |
| `/` | Filter by project/content |
| `esc` | Clear filter / quit |
| `q` | Quit |

### View Mode (after Enter)
| Key | Action |
|-----|--------|
| `↑/k` | Scroll up |
| `↓/j` | Scroll down |
| `g` | Go to top |
| `G` | Go to bottom |
| `d` | Delete this session |
| `q/esc` | Go back to list |

**Preview pane**: Shows first user message + assistant response. Toggle with `p`.

**List shows**: Size, last active time (with actual time for recent sessions), project, first prompt.

## Common Flags

| Flag | Description |
|------|-------------|
| `-p, --project` | Filter by project (partial match) |
| `--older DATE` | Sessions older than date |
| `--before DATE` | Sessions before date |
| `--after DATE` | Sessions after date |
| `-n, --limit` | Number of results |
| `-s, --sort` | Sort: `modified`, `created`, `size` |
| `--preview` | Show full message preview (list) |
| `--messages N` | Show N conversation messages (get) |
| `--json` | Machine-readable JSON output |
| `--dry-run` | Preview only (delete) |
| `-y, --yes` | Skip confirmation |

## Date Formats

- Relative: `7d` (days), `2w` (weeks), `1m` (months)
- Absolute: `YYYY-MM-DD`

## Examples

```bash
# Storage overview
session-manager stats

# List sessions with first message preview
session-manager list --preview

# List largest sessions
session-manager list -s size -n 10

# List sessions from specific project
session-manager list -p my-project

# Get session with conversation (10 messages)
session-manager get abc123 --messages 10

# Export session to markdown
session-manager export abc123 -f md -o backup.md

# Export all old sessions before deleting
session-manager export --older 30d -o ./archive/

# Preview what would be deleted
session-manager delete --older 60d --dry-run

# Delete old sessions (interactive confirm)
session-manager delete --older 30d

# Delete without confirmation
session-manager delete --older 30d --yes

# Interactive TUI with live preview
session-manager

# TUI with pre-filter
session-manager tui --older 30d
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid usage |
| 3 | Session not found |
| 4 | User cancelled |

## Files

```
~/.claude/projects/           # Session storage
  {project-name}/
    sessions-index.json       # Session metadata index
    {session-id}.jsonl        # Session conversation
    {session-id}/             # Subagent threads
```

## When to Use

- **Check disk usage**: `session-manager stats`
- **Preview what sessions contain**: `session-manager list --preview` or TUI
- **View session conversation**: `session-manager get <id> --messages 10`
- **Clean up old sessions**: `session-manager delete --older 30d`
- **Export before cleanup**: `session-manager export --older 30d -o ./backup/`
- **Browse and delete interactively**: `session-manager` (TUI with live preview)
- **Find large sessions**: `session-manager list -s size`

## AI Agent Usage

For AI agents reviewing sessions programmatically:

```bash
# Get sessions with preview for analysis
session-manager list --json --preview -n 50

# Get full conversation for a specific session
session-manager get <session-id> --json
```
