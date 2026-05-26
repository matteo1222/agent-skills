---
name: review-swarm
description: "Parallel read-only multi-agent review of a current git diff or explicit file scope to find behavioral regressions, security or privacy risks, performance or reliability issues, contract or test coverage gaps, and unnecessary abstraction or complexity. Use when the user asks for a review swarm, parallel review, diff review, regression review, security review, simplicity review, or wants high-signal issues plus a prioritized fix path without editing files."
---

# Review Swarm

Review a diff with five read-only sub-agents in parallel, then have the main agent filter, order, and summarize only the issues that matter. This skill is review-only: sub-agents do not edit files, and the main agent does not apply fixes as part of this workflow.

## Step 1: Determine Scope and Intent

Prefer this scope order:

1. Files or paths explicitly named by the user
2. Current git changes
3. An explicit branch, commit, or PR diff requested by the user
4. Most recently modified tracked files, only if the user asked for a review and there is no clearer diff

If there is no clear review scope, stop and say so briefly.

When using git changes, choose the smallest correct diff command:

- unstaged work: `git diff`
- staged work: `git diff --cached`
- mixed staged and unstaged work: review both
- explicit branch or commit comparison: use exactly what the user requested

Before launching reviewers, read the closest local instructions and any relevant project docs for the touched area, such as:

- `AGENTS.md`
- repo workflow docs
- architecture or contract docs for the touched module

Build a short intent packet for the reviewers:

1. What behavior is meant to change
2. What behavior should remain unchanged
3. Any stated or inferred constraints, such as compatibility, rollout, security, or migration expectations

If the user did not state the intent clearly, infer it from the diff and say that the inference may be incomplete.

## Step 2: Launch Five Read-Only Reviewers in Parallel

Launch five sub-agents when the scope is large enough for parallel review to help. For a tiny diff or one very small file, it is acceptable to review locally instead.

For every sub-agent:

- give the same scope and the same intent packet
- state that the sub-agent is read-only
- do not let the sub-agent edit files, run `apply_patch`, stage changes, commit, or perform any other state-mutating action
- ask for concise findings only
- ask for: file and line or symbol, issue, why it matters, recommended follow-up, and confidence
- tell the sub-agent to avoid nits, style preferences, and speculative concerns without concrete impact
- tell the sub-agent to send findings back to the main agent only

Use these five review roles.

### Sub-Agent 1: Intent and Regression Review

Review whether the diff matches the intended behavior change without introducing extra behavior drift.

Check for:

1. Unintended behavior changes outside the stated scope
2. Broken edge cases or fallback paths
3. Contract drift between callers and callees
4. Missing updates to adjacent flows that should change together

This sub-agent is read-only. It must not edit files, apply patches, or make any other workspace changes.

Recommended sub-agent role: `reviewer`

### Sub-Agent 2: Security and Privacy Review

Review the diff for security regressions, privacy risks, and trust-boundary mistakes.

Check for:

1. Missing or weakened authn or authz checks
2. Unsafe input handling, injection risks, or validation gaps
3. Secret, token, or sensitive data exposure
4. Risky defaults, permission expansion, or trust of unverified data

This sub-agent is read-only. It must not edit files, apply patches, or make any other workspace changes.

Recommended sub-agent role: `reviewer`

### Sub-Agent 3: Performance and Reliability Review

Review the diff for new cost, fragility, or operational risk.

Check for:

1. Duplicate work, redundant I/O, or unnecessary recomputation
2. Added work on startup, render, request, or other hot paths
3. Leaks, missing cleanup, retry storms, or subscription drift
4. Ordering, race, or failure-handling problems that make the change brittle

This sub-agent is read-only. It must not edit files, apply patches, or make any other workspace changes.

Recommended sub-agent role: `reviewer`

### Sub-Agent 4: Contracts and Coverage Review

Review the diff for compatibility gaps and missing safety nets.

Check for:

1. API, schema, type, config, or feature-flag mismatches
2. Migration or backward-compatibility fallout
3. Missing or weak tests for the changed behavior
4. Missing logs, metrics, assertions, or error paths that make regressions harder to detect

This sub-agent is read-only. It must not edit files, apply patches, or make any other workspace changes.

Recommended sub-agent role: `reviewer`

### Sub-Agent 5: Simplicity and Abstraction Review

Review whether the diff keeps the codebase simple, boring, and easy to change without flattening useful structure, forcing premature DRYness, leaving unnecessary code behind, or exposing APIs that agents are likely to misuse.

Use this consolidated principle packet:

