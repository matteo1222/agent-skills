# Ralph Memory System

This directory stores the agent's memory - what it has tried, learned, and discovered.

## Files

| File | Purpose |
|------|---------|
| `experiments.json` | What was tried and the outcomes |
| `sources.json` | Discovered sources (from seed sources) |
| `insights.json` | Key learnings and patterns |
| `failures.json` | What didn't work (to avoid repeating) |
| `successes.json` | What worked well (to do more of) |
| `context.json` | Current understanding of the codebase/business |

## How Memory Works

1. **Before each run**: Ralph loads memory to understand context
2. **During research**: New sources are discovered and stored
3. **After experiments**: Outcomes are recorded (success/failure/partial)
4. **Over time**: Patterns emerge that guide future decisions

## Memory is Append-Only

Memory files are append-only logs. The agent builds understanding by reading the full history and synthesizing patterns.

## Resetting Memory

To start fresh:
```bash
rm -rf memory/*.json
```

Or reset specific aspects:
```bash
rm memory/experiments.json  # Forget experiments
rm memory/sources.json      # Forget discovered sources
```
