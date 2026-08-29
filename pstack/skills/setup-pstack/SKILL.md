---
name: setup-pstack
description: Configure which Codex models and reasoning efforts pstack uses per role. Detects available subagent overrides and writes a pstack-owned override file. Use internally for $pstack setup, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Write `~/.codex/pstack-models.md`, a pstack-owned file that sets model and reasoning effort per role. Pstack reads it directly and falls back to inline defaults when a line is absent, so this is an override layer, not a Codex config file or requirement.

## Steps

### 1. Detect available models

Read the model and reasoning-effort overrides exposed by `spawn_agent` in this session; that is the dependable source. Validate model and effort as a pair. If Codex exposes a current models API or official catalog, use it only to supplement the live tool contract. If you cannot detect any, ask the user to provide the available pairs. Never write a pair you have not confirmed is available. The aliases `inherit-parent` and `auto` are always valid because both omit explicit override fields.

### 2. Load current state

The default role-to-model mapping is the file shape shown in step 5 below. If `~/.codex/pstack-models.md` already exists, read it and treat its values as the current choices. Otherwise start from those defaults.

### 3. Map and confirm

Show every role with its current model and effort, marking any unavailable pair as needing a choice. Ask whether to accept as-is or change specific roles, offering detected pairs plus `inherit-parent` and `auto`. Prefer the current Codex user-input mechanism over unstructured back-and-forth.

For panel roles (how critics, arena runners, architect runners, interrogate reviewers), the value is a list and one subagent runs per entry, subject to available slots. `arena cross-judge pool` is also a list, but Arena selects a model variant different from the primary worker when possible. `gpt-5.6` and `gpt-5.6-sol` are the same variant. `swarm workers` is the default pair for every worker unless a race names a pair for each arm. Explicit pairs require standalone briefs with a non-full context fork; aliases omit both overrides and let Codex resolve its configured subagent defaults.

### 4. Validate

Every explicit model/effort pair written must be in the detected set; `inherit-parent` and `auto` always pass. If a chosen pair is unavailable, stop and ask again. A file pointing at a pair the user cannot use breaks every delegation that reads it.

### 5. Write the override

Write `~/.codex/pstack-models.md` with one line per role, using the same labels Poteto Mode uses. Use `model @ effort` syntax. Overwrite the whole file so re-runs stay idempotent. Shape:

```text
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` omits both spawn overrides. Alias entries still count toward panel fan-out.
feature, refactoring: gpt-5.6-luna @ max
bug-fix: gpt-5.6-sol @ max
perf-issue: gpt-5.6-sol @ max
hillclimb: gpt-5.6-sol @ max
judgment: gpt-5.6-sol @ xhigh
prose: gpt-5.6-terra @ max
hardest tasks: gpt-5.6-sol @ xhigh
how explorer: gpt-5.6-luna @ max
how explainer: gpt-5.6-terra @ max
how critics: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
why investigators: gpt-5.6-luna @ max
why synthesizer: gpt-5.6-terra @ max
reflect tooling: gpt-5.6-sol @ max
reflect judgment: gpt-5.6-sol @ xhigh
reflect divergent, synthesizer: gpt-5.6-terra @ max
arena runners: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
arena cross-judge pool: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
swarm workers: gpt-5.6-luna @ max
architect runners: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
interrogate reviewers: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
```

### 6. Confirm

Tell the user the override file was written and that pstack reads it on its next invocation. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with $pstack create-verification-skill." On yes, route to the bundled `create-verification-skill` instructions. On no, move on without pushing.
