---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "$pstack reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

Use the active Codex task context or task/thread history tools when they are available and authorized. Do not glob across `~/.codex/sessions` or unrelated tasks. If no task history can be retrieved, write a tight digest of the current session and pass that instead.

### 2. Spawn three reviewers in parallel

Spawn three Codex reviewers, subject to available slots. Give each a standalone brief with `fork_turns: "none"`, explicit `model` and `reasoning_effort` fields, and `Do not edit files or mutate external state`. Reviewers keep available MCP access for context lookups; the parent applies edits.

| Lens | Config role and default pair | Prompt template |
|---|---|---|
| Judgment | `reflect judgment`, default `gpt-5.6-sol @ xhigh` | `references/judgment-reviewer.md` |
| Tooling | `reflect tooling`, default `gpt-5.6-sol @ max` | `references/tooling-reviewer.md` |
| Divergent | `reflect divergent`, default `gpt-5.6-terra @ max` | `references/divergent-reviewer.md` |

Read `reflect judgment`, `reflect tooling`, `reflect divergent`, and `reflect synthesizer` from `~/.codex/pstack-models.md` when present; otherwise use the table defaults. In an existing file, the grouped `reflect divergent, synthesizer` line supplies both divergent and synthesizer unless a specific split role overrides it. Read that legacy line without rewriting the user configuration. Parse each `model @ effort` pair into the two spawn fields. For `auto` or `inherit-parent`, omit both fields. If Codex rejects a configured pair, use the closest model-effort pair it currently advertises for this role and report the fallback. Do not infer support from a model family name. If no compatible advertised pair is available, leave the seat unfilled and report it.

Pass each template verbatim, substituting the authorized task-history path or digest where marked. Reviewers return findings in their `spawn_agent` result.

### 3. Synthesize

Spawn one Codex synthesizer with a standalone brief and the `reflect synthesizer` pair from `~/.codex/pstack-models.md`, defaulting to `gpt-5.6-terra @ max`. Set `model` and `reasoning_effort` separately. Tell it `Do not edit files or mutate external state`. Use `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

File Backlog items only when the user placed that tracker mutation in scope; otherwise return them as proposed tracker entries. Only the Accepted skill edits wait for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to Codex's `$skill-creator` skill and run its draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `$skill-creator` and run its description-optimization loop.
- `new skill via $skill-creator: <kebab-name>`: hand creation to `$skill-creator`. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog: say `filed` with the tracker identifier only when that mutation was authorized and completed; otherwise say `proposed`. One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
