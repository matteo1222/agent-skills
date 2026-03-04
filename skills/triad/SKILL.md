---
name: triad
description: "Three-agent adversarial analysis: Finder hunts issues, Adversary disproves them, Referee judges. Use when asked to 'triad', 'adversarial review', 'find and verify issues', or 'triad analysis' on code. Requires a target (files/directory) and a lens (bugs, security, performance, maintainability, simplicity, or custom)."
allowed-tools: Bash(triad:*)
---

# Triad Analysis

Three-agent adversarial analysis engine. Exploits agent sycophancy by design: the Finder is biased to find everything, the Adversary is biased to disprove everything, and the Referee resolves the tension.

Each role runs as a **separate `claude -p` process** — isolation is structurally enforced, not honor-system.

Inspired by [@systematicls](https://x.com/systematicls) — "How To Be A World-Class Agentic Engineer".

## Usage

The user provides:
- **Target**: files, directories, or a description of what to analyze
- **Lens**: the dimension to analyze through (e.g., bugs, security, performance, maintainability, simplicity)

If the user doesn't specify a lens, ask them which lens to use.

## Execution

Run the triad script. Do NOT attempt to implement the three-agent pipeline yourself using Agent tool calls or any other method. The script handles all orchestration.

```bash
{baseDir}/triad.sh --target <paths> --lens <lens> [--model <model>] [--max-turns <n>] [--verbose]
```

### Parameters

- `--target`: Comma-separated file paths or directories to analyze
- `--lens`: One of `bugs`, `security`, `performance`, `maintainability`, `simplicity`
- `--model`: Model to use for each agent (default: `sonnet`)
- `--max-turns`: Max turns per agent (default: `10`)
- `--verbose`: Show progress to stderr

### Examples

```bash
# Single file, bugs lens
{baseDir}/triad.sh --target src/auth.py --lens bugs --verbose

# Directory, security lens, using opus
{baseDir}/triad.sh --target src/api/ --lens security --model opus

# Multiple targets, simplicity lens
{baseDir}/triad.sh --target "src/db/,src/cache/,src/queue/" --lens simplicity --verbose
```

### What the script does

1. Spawns a **Finder** agent (`claude -p`) that reads the target files and hunts for issues. Scored +1/+5/+10 by impact.
2. Captures the Finder's output, then spawns an **Adversary** agent that tries to disprove each finding. Earns the score of disproven findings, loses 2x for incorrectly dismissed ones.
3. Captures both outputs, then spawns a **Referee** agent that reads the actual code and delivers final verdicts.

Each agent is a separate process with `--allowedTools "Read,Glob,Grep"` (read-only codebase access) and `--no-session-persistence`.

## Presenting Results

The script outputs only the Referee's final verdicts and summary. Present this to the user directly.

If the user wants more detail, they can re-run with `--verbose` or ask to see intermediate outputs (the script can be modified to save them).

## Available Lenses

| Lens | Focus |
|------|-------|
| `bugs` | Logic errors, crashes, edge cases, resource leaks |
| `security` | Injection, auth flaws, secrets, OWASP top 10 |
| `performance` | N+1 queries, memory leaks, blocking I/O, inefficient algorithms |
| `maintainability` | Naming, coupling, duplication, god objects |
| `simplicity` | Over-engineering, YAGNI, accidental complexity (Hickey/Goedecke) |
