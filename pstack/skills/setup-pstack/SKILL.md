---
name: setup-pstack
description: Configure which Codex models and reasoning efforts pstack uses per role. Detects available subagent options and writes a pstack-owned override file. Use internally for $pstack setup, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Write `~/.codex/pstack-models.md`, a pstack-owned file that sets the model and reasoning effort for each role. Pstack reads it directly and falls back to the inline defaults when a role is absent. This file is a routing override, not a Codex configuration requirement.

## Steps

### 1. Detect available models and reasoning efforts

Read the model and `reasoning_effort` options advertised by the current Codex subagent tool. Confirm explicit model-effort pairs against that live capability before writing them. If a pair is rejected, use the tool's advertised choices to find the closest supported pair for the role and report the fallback. Never invent a model or effort, and never assume a model family is available because it appears in an old default. If no compatible pair is available, mark that role as needing a choice. The aliases `inherit-parent` and `auto` are always valid because both omit explicit override fields.

### 2. Load current state

Start from the role defaults in step 5. If `~/.codex/pstack-models.md` exists, read its budget line, role pairs, panel membership, comments, and additional role lines. Preserve custom model choices and panel membership for stock roles. Preserve non-stock role lines and their values verbatim because their routing intent is user-defined. Keep policy comments. Remove only the confirmed retired stock role `how critics`; do not treat any other unfamiliar line as retired.

The role labels `judgment` and `prose` remain separate. The reflect roles also stay separate: `reflect tooling`, `reflect judgment`, `reflect divergent`, and `reflect synthesizer`. For compatibility, if an older file has a `reflect divergent, synthesizer` line and one or both split lines are absent, carry its pair into the missing split role or roles. Keep the old line as stored user configuration.

A role value is written as `model @ effort`, such as `gpt-5.6-sol @ max`. The model name and effort are separate values, not a combined model slug. A panel value is a comma-separated list of pairs or aliases, one entry per worker.

### 3. Choose a reasoning budget and confirm the roles

Show the current budget if the file records one. If no budget is recorded, show the existing pairs as-is and do not infer or rewrite a budget before the user selects one. Ask for one of these exact options:

- `unlimited — keep max`
- `large — xhigh reasoning`
- `medium — high reasoning`
- `small — medium reasoning`

Build the working table from the defaults and the user's existing role choices. On a rerun, retain each chosen model and panel membership for stock roles; apply the selected budget to their effort parts only. Preserve extra user-defined role lines and their model-effort values verbatim. `unlimited` leaves the table's current efforts in place, including defaults already set to `xhigh`. `large`, `medium`, and `small` set the `reasoning_effort` value of each explicit pair to `xhigh`, `high`, and `medium`, respectively. Keep the pair syntax intact: for `gpt-5.6-sol @ max`, a `small` budget changes it to `gpt-5.6-sol @ medium`, which is passed as `model: gpt-5.6-sol` and `reasoning_effort: medium`. Apply the same rule to each panel entry. Aliases are unchanged.

If the selected effort is not advertised for the chosen model, use the highest supported effort for that same model that is at or below the target. If there is no such pair, keep the user's model choice and mark the role as needing a choice. Do not silently substitute a different model or an unsupported family. Keep extra user-defined role lines and comments unchanged when applying the budget.

Show every role with its model and effort, marking any pair that is not currently supported as needing a choice. Include preserved custom role lines. For a panel, show each entry. Ask whether to accept the table or change specific roles, offering detected model-effort pairs plus `inherit-parent` and `auto`. Use the available Codex user-input mechanism when possible; aliases omit both spawn override fields.

For panel roles (`arena runners`, `architect runners`, and `interrogate reviewers`), one subagent runs per entry, subject to available Codex slots. `arena cross-judge pool` is also a list; Arena chooses one entry with a model variant different from the primary worker when possible. `gpt-5.6` and `gpt-5.6-sol` are the same variant. `swarm workers` supplies the default pair for each worker unless a race assigns a pair to each arm.

### 4. Validate

Every explicit pair written must be supported by the current subagent tool. Check the model and effort separately, then verify the pair together. `inherit-parent` and `auto` pass because they omit both fields. If a chosen pair is unavailable and no compatible advertised fallback exists, leave it marked as needing a choice and ask the user before writing it.

### 5. Write the override

Write `~/.codex/pstack-models.md` with a `# budget` line and the current role labels. Use `model @ effort` syntax. Preserve user comments, custom role lines, and custom model choices on reruns. Overwrite the file only after confirmation so each completed run has one current table.

```text
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` omits both spawn overrides. Alias entries still count toward panel fan-out.
# budget: unlimited (max)
feature, refactoring: gpt-5.6-luna @ max
bug-fix: gpt-5.6-sol @ max
perf-issue: gpt-5.6-sol @ max
hillclimb: gpt-5.6-sol @ max
judgment: gpt-5.6-sol @ xhigh
prose: gpt-5.6-terra @ max
hardest tasks: gpt-5.6-sol @ xhigh
how explorer: gpt-5.6-luna @ max
how explainer: gpt-5.6-terra @ max
why investigators: gpt-5.6-luna @ max
why synthesizer: gpt-5.6-terra @ max
reflect tooling: gpt-5.6-sol @ max
reflect judgment: gpt-5.6-sol @ xhigh
reflect divergent: gpt-5.6-terra @ max
reflect synthesizer: gpt-5.6-terra @ max
arena runners: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
arena cross-judge pool: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
swarm workers: gpt-5.6-luna @ max
architect runners: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
interrogate reviewers: gpt-5.6-sol @ max, gpt-5.6-terra @ max, gpt-5.6-luna @ max
```

### 6. Confirm

Tell the user the override file was written and that pstack reads it on its next invocation. A later setup run can update it.

### 7. Offer a verification skill

Check whether the project has a way to drive the real app for proof, such as a `verify-*` skill or existing harness. If it does not, offer once: "Want a project-local verification skill so agents can drive the app the way a user does and prove changes work? I can generate one with `$pstack create-verification-skill`." On yes, route to that bundled skill. On no, continue without pushing.
