---
name: trellocli
description: Trello CLI for managing boards, lists, and cards. Create, move, search, and read tasks.
---

# Trello CLI

Command-line interface for Trello board management.

## Installation

```bash
cd /path/to/agent-skills/trellocli
npm link
```

## Setup

1. Go to https://trello.com/power-ups/admin
2. Create a new Power-Up (or use existing)
3. Copy your API key
4. Click "Generate a Token" link and authorize
5. Configure the CLI:

```bash
trello config --key YOUR_API_KEY --token YOUR_TOKEN
```

Verify setup:
```bash
trello config
```

## Usage

Run `trello --help` for full command reference.

### List boards and structure

```bash
trello boards                    # List all boards
trello lists <boardId>           # List all lists in a board
trello cards <listId>            # List cards in a list
trello card <cardId>             # Show card details
```

### Create and manage cards

```bash
trello add <listId> --name "Task name" --desc "Description" --due 2024-12-31
trello update <cardId> --name "New name" --desc "Updated desc"
trello move <cardId> --list <targetListId> --pos top
trello archive <cardId>
```

### Search

```bash
trello search "bug"              # Search all boards
trello search "feature" --board <boardId>  # Search specific board
```

### Labels

```bash
trello labels <boardId>          # List all labels on a board
```

### Attachments (for AI image analysis)

```bash
trello attachments <cardId>      # List attachments on a card
trello download <attachmentId> --card <cardId> --out /tmp/image.jpg
```

## Common Workflows

**Move a task to Done:**
```bash
trello boards                     # Find board ID
trello lists <boardId>            # Find "Done" list ID
trello cards <todoListId>         # Find card ID
trello move <cardId> --list <doneListId>
```

**Add a new task:**
```bash
trello lists <boardId>            # Find target list
trello add <listId> --name "Implement feature X" --desc "Details..."
```

**View card images (for AI analysis):**
```bash
trello card <cardId>              # Check if card has attachments
trello attachments <cardId>       # List attachment IDs
trello download <attachmentId> --card <cardId> --out /tmp/screenshot.jpg
# Then use Read tool on /tmp/screenshot.jpg to analyze the image
```

## Data Storage

- `~/.trellocli/config.json` - API key and token
