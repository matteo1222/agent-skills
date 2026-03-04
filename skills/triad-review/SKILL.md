---
name: triad-review
description: "Multi-dimensional code review using adversarial triad analysis. Runs the triad skill (Finder/Adversary/Referee) across multiple lenses: bugs, security, performance, maintainability, simplicity. Use when asked to 'triad review', 'full review', 'deep review', or 'multi-dimensional analysis' on code."
---

# Triad Review

Multi-dimensional code review that runs the `triad` skill across multiple lenses, then consolidates findings into a unified report.

## Usage

The user provides a **target** (files, directories, or scope). Optionally they can specify which lenses to include. Default lenses: bugs, security, performance, maintainability, simplicity.

## Execution

### 1. Determine scope and lenses

Ask the user (if not already specified):
- What files/directories to analyze
- Which lenses to run (default: all five)
- Any specific concerns to prioritize

### 2. Run triad for each lens

For each selected lens, invoke the `triad` skill pattern by spawning the three subagents (Finder → Adversary → Referee) sequentially.

Read the core triad skill at `{SKILL_DIR}/../triad/SKILL.md` for the exact prompts and process.

**Important**: Each lens gets its own fresh set of three subagents. Do NOT reuse context across lenses. This keeps each analysis clean and unbiased.

Run lenses in this order (most concrete to most subjective):
1. **Bugs** — logic errors, crashes, incorrect behavior
2. **Security** — vulnerabilities, attack surfaces
3. **Performance** — bottlenecks, waste, scaling issues
4. **Maintainability** — code health, readability, extensibility
5. **Simplicity** — over-engineering, accidental complexity, YAGNI violations

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
- Get the full Finder/Adversary/Referee transcript for any lens

## Tips

- For large codebases, suggest the user scope to specific directories or recently changed files
- If a codebase is small (<500 lines), running all 5 lenses may be overkill — suggest 2-3 most relevant ones
- The simplicity lens is especially valuable for greenfield projects and architecture reviews
- The bugs lens is most valuable for pre-merge code review
