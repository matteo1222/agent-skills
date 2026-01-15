# Agent Browser Skill

Claude Code skill for [agent-browser](https://github.com/vercel-labs/agent-browser) - a headless browser automation CLI optimized for AI agents.

## What is agent-browser?

agent-browser is a lightweight, fast browser automation tool built specifically for AI agents. It features:

- **Rust-based CLI** with automatic Node.js fallback
- **Deterministic element selection** using `@e` references from accessibility snapshots
- **AI-optimized workflow** designed for inspect-interact-re-inspect cycles
- **Headless Chromium** with full Playwright capabilities
- **JSON output mode** for structured data extraction

## Installation

```bash
npm install -g agent-browser
agent-browser install  # Downloads Chromium
```

On Linux, install with system dependencies:

```bash
agent-browser install --with-deps
```

## Quick Start

```bash
# Navigate to a page
agent-browser open https://news.ycombinator.com

# Get interactive elements snapshot
agent-browser snapshot -i

# Click an element using ref from snapshot
agent-browser click @e5

# Extract text from element
agent-browser get text @e3

# Take a screenshot
agent-browser screenshot
```

## Key Differences from browser-tools

| Feature | agent-browser | browser-tools |
|---------|--------------|---------------|
| Installation | Global npm package | Local scripts |
| Browser | Headless Chromium | Chrome with remote debugging |
| Element Selection | `@e` refs from snapshots | CSS selectors, picker tool |
| Workflow | CLI-first, stateless | Interactive, stateful |
| Best for | Automation, scripting | Visual debugging, exploration |

## When to Use

Use **agent-browser** when:
- Automating web interactions without visual browser
- Scripting multi-step workflows
- Extracting data from dynamic sites
- Running in headless/server environments
- You need fast, deterministic element selection

Use **browser-tools** when:
- User needs to see/interact with browser
- Debugging requires visual inspection
- Working with user's existing browser session
- Using browser cookies/authentication

## Core Workflow for AI Agents

1. **Navigate**: `agent-browser open <url>`
2. **Inspect**: `agent-browser snapshot -i` (shows interactive elements)
3. **Interact**: Use `@e` refs to click/fill/type
4. **Re-inspect**: `agent-browser snapshot -i` (verify state changes)

This cycle ensures accurate page state tracking and deterministic element selection.

## Examples

### Login Flow

```bash
agent-browser open https://example.com/login
agent-browser snapshot -i
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser snapshot -i  # Verify login success
```

### Data Extraction

```bash
agent-browser open https://example.com/products
agent-browser snapshot -i -s ".product-list" --json | \
  jq '.elements[] | {name: .name, text: .text}'
```

### Multi-Session Management

```bash
# Session 1: Shopping site
agent-browser open https://shop.example.com -s shop

# Session 2: Admin panel
agent-browser open https://admin.example.com -s admin

# Switch between sessions
agent-browser snapshot -i -s shop
agent-browser snapshot -i -s admin
```

## Advanced Usage

### Authentication with Headers

```bash
agent-browser open https://api.example.com \
  --headers '{"Authorization": "Bearer token123"}'
```

### Network Mocking

```bash
agent-browser network mock /api/users mock-data.json
agent-browser open https://example.com
```

### Conditional Interactions

```bash
# Check if element is visible before clicking
if agent-browser is visible @e5 --json | jq -r '.visible'; then
  agent-browser click @e5
fi
```

## Tips for AI Agents

1. **Always use `-i` flag** with snapshots to reduce noise
2. **Add `-c` for compact mode** on large pages
3. **Use `--json` for parsing** in automated workflows
4. **Re-snapshot after actions** to get updated element refs
5. **Scope with `-s` selector** to target page sections
6. **Prefer `@e` refs** over CSS selectors for reliability

## Resources

- [GitHub Repository](https://github.com/vercel-labs/agent-browser)
- [Playwright Documentation](https://playwright.dev)
- Full command reference: `agent-browser --help`

## License

Apache-2.0 (agent-browser project)
