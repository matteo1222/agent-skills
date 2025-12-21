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
