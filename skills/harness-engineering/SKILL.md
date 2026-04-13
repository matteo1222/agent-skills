---
name: harness-engineering
description: Design environments so AI coding agents build reliable software at scale. Use when setting up agent-driven codebases, debugging agent productivity bottlenecks, creating context management systems, or establishing mechanical enforcement and feedback loops for coding agents.
---
# Harness Engineering
## Core Principle
Engineers stop writing code. Instead, they design the **environment** — context, enforcement, and feedback loops — so agents produce reliable software autonomously. When agents fail, fix the environment, not the output.
## Quick Start — Three Pillars
### 1. Context Management
Agents can only use what they can see. If it's not in the repo, it doesn't exist.
- Short `AGENTS.md` (~100 lines) as a **map**, not a manual
- Structured `docs/` directory for depth (progressive disclosure)
- Encode all team knowledge into versioned artifacts (not Slack, not heads)
- Automate freshness checks via CI and doc-gardening agents
### 2. Mechanical Enforcement
Rules in docs drift. Rules in code don't.
- Custom linters enforce architecture boundaries (layer imports, naming, file size)
- Lint error messages **coach the agent** on how to fix violations
- Structural tests verify dependency direction
- "Golden Rules" codified as conventions (shared utils > hand-rolled, validate at boundaries)
### 3. Feedback Loops
Agents must observe and verify their own work.
- Boot app per git worktree (isolated, ephemeral)
- Chrome DevTools Protocol for DOM snapshots, screenshots, navigation
- Local observability stack (logs/metrics/traces queryable by agent)
- Agent records demo videos as PR evidence
## Workflow: When Agent Fails
```
Agent fails → Don't fix the output
            → Ask: "What's missing?"
            → Build missing tool/lint/doc (using the agent)
            → That class of failure is prevented forever
```
## Workflow: PR Lifecycle ("Land" Skill)
Agent handles end-to-end: push PR → wait for CI + reviewers → fix flakes → resolve merge conflicts → respond to feedback → merge. Human keeps laptop open.
## Workflow: Continuous Gardening
Background agents on cron: scan drift, update quality scores, open refactoring PRs. Cleanup runs at agent speed, not human speed.
## Key Decisions
| Decision | Choose | Not |
|---|---|---|
| Agent fails | Fix environment | Fix output manually |
| Enforce rules | Linters + tests | Documentation alone |
| Code review | Agent review + post-merge human spot-check | Human reviews every PR |
| Cleanup | Automated gardening agents | Manual "fix-it Fridays" |
| Dependencies | Internalize (if <few thousand lines) | Opaque external packages |
| CLI output | Filtered to failures only | Full verbose output |
## Anti-Patterns
- Giant AGENTS.md (>200 lines) — context is scarce, don't waste it
- Off-policy harness (restricts agent output) — build on-policy (native to what agents already produce)
- Betting against the model — build for current + future capabilities
- Babysitting agent runs — invest in guardrails so you don't need to monitor
## Advanced Patterns
See [references/REFERENCE.md](references/REFERENCE.md) for: layered domain architecture, agent review loops, the Command base class pattern, dev environment setup, model generation adaptation, dependency internalization, progressive autonomy ladder, and the mindset checklist.
