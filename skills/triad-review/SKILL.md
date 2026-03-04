---
name: triad-review
description: "Multi-dimensional code review using adversarial triad analysis. Runs the triad script (Finder/Adversary/Referee) across multiple lenses: bugs, security, performance, maintainability, simplicity. Use when asked to 'triad review', 'full review', 'deep review', or 'multi-dimensional analysis' on code."
allowed-tools: Bash(triad:*)
---

# Triad Review

Multi-dimensional code review that runs the `triad` script across multiple lenses, then consolidates findings into a unified report.

## Usage

The user provides a **target** (files, directories, or scope). Optionally they can specify which lenses to include. Default lenses: bugs, security, performance, maintainability, simplicity.

## Execution

### 1. Determine scope and lenses

Ask the user (if not already specified):
- What files/directories to analyze
- Which lenses to run (default: all five)
- Any specific concerns to prioritize

### 2. Run triad for each lens

Run the triad script once per lens. Lenses are independent — you MAY run them in parallel using Bash `run_in_background`.

```bash
# Run each lens
{baseDir}/../triad/triad.sh --target <paths> --lens bugs --verbose
{baseDir}/../triad/triad.sh --target <paths> --lens security --verbose
{baseDir}/../triad/triad.sh --target <paths> --lens performance --verbose
{baseDir}/../triad/triad.sh --target <paths> --lens maintainability --verbose
{baseDir}/../triad/triad.sh --target <paths> --lens simplicity --verbose
```

**Do NOT implement the triad pipeline yourself.** Do NOT use Agent tool calls. Do NOT read files and pass content. Just call the script — it handles all orchestration and agent isolation.

Each script invocation runs 3 separate `claude -p` processes (Finder → Adversary → Referee) with full context isolation.

### 3. Consolidate results

After all lenses complete, synthesize a unified report.

#### Report Format

```markdown
# Triad Review: {target}

## Executive Summary
{2-3 sentences: overall health, biggest risks, top action items}

## Critical Findings
{Issues confirmed as Critical across any lens. These need immediate attention.}

### {Finding title}
- **Lens**: {which lens found it}
- **Severity**: Critical
- **Location**: file:line
- **Issue**: {description}
- **Recommendation**: {what to do}

## Medium Findings
{Same format, medium severity}

## Low Findings
{Brief list, one line each}

## Dismissed Claims
{Count of findings that the Adversary successfully disproved, by lens}
- Bugs: {N} dismissed of {M} raised
- Security: {N} dismissed of {M} raised
- Performance: {N} dismissed of {M} raised
- Maintainability: {N} dismissed of {M} raised
- Simplicity: {N} dismissed of {M} raised

## Cross-Cutting Observations
{Patterns that appear across multiple lenses. E.g., a maintainability issue that is also a bug risk, or an over-engineered system that also has performance overhead.}
```

### 4. Offer next steps

After presenting the report, ask the user if they want to:
- Fix any specific findings
- Deep-dive into a particular lens
- Re-run the triad on a specific file with more focus

## Tips

- For large codebases, suggest the user scope to specific directories or recently changed files
- If a codebase is small (<500 lines), running all 5 lenses may be overkill — suggest 2-3 most relevant ones
- Use `--model opus` for higher fidelity on critical codebases
- The simplicity lens is especially valuable for greenfield projects and architecture reviews
- The bugs lens is most valuable for pre-merge code review