1. KISS: prefer the smallest design that satisfies the current behavior. Cleverness, extra layers, and broad configurability must earn their cost.
2. Simple is not the same as easy: familiar or quick-to-write code can still be complex if it intertwines state, time, I/O, policy, data shape, and control flow.
3. DRY applies to knowledge, not text. Consolidate duplicated business rules, constants, schemas, and invariants that must change together.
4. WET and AHA: similar code can stay duplicated while the shape is still emerging. Avoid hasty abstractions; let concrete uses reveal stable boundaries.
5. Wrong abstraction: shared code that grows parameters, flags, callbacks, or conditionals for "almost the same" cases is a signal to inline, split, or re-discover the abstraction.
6. YAGNI: reject future-proof extension points and presumptive generality that increase today's complexity without serving the current requirement.
7. Deep modules and orthogonality: good abstractions hide meaningful complexity behind small, stable interfaces and keep independent decisions independent.
8. Less code is often the clearest code: remove dead paths, redundant wrappers, stale compatibility branches, unused options, and no-op transformations when they no longer serve behavior.
9. Agent-safe design: encode important invariants in types, schemas, APIs, tests, and framework defaults so agents and humans are guided toward valid usage and away from sharp edges.

Check for:

1. New abstractions that do not hide enough complexity to justify their indirection
2. Shared helpers, base classes, hooks, components, or config layers with multiple reasons to change
3. Duplicate code that is actually duplicate knowledge and likely to drift
4. Duplicate code that should remain WET because the callers represent different concepts or are likely to diverge
5. Parameters, boolean flags, mode switches, inheritance, or callbacks that make one unit handle unrelated cases
6. Entanglement of state, effects, time, rendering, persistence, validation, and policy that makes local reasoning harder
7. APIs that push coordination burden or implementation details onto callers
8. Future-proofing, speculative extensibility, or reusable infrastructure not required by the current change
9. Clever or terse code that is easy to write but hard to inspect, test, replace, or delete
10. Unused, unreachable, obsolete, or redundant code added by the diff or made removable by the diff
11. Repeated conditionals, fallback branches, conversions, validations, guards, memoization, caching, logging, or tests that do not change behavior or confidence
12. Pass-through functions, wrappers, aliases, adapters, constants, files, or configuration that add a name or layer without reducing caller knowledge
13. Code that preserves an old path even though the reviewed change removes its last real caller or supported state
14. Public or internal APIs that accept raw strings, loose maps, booleans, optional bags, or mode flags where a typed value, narrow command, schema, or builder would prevent misuse
15. Business or safety invariants enforced only by comments, conventions, scattered call-site checks, or prompt instructions instead of code-level constraints
16. Abstractions that expose low-level sequencing, lifecycle, permission, rollout, or validation details that callers and agents should not need to coordinate manually
17. Missing affordances that would make the correct path obvious: safe defaults, required fields, constrained enums, capability-scoped helpers, single-purpose entry points, or tests for invalid states

Recommended follow-ups should be concrete and small: delete, inline, split, rename, co-locate, narrow an interface, move knowledge to a single source of truth, encode an invariant, or leave duplication in place until the right abstraction is visible. Prefer deletion when code is provably unused, redundant, or behavior-preserving ceremony. Prefer stronger constraints when they prevent likely misuse without adding ceremony. Do not recommend broad rewrites, architecture churn, or abstracting solely because code looks similar.

This sub-agent is read-only. It must not edit files, apply patches, or make any other workspace changes.

Recommended sub-agent role: `reviewer`

Report only issues that materially affect correctness, security, privacy, reliability, compatibility, maintainability, or confidence in the change. It is better to miss a nit than to bury the user in low-value noise.

Source notes for the simplicity principle packet live in `references/simplification-principles.md`.

## Step 3: Aggregate and Filter Findings

The main agent owns synthesis. Treat sub-agent output as raw review input, not final output.

Merge findings across all five reviewers and filter aggressively:

- drop duplicates
- drop weak or speculative claims
- drop issues that conflict with the stated intent
- drop minor style or readability comments unless they hide a real bug or maintenance risk

Normalize surviving findings into this shape:

1. File and line or nearest symbol
2. Category: regression, security, reliability, contracts, or simplicity
3. Severity: high, medium, or low
4. Why it matters
5. Recommended fix or follow-up
6. Confidence: high, medium, or low

If a reviewer may be correct but the intent is unclear, turn it into an open question instead of a finding.

## Step 4: Order the Output

Present findings in this order:

1. High-severity, high-confidence issues
2. Medium-severity issues that are likely worth fixing before merge
3. Lower-severity issues or follow-ups that can wait

Keep the review concise. Findings should be actionable and evidence-backed.

If there are no material issues, say that directly instead of manufacturing feedback.

## Step 5: Recommend a Clear Path Forward

After the findings, give the user a short path forward:

- what to fix before merge
- what to improve if time permits
- what can safely be left alone

When helpful, group the path forward into:

- `fix now`
- `fix soon`
- `optional follow-up`

Do not implement fixes as part of this skill. The output is a read-only review plus a prioritized recommendation.
