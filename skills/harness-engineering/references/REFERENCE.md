# Harness Engineering — Reference

## Layered Domain Architecture

Each business domain uses fixed layers with strict dependency direction:

```
Types → Config → Repo → Service → Runtime → UI
```

Cross-cutting concerns (validation, connectors, telemetry, feature flags) enter through one interface: **Providers**.

Enforced by custom linters and structural tests. Violations are blocked mechanically, not caught in review.

**Why this matters for agents:** Without enforced boundaries, agents produce code that works but drifts — inconsistent patterns, duplicated logic, broken abstractions spreading via copy. Constraints enable speed.

## Full Codebase Structure

### Knowledge Layer — What the agent reads

```
AGENTS.md              # ~100 line map (table of contents)
ARCHITECTURE.md        # Domain + package layering overview
docs/
├── design-docs/       # Cataloged, indexed, with validation status
│   ├── index.md
│   ├── core-beliefs.md   # Team identity, customers, product vision
│   └── <feature>.md      # One per design decision
├── exec-plans/        # Active plans, completed, tech-debt tracker
│   ├── active/
│   ├── completed/
│   └── tech-debt-tracker.md
├── generated/         # Auto-generated (e.g., db-schema.md)
│   └── db-schema.md
├── product-specs/     # Product requirements
│   ├── index.md
│   └── <feature>.md
├── references/        # External reference materials (llms.txt style)
│   └── *.txt
├── DESIGN.md
├── FRONTEND.md
├── PLANS.md
├── PRODUCT_SENSE.md
├── QUALITY_SCORE.md   # Scores per domain/layer, tracks gaps
├── RELIABILITY.md
└── SECURITY.md
```

**Key files:**
- `core-beliefs.md` — Who's on the team, what product, who the customers are, who the pilot customers are, the full 12-month vision. This is the most important file — without it, agents make design decisions in a vacuum. Include team culture (even emoji/meme conventions).
- `QUALITY_SCORE.md` — Markdown table scoring each area. Hook for gardening agents to assess and propose follow-up work.
- `RELIABILITY.md` — Non-negotiable reliability rules (e.g., all network calls must have timeouts). Updated whenever a production incident reveals a gap.
- `tech-debt-tracker.md` — Known debt items. Agents can be spawned on cron to burn these down.

### Enforcement Layer — Source code structure

```
src/
├── <domain>/              # Each business domain
│   ├── types/             # Layer 1: Pure types, no imports from other layers
│   ├── config/            # Layer 2: Can import types
│   ├── repo/              # Layer 3: Can import types, config
│   ├── providers/         # Cross-cutting: validation, connectors, telemetry
│   ├── service/           # Layer 4: Can import types, config, repo, providers
│   ├── runtime/           # Layer 5: Can import everything above
│   └── ui/                # Layer 6: Can import everything above
├── shared/
│   ├── utils/             # Shared utilities (preferred over hand-rolled)
│   └── primitives/        # Base classes like Command (observability for free)
└── app/                   # App wiring, entry point

tools/
├── linters/               # Custom linters — error messages coach the agent
│   ├── layer-imports       # Enforces dependency direction
│   ├── naming-conventions  # Schema/type naming patterns
│   ├── file-size-limit     # Max lines per file
│   ├── structured-logging  # No console.log, use logger
│   └── boundary-validation # Parse data at boundaries (Zod etc.)
└── scripts/
    ├── quality-score       # Scans codebase, updates QUALITY_SCORE.md
    └── doc-gardening       # Finds stale docs, opens fix PRs
```

Dependency rule: within each domain, imports flow DOWN only (Types → Config → Repo → Service → Runtime → UI). Cross-domain imports are forbidden. Violations blocked by linters, not caught in review.

**Lint error messages must coach the agent:** include what's wrong, why, and how to fix — this injects fix instructions into context at the exact moment of failure.

### Execution Layer — Agent tooling

```
.codex/ or .claude/        # Agent config
├── skills/
│   ├── land/SKILL.md      # Full PR merge lifecycle
│   ├── commit/SKILL.md    # Commit conventions
│   ├── pull/SKILL.md      # Sync with origin/main
│   └── push/SKILL.md      # Push and publish

.github/workflows/
├── ci.yml                 # Standard CI
├── doc-validation.yml     # Are docs fresh? Cross-linked?
└── architecture-check.yml # Run custom linters on PR

scripts/
├── dev/
│   ├── boot-app.sh        # Start app in worktree
│   ├── boot-observability.sh  # Start Vector + Victoria stack
│   └── teardown.sh        # Clean up everything
├── agent/
│   ├── review-pr.sh       # Agent-driven code review
│   └── gardening.sh       # Scheduled cleanup scan
└── build/
    └── build.sh           # Must complete in <1 minute
```

## Agent Review Loops

### The "Ralph Wiggum Loop"

1. Code author agent pushes PR
2. Review agent fires on PR sync, posts comments
3. Author agent must acknowledge and respond
4. Loop until all agent reviewers are satisfied

### Tuning Both Sides

