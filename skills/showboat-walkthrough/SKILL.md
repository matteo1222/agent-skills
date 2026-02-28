---
name: showboat-walkthrough
description: Build a linear, executable walkthrough of a codebase using showboat. Use when asked to explain how code works, create a code walkthrough, or document a codebase.
allowed-tools: Bash(showboat:*), Bash(uvx showboat:*)
---

# Showboat Walkthrough

Build executable markdown walkthroughs that guide a reader through a codebase in a linear, progressive order. Uses [showboat](https://github.com/nickthecook/showboat) to produce reproducible documents where every code snippet is verified.

## Workflow

### Phase 1: Explore

Read the codebase to understand its architecture:

- Identify entry points (main, index, CLI handlers)
- Map core abstractions (types, interfaces, key classes)
- Trace data flow through the system
- Note key features and edge cases
- List files in the order they should be presented

### Phase 2: Plan

Design a linear reading order that builds understanding progressively:

1. **Entry point** — where execution begins
2. **Core types/abstractions** — the vocabulary of the codebase
3. **Data flow** — how data moves through the system
4. **Key features** — important behaviors and their implementation
5. **Edge cases** — error handling, fallbacks, special paths

Each section should introduce concepts before referencing them. A reader following the walkthrough top-to-bottom should never encounter an unexplained term.

### Phase 3: Build

Use showboat commands to construct the walkthrough. Always run from the repo root.

**Initialize:**

```bash
uvx showboat init walkthrough.md "Title of Walkthrough"
```

**Add narrative notes** before each code block to explain context and intent:

```bash
uvx showboat note walkthrough.md "The server starts in main.ts, which wires up middleware and routes before listening on the configured port."
```

**Show code snippets** using `exec` with bash commands:

```bash
# Show a specific function or section with line ranges
uvx showboat exec walkthrough.md bash "sed -n '10,25p' src/main.ts"

# Show where a pattern appears across files
uvx showboat exec walkthrough.md bash "grep -n 'pattern' src/file.ts"

# Show a whole small file (only for short files)
uvx showboat exec walkthrough.md bash "cat src/types.ts"
```

**Fix mistakes:**

```bash
# Remove the last entry if it was wrong
uvx showboat pop walkthrough.md
```

**Verify the final document:**

```bash
uvx showboat verify walkthrough.md
```

## Guidelines

- **Use `sed -n 'start,endp'`** for showing specific functions or sections — don't dump entire large files
- **Use `grep -n`** to show where things are referenced across the codebase
- **Use `cat` only for small files** (< 50 lines); prefer line-range excerpts otherwise
- **Narrative notes should explain WHY** code is structured this way, not just WHAT it does
- **Build understanding progressively** — don't reference concepts before introducing them
- **One idea per note+snippet pair** — keep the walkthrough scannable
- **Always verify at the end** with `uvx showboat verify` to ensure all snippets are reproducible
