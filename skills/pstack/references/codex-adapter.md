# Codex adapter

Apply these rules whenever a bundled pstack file describes Cursor behavior. They are the minimum host translation; all other pstack instructions remain in force.

## Invocation and discovery

- `/poteto-mode` means `$pstack`.
- `/setup-pstack` means `$pstack setup`.
- Any other `/name` that denotes a bundled pstack skill means `$pstack name`, implemented by reading `../../pstack/skills/<name>/SKILL.md` directly from the shim.
- Cursor mode stickiness does not carry across Codex turns. Apply `$pstack` only on the turn where it is explicitly invoked or independently matches the current request; do not assume a prior turn keeps it active.
- Nested `disable-model-invocation`, `mode`, `icon`, `color`, `reminder`, and agent `is_background` frontmatter are preserved upstream metadata. Codex does not use them. Root invocation policy comes from `agents/openai.yaml`.
- A pstack-generated project skill belongs under `.agents/skills/<name>/`. A user-global skill belongs under `$HOME/.agents/skills/<name>/`.

## Plans and questions

- A Cursor `todolist` means the current Codex plan mechanism. Keep the same required steps and visible skip reasons.
- Cursor `AskQuestion` means ask one concise question through the user-input mechanism available in the current Codex mode. Ask only when the answer cannot be discovered safely and materially changes the result.
- A Cursor `/loop` instruction means start or continue a Codex goal, or use the current wait, monitor, or automation mechanism when the user explicitly requests persistence or recurrence. Never emit a raw Cursor command. Never create a goal, schedule, or external automation without the user's request.

## Subagents

- Cursor `Task` means Codex `spawn_agent`. Spawns are asynchronous. Use `list_agents` for capacity/status and `wait_agent` to drain completed work. Use a rolling window when fan-out exceeds available slots.
- Cursor `subagent_type: generalPurpose` means an ordinary Codex subagent with a standalone brief.
- Cursor `subagent_type: poteto-agent` means spawn an ordinary Codex subagent and require it to read `../../pstack/agents/poteto-agent.md` plus `../../pstack/skills/poteto-mode/SKILL.md` before work.
- Cursor `subagent_type: Comment Sicko` means spawn an ordinary Codex subagent and require it to read and follow `../../pstack/agents/comment-sicko.md` verbatim. Include the scoped files or diff.
- Cursor `run_in_background: true` is already the asynchronous spawn behavior.
- Cursor `readonly: true` is a prompt contract in Codex. State `Do not edit files or mutate external state` in the brief. Do not claim sandbox enforcement unless a configured read-only agent actually supplies it.
- Cursor `environment: "cloud"`, cloud agent IDs, cloud dashboards, and `cloud_base_branch` have no direct Codex equivalent. All current subagents share the local workspace. Choose agents by task and tool access, create explicit worktrees for parallel writers, and record durable state in branches/files rather than agent IDs.
- When setting an explicit model or effort, pass `model` and `reasoning_effort` separately. Use `fork_turns: "none"` or a bounded recent-turn fork and make the brief self-contained. Omitting model and effort uses Codex's configured subagent defaults, which fall back according to the current Codex configuration; it does not force a parent-model override.
- Use `send_message` for a narrow correction to a running agent. If scope changes materially, let it finish or interrupt it, then spawn a fresh agent with one consolidated brief. Do not use a follow-up turn merely to poll status.

## Shared filesystem

Codex subagents do not receive automatic worktrees. Parallel read-only work may share a tree. Before parallel write work, create one explicit worktree/branch or isolated output directory per writer and put its absolute path in the brief. Otherwise serialize the writers. Never use `git reset --hard` as coordination cleanup.

## Models

Combined Cursor slugs such as `gpt-5.6-sol-max` are not Codex model IDs. Interpret `model @ effort` pairs using [model-routing.md](model-routing.md). Treat `gpt-5.6` and `gpt-5.6-sol` as the same variant, not independent panel arms.

## Skills, tools, and controls

- Cursor's built-in `create-skill` means Codex's `skill-creator` when available; otherwise follow current Codex skill anatomy and validation rules.
- A named `cursor-team-kit` dependency is optional. Use an installed Codex skill or tool that produces the same outcome. If none exists, perform the outcome directly when it remains in scope; do not pretend the dependency ran.
- A Cursor `control-ui` or `control-cli` reference means the matching browser, computer-use, simulator, or CLI control capability available in Codex. If the needed surface cannot be controlled, report the missing proof instead of fabricating it.
- Discover MCP/app tools through the current tool catalog. Do not inspect a Cursor `mcps/` directory.

## History and transcripts

Use the active task context or Codex task/thread history tools when available and authorized. Pass a compact digest to subagents when raw history is unavailable. Do not glob across `$HOME/.codex/sessions` or unrelated tasks. A workflow that cannot obtain the required history must say so and use its documented digest fallback.

## Automations

The `automations/benny` subtree originated as a Cursor Automation pack. In Codex, use the automation-management capability exposed by the app, and only after the user asks to create or update an automation. Repository prompt/config files can remain supporting inputs, but placing files under `.codex/automations/` does not itself register an automation. If Slack, webhook triggers, or another required connector is unavailable, stop that automation setup and name the missing capability.

## Authority and safety

Pstack's autonomy language never expands the user's authorization. Reversible diagnostics and in-scope implementation can proceed. External messages, ticket changes, merges, deployments, destructive operations, persistent automations, and other consequential mutations still require the authority and approvals imposed by the current Codex environment.
