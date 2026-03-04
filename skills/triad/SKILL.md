---
name: triad
description: "Three-agent adversarial analysis: Finder hunts issues, Adversary disproves them, Referee judges. Use when asked to 'triad', 'adversarial review', 'find and verify issues', or 'triad analysis' on code. Requires a target (files/directory) and a lens (bugs, security, performance, maintainability, simplicity, or custom)."
---

# Triad Analysis

Three-agent adversarial analysis engine. Exploits agent sycophancy by design: the Finder is biased to find everything, the Adversary is biased to disprove everything, and the Referee resolves the tension.

Inspired by [@systematicls](https://x.com/systematicls) — "How To Be A World-Class Agentic Engineer".

## Usage

The user provides:
- **Target**: files, directories, or a description of what to analyze
- **Lens**: the dimension to analyze through (e.g., bugs, security, performance, maintainability, simplicity)

If the user doesn't specify a lens, ask them which lens to use.

## Execution

Run three subagents **sequentially** using the `Agent` tool with `subagent_type: "general-purpose"`. Each agent gets a fresh context — this is critical to avoid cross-contamination of biases.

### Step 1: Finder Agent

Spawn a subagent with this prompt (fill in `{TARGET}` and `{LENS}` and `{LENS_INSTRUCTIONS}`):

```
You are the FINDER in a triad analysis. Your job is to be EXHAUSTIVE and ENTHUSIASTIC about finding issues.

## Target
{TARGET}

## Lens: {LENS}
{LENS_INSTRUCTIONS}

## Scoring
You earn points for every issue you find:
- +1 for low-impact issues (cosmetic, minor, unlikely)
- +5 for medium-impact issues (could cause real problems)
- +10 for critical issues (will cause failures, vulnerabilities, or significant harm)

Your goal is to MAXIMIZE your score. Be thorough. Check every file, every function, every edge case. Cast a wide net. It's better to flag something questionable than to miss a real issue.

## Output Format
Return a structured list of findings. For each finding:

### Finding {N}: {title}
- **Score**: +{1|5|10}
- **Location**: file:line (or general area)
- **Description**: What the issue is
- **Evidence**: Code snippet or reasoning that supports this finding
- **Impact**: What could go wrong

End with: **Total Score: {sum}**

Read the target files now and begin your analysis. Be relentless.
```

### Step 2: Adversary Agent

Take the Finder's output and spawn a second subagent with this prompt:

```
You are the ADVERSARY in a triad analysis. Your job is to DISPROVE as many of the Finder's claims as possible.

## Target
{TARGET}

## Finder's Claims
{PASTE THE FULL FINDER OUTPUT HERE}

## Scoring
For each finding you successfully disprove, you earn that finding's score.
But if you incorrectly dismiss a real issue, you LOSE 2x that finding's score.

This means you should be aggressive but careful. Disprove weak claims confidently. Be cautious about dismissing plausible ones.

## How to Disprove
For each finding, you must either:
- **DISPROVE**: Show concrete evidence why this is NOT actually an issue (code paths that prevent it, framework guarantees, documentation, etc.)
- **CONCEDE**: Acknowledge the finding is valid
- **CHALLENGE**: Argue the severity is wrong (e.g., a +10 should be a +1)

## Output Format
For each of the Finder's findings:

### Finding {N}: {title}
- **Verdict**: DISPROVE | CONCEDE | CHALLENGE
- **Reasoning**: Your evidence-based argument
- **Evidence**: Code snippets, docs, or logic that supports your verdict
- **Proposed Score Adjustment**: (if CHALLENGE, what the score should be)

End with: **Adversary Score: {sum of disproven findings' scores}**

Read the target files now and begin your adversarial review. Be rigorous.
```

### Step 3: Referee Agent

Take both outputs and spawn a third subagent:

```
You are the REFEREE in a triad analysis. You have the Finder's claims and the Adversary's rebuttals. Your job is to deliver the FINAL VERDICT on each finding.

## Target
{TARGET}

## Finder's Claims
{PASTE THE FULL FINDER OUTPUT HERE}

## Adversary's Rebuttals
{PASTE THE FULL ADVERSARY OUTPUT HERE}

## Your Task
You have the ground truth — the actual codebase. For each finding, read the relevant code and determine who is correct.

## Scoring
- +1 for each correct judgment
- -1 for each incorrect judgment

You want to maximize your score, so be accurate above all else.

## Output Format
For each finding:

### Finding {N}: {title}
- **Final Verdict**: CONFIRMED | DISMISSED | DOWNGRADED | UPGRADED
- **Winner**: Finder | Adversary
- **Final Severity**: Critical | Medium | Low | Not an issue
- **Reasoning**: Your independent analysis based on the actual code
- **Recommendation**: What action to take (if any)

Then provide a summary:

## Summary
- **Confirmed Issues**: {count} ({list by severity})
- **Dismissed Claims**: {count}
- **Key Findings**: Top 3 actionable items, ordered by impact

Read the target files now and deliver your verdict. Be fair and accurate.
```

## Presenting Results

After the Referee completes, present the user with:

1. **The Referee's summary** (confirmed issues, dismissed claims, key findings)
2. **A brief note on the process** (how many findings the Finder raised, how many the Adversary challenged, how many survived)
3. **Actionable recommendations** ordered by severity

Do NOT dump all three agents' full outputs. Only show the Referee's consolidated results unless the user asks for the full analysis.

## Lens Instructions

When constructing the Finder's prompt, replace `{LENS_INSTRUCTIONS}` with the appropriate lens-specific instructions:

### Bugs
```
Find bugs: logic errors, off-by-ones, null/undefined access, race conditions, unhandled edge cases, incorrect error handling, type mismatches, broken control flow, resource leaks, incorrect assumptions about data shape or API contracts.
```

### Security
```
Find security vulnerabilities: injection (SQL, command, XSS), authentication/authorization flaws, insecure data handling, hardcoded secrets, CSRF, SSRF, path traversal, insecure deserialization, broken access control, cryptographic weaknesses, dependency vulnerabilities, information leakage.
```

### Performance
```
Find performance issues: unnecessary re-renders, N+1 queries, missing indexes, unbounded loops, memory leaks, excessive allocations, blocking I/O on hot paths, missing caching opportunities, inefficient algorithms, large bundle sizes, unoptimized images/assets, unnecessary network calls.
```

### Maintainability
```
Find maintainability issues: code that is hard to understand, modify, or extend. Look for: unclear naming, functions doing too many things, deep nesting, implicit dependencies, missing error context, magic numbers/strings, duplicated logic that will drift, tight coupling between modules, god objects/files, missing abstractions where patterns repeat 3+ times.
```

### Simplicity
```
Evaluate through the "Simple Made Easy" lens (Rich Hickey / Sean Goedecke / Ward Cunningham).

Simple = fewer moving pieces, less internal connection, more stable (less ongoing maintenance if requirements don't change).
Easy = familiar, convenient, nearby — but not necessarily simple.

Find instances of:
- Over-engineering: infrastructure or abstractions built for hypothetical future requirements that don't exist yet (YAGNI violations)
- Premature scaling: systems designed for 100x current load when 2-5x would suffice
- Unnecessary indirection: layers of abstraction, adapters, or factories that serve no current purpose
- Complex over simple: using a distributed cache when in-memory works, microservices when a monolith suffices, event sourcing when CRUD is fine
- Accidental complexity: complexity that comes from the solution, not the problem
- "Could you just...": places where a config line, stdlib function, or deletion would replace a custom implementation

For each finding, articulate: what is the simplest thing that could possibly work here?
```
