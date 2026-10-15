---
name: mdview
description: Open a markdown file in the browser as a styled page with syntax-highlighted code, GFM tables and task lists, Mermaid diagrams, and relative images. Use when the user wants to view, preview, or render a .md file rather than read it as plain text.
---

# mdview

Beautiful markdown file viewer in browser.

## Usage

```bash
mdview <file.md>
```

Opens markdown file in browser with:
- Beautiful typography (Cormorant Garamond serif)
- Syntax highlighted code blocks
- GFM support (tables, task lists, etc.)
- Mermaid diagrams (flowcharts, ER diagrams, sequence diagrams, etc.)
- Relative image support

## Examples

```bash
# View a markdown file
mdview README.md

# View any .md file
mdview ~/notes/meeting.md
```

## Requirements

- Bun runtime (uses Bun.serve)

## How it works

Starts local server on random port 8420-8500, serves HTML viewer + markdown file, opens browser. Press Ctrl+C to stop.
