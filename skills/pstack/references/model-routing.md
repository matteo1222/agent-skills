# Codex model routing

Read this file before a pstack workflow spawns model-routed subagents.

## Syntax

Model and reasoning effort are separate spawn fields. This document writes them as `model @ effort` for compactness. For example, `gpt-5.6-luna @ max` means:

```text
model: gpt-5.6-luna
reasoning_effort: max
```

`inherit-parent` and `auto` are historical pstack aliases. For either alias, omit both explicit fields and let Codex resolve its configured subagent defaults. Depending on current Codex configuration, that may use configured `[agents]` defaults before falling back to the parent. The aliases are not Codex model values and do not force literal parent inheritance.

Before using an explicit pair, confirm it is advertised by the current subagent tool. If a pair is unavailable, use the closest available pair for that role and report the fallback.

## Defaults

These assignments are pstack routing policy, not an OpenAI benchmark claim. They favor quality and fidelity over latency. In particular, `max` can be slower and costlier than lower effort; use `$pstack setup` to choose a different tradeoff.

| Role | Default |
|---|---|
| feature, refactoring, mechanical code | `gpt-5.6-luna @ max` |
| bug-fix, perf-issue, hillclimb, precise code | `gpt-5.6-sol @ max` |
| prose, explanation, synthesis | `gpt-5.6-terra @ max` |
| hardest or ambiguous judgment | `gpt-5.6-sol @ xhigh` |
| how explorer, why investigators, recall miners | `gpt-5.6-luna @ max` |
| how explainer, why synthesizer | `gpt-5.6-terra @ max` |
| reflect tooling | `gpt-5.6-sol @ max` |
| reflect judgment | `gpt-5.6-sol @ xhigh` |
| reflect divergent, reflect synthesizer | `gpt-5.6-terra @ max` |
| swarm workers | `gpt-5.6-luna @ max` |

Default review and design panels use three different variants:

```text
gpt-5.6-sol @ max
gpt-5.6-terra @ max
gpt-5.6-luna @ max
```

This panel applies to arena runners, the arena judge pool, architect runners, and interrogate reviewers. Prefer a judge variant different from the primary worker. Variant diversity can provide useful corroboration, but it is not statistical independence and agreement is not proof. If only one variant is available, vary reasoning effort when useful and disclose the reduced diversity.

## User override

If `~/.codex/pstack-models.md` exists, read it before routing and use any valid role lines it contains. The file uses one line per role:

```text
feature, refactoring: gpt-5.6-luna @ max
hardest tasks: gpt-5.6-sol @ xhigh
arena runners: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
```

An absent role keeps the default above. `$pstack setup` creates or updates the override file.

## Current capability basis

This port was checked on 2026-08-27 against official OpenAI documentation for Codex subagents, Codex skills, and the GPT-5.6 model family. Re-check current advertised models and efforts rather than assuming this snapshot is permanent.

- https://learn.chatgpt.com/docs/agent-configuration/subagents
- https://learn.chatgpt.com/docs/build-skills
- https://developers.openai.com/api/docs/models
