#!/usr/bin/env bash
set -euo pipefail

# Triad Analysis: Finder → Adversary → Referee
# Each role runs as a separate `claude -p` process with its own context.
# Structurally enforces agent isolation — impossible to collapse roles.

usage() {
  cat <<'EOF'
Usage: triad.sh --target <paths> --lens <lens> [options]

Required:
  --target <paths>    Files/directories to analyze (comma-separated)
  --lens <lens>       Analysis lens: bugs, security, performance, maintainability, simplicity

Options:
  --model <model>     Model to use (default: sonnet)
  --max-turns <n>     Max turns per agent (default: 10)
  --verbose           Show progress to stderr
  -h, --help          Show this help
EOF
  exit 0
}

# Defaults
MODEL="sonnet"
MAX_TURNS=10
VERBOSE=false
TARGET=""
LENS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --target) TARGET="$2"; shift 2 ;;
    --lens) LENS="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --max-turns) MAX_TURNS="$2"; shift 2 ;;
    --verbose) VERBOSE=true; shift ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$TARGET" || -z "$LENS" ]]; then
  echo "Error: --target and --lens are required" >&2
  usage
fi

# Lens-specific instructions
case "$LENS" in
  bugs)
    LENS_INSTRUCTIONS="Find bugs: logic errors, off-by-ones, null/undefined access, race conditions, unhandled edge cases, incorrect error handling, type mismatches, broken control flow, resource leaks, incorrect assumptions about data shape or API contracts."
    ;;
  security)
    LENS_INSTRUCTIONS="Find security vulnerabilities: injection (SQL, command, XSS), authentication/authorization flaws, insecure data handling, hardcoded secrets, CSRF, SSRF, path traversal, insecure deserialization, broken access control, cryptographic weaknesses, dependency vulnerabilities, information leakage."
    ;;
  performance)
    LENS_INSTRUCTIONS="Find performance issues: unnecessary re-renders, N+1 queries, missing indexes, unbounded loops, memory leaks, excessive allocations, blocking I/O on hot paths, missing caching opportunities, inefficient algorithms, large bundle sizes, unoptimized images/assets, unnecessary network calls."
    ;;
  maintainability)
    LENS_INSTRUCTIONS="Find maintainability issues: code that is hard to understand, modify, or extend. Look for: unclear naming, functions doing too many things, deep nesting, implicit dependencies, missing error context, magic numbers/strings, duplicated logic that will drift, tight coupling between modules, god objects/files, missing abstractions where patterns repeat 3+ times."
    ;;
  simplicity)
    LENS_INSTRUCTIONS='Evaluate through the "Simple Made Easy" lens (Rich Hickey / Sean Goedecke / Ward Cunningham).

Simple = fewer moving pieces, less internal connection, more stable (less ongoing maintenance if requirements do not change).
Easy = familiar, convenient, nearby — but not necessarily simple.

Find instances of:
- Over-engineering: infrastructure or abstractions built for hypothetical future requirements that do not exist yet (YAGNI violations)
- Premature scaling: systems designed for 100x current load when 2-5x would suffice
- Unnecessary indirection: layers of abstraction, adapters, or factories that serve no current purpose
- Complex over simple: using a distributed cache when in-memory works, microservices when a monolith suffices, event sourcing when CRUD is fine
- Accidental complexity: complexity that comes from the solution, not the problem
- "Could you just...": places where a config line, stdlib function, or deletion would replace a custom implementation

For each finding, articulate: what is the simplest thing that could possibly work here?'
    ;;
  *)
    echo "Error: Unknown lens '$LENS'. Use: bugs, security, performance, maintainability, simplicity" >&2
    exit 1
    ;;
esac

ALLOWED_TOOLS="Read,Glob,Grep"

log() {
  if [[ "$VERBOSE" == "true" ]]; then
    echo "[triad] $*" >&2
  fi
}

# --- Step 1: Finder ---
log "Starting Finder agent (lens: $LENS)..."