**Reviewer agent:**
- Bias toward merging
- Only surface P0-P2 priority issues
- Use a scoring framework (P0 = would break codebase if merged)

**Author agent:**
- Permission to push back or defer feedback to backlog
- Not every review comment needs immediate action
- Can file follow-up issues instead of expanding scope

**Why both sides need calibration:** Author that accepts everything = scope explosion. Reviewer that's too lenient = bugs slip through. Balance through calibrated frameworks on both sides.

## The Command Base Class Pattern

Abstract base class that provides observability for free:

```typescript
abstract class Command<TInput, TOutput> {
  // Tracing, metrics, structured logging built in
  abstract execute(input: TInput): Promise<TOutput>;
}

class CreateUser extends Command<CreateUserInput, User> {
  async execute(input: CreateUserInput): Promise<User> {
    // Agent only writes business logic
    // Observability is automatic
    return await this.db.users.create(input);
  }
}
```

**Leverage:** Don't tell agents "add logging." Tell them "use the Command primitive." One rule, applied everywhere, zero drift.

## Dev Environment Setup

### Inverted Entry Point

Traditional: set up environment → spawn agent into it.
Harness Engineering: **spawn the agent → agent boots what it needs.**

The agent is the entry point. It decides whether to boot the app, observability stack, or browser based on the task. A documentation update doesn't need Chrome DevTools.

### Per-Worktree Isolation

```
repo/
├── .git/                    (shared)
├── main/                    (human's working copy)
├── worktree-feature-A/      (agent 1 — own app, own observability)
├── worktree-feature-B/      (agent 2 — fully independent)
└── worktree-bugfix-C/       (agent 3 — ephemeral, torn down after)
```

### Local Observability Stack

```
App → Vector (log/metric router)
       ├── Victoria Logs   → LogQL
       ├── Victoria Metrics → PromQL
       └── Victoria Traces  → TraceQL
```

Lightweight Go binaries via mise. Python glue to spin up. Env vars point app at local stack. Ephemeral per worktree — torn down when agent finishes.

Enables prompts like: "Ensure startup completes in under 800ms" or "No span exceeds 2 seconds in these user journeys."

### Chrome DevTools Protocol

Agent connects to running app via CDP:
- DOM snapshots, screenshots, page navigation
- Runtime event observation (errors, network, console)
- Video recording for PR evidence

Full cycle: reproduce bug → screenshot broken state → fix → reboot → verify → record demo → attach to PR.

## Adapting to Model Generations

Each model generation changes agent behavior:

- **Background shells (e.g., GPT-5.3):** Model becomes less patient, won't block on long builds. Response: retool build system to complete under 1 minute.
- **Larger context (e.g., GPT-5.4):** Agents run longer before compacting. Complex tasks improve dramatically.
- **Fast models (e.g., Spark):** Great for quick fixes, doc updates, distilling feedback into lints. Not for complex reasoning.

**Build time as a ratchet:** If builds exceed the target, stop feature work and decompose the build graph. Cheap tokens + parallel agents = constant gardening to maintain invariants.

**Key principle:** Don't bet against the model. Build on-policy harness (native to what agents produce: code, tests, CLI output). Avoid off-policy scaffolds that restrict output — they'll conflict with model improvements and eventually need scrapping.

## Dependency Internalization

Low-to-medium complexity dependencies (~few thousand lines) can be rebuilt in-house:
- Strip generic parts, keep only what you need
- Integrate with your observability (tracing, metrics)
- 100% test coverage on your specific usage
- Security agents can deeply review internalized code

Example from the article: Instead of `p-limit` (generic concurrency package), they built a custom parallel map helper integrated with OpenTelemetry, with full test coverage, matching their exact runtime behavior.

## Progressive Autonomy Ladder

```
Phase 1: Human reviews every PR
Phase 2: Agent review + human spot-check
Phase 3: Post-merge human review only
Phase 4: Fully autonomous for well-covered domains
Phase 5: Agent drives feature end-to-end (reproduce → fix → verify → PR → merge)
```

Phase 5 requires: the agent can verify its own work (app boot, screenshots, observability), the codebase has strong mechanical enforcement, and gardening agents catch drift.

## The Mindset Checklist

- Am I writing code? → Stop. Prompt the agent.
- Agent failed? → Don't retry. Ask what's missing in the environment.
- Knowledge in my head? → Write it down. Not in repo = doesn't exist.
- Rule in a doc? → Encode it in a lint. Mechanical > convention.
- Reviewing every PR? → Automate review. Your attention is the bottleneck.
- Cleaning up manually? → Schedule a gardening agent. Cleanup at agent speed.
- Build taking too long? → Decompose build graph. Keep under target (e.g., 1 min).
- Agent getting bullied by reviewer? → Give author permission to push back.
- Same mistake class recurring? → Encode as lint/test. Never fix same class twice.

## Sources

- "Harnessing Engineering: Getting the Most Out of Codex in an Agent-First World" — Ryan Lopopolo, OpenAI (Feb 2025)
- Podcast interview with Ryan Lopopolo — detailed practitioner insights on orchestration, model adaptation, and enterprise deployment