FINDER_PROMPT="You are the FINDER in a triad analysis. Your job is to be EXHAUSTIVE and ENTHUSIASTIC about finding issues.

## Target
Read and analyze the following files/directories yourself using Read, Glob, and Grep tools:
$TARGET

## Lens: $LENS
$LENS_INSTRUCTIONS

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

Begin by reading the target files. Be relentless. Output ONLY the findings list, no preamble."

FINDER_OUTPUT=$(claude -p "$FINDER_PROMPT" \
  --allowedTools "$ALLOWED_TOOLS" \
  --model "$MODEL" \
  --max-turns "$MAX_TURNS" \
  --no-session-persistence \
  --output-format text 2>/dev/null)

log "Finder complete. Findings captured."

# --- Step 2: Adversary ---
log "Starting Adversary agent..."

ADVERSARY_PROMPT="You are the ADVERSARY in a triad analysis. Your job is to DISPROVE as many of the Finder's claims as possible.

## Target
Read and analyze the following files/directories yourself using Read, Glob, and Grep tools:
$TARGET

## Finder's Claims
$FINDER_OUTPUT

## Scoring
For each finding you successfully disprove, you earn that finding's score.
But if you incorrectly dismiss a real issue, you LOSE 2x that finding's score.

This means you should be aggressive but careful. Disprove weak claims confidently. Be cautious about dismissing plausible ones.

## How to Disprove
For each finding, you must either:
- **DISPROVE**: Show concrete evidence why this is NOT actually an issue (code paths that prevent it, framework guarantees, documentation, etc.)
- **CONCEDE**: Acknowledge the finding is valid
- **CHALLENGE**: Argue the severity is wrong (e.g., a +10 should be a +1)

Read the actual code yourself to verify each claim. Do not trust the Finder's code snippets — read the files directly.

## Output Format
For each of the Finder's findings:

### Finding {N}: {title}
- **Verdict**: DISPROVE | CONCEDE | CHALLENGE
- **Reasoning**: Your evidence-based argument
- **Evidence**: Code snippets you read yourself, docs, or logic that supports your verdict
- **Proposed Score Adjustment**: (if CHALLENGE, what the score should be)

End with: **Adversary Score: {sum of disproven findings' scores}**

Begin by reading the target files. Be rigorous. Output ONLY the verdicts, no preamble."

ADVERSARY_OUTPUT=$(claude -p "$ADVERSARY_PROMPT" \
  --allowedTools "$ALLOWED_TOOLS" \
  --model "$MODEL" \
  --max-turns "$MAX_TURNS" \
  --no-session-persistence \
  --output-format text 2>/dev/null)

log "Adversary complete. Rebuttals captured."

# --- Step 3: Referee ---
log "Starting Referee agent..."

REFEREE_PROMPT="You are the REFEREE in a triad analysis. You have the Finder's claims and the Adversary's rebuttals. Your job is to deliver the FINAL VERDICT on each finding.

## Target
Read and analyze the following files/directories yourself using Read, Glob, and Grep tools:
$TARGET

## Finder's Claims
$FINDER_OUTPUT

## Adversary's Rebuttals
$ADVERSARY_OUTPUT

## Your Task
You have the ground truth — the actual codebase. For each finding, read the relevant code yourself and determine who is correct. Do not trust either party's code snippets.

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
- **Reasoning**: Your independent analysis based on code you read yourself
- **Recommendation**: What action to take (if any)

Then provide a summary:

## Summary
- **Confirmed Issues**: {count} ({list by severity})
- **Dismissed Claims**: {count}
- **Key Findings**: Top 3 actionable items, ordered by impact

Begin by reading the target files. Be fair and accurate. Output ONLY the verdicts and summary, no preamble."

REFEREE_OUTPUT=$(claude -p "$REFEREE_PROMPT" \
  --allowedTools "$ALLOWED_TOOLS" \
  --model "$MODEL" \
  --max-turns "$MAX_TURNS" \
  --no-session-persistence \
  --output-format text 2>/dev/null)

log "Referee complete."

# Output final result
echo "$REFEREE_OUTPUT"
