---
name: setup-benny
description: Configure Benny and prepare its triage and repro Codex Desktop scheduled tasks. Use when installing Benny or changing its Slack, tracker, repository, routing, control, model, schedule, or budget settings.
disable-model-invocation: true
---

# Set up Benny

Benny ships as a dormant scheduled-task resource pack inside pstack. This file and the two operational files are read directly; they are not discovered Codex skills and they do not create tasks by themselves.

The human enters setup by pointing Codex at the pack's `FOR_AGENTS.md`. The bootstrap flow copies the whole pack into the target repository, then reads this file directly at `.codex/pstack/benny/pack/skills/setup-benny/SKILL.md`.

Benny needs external configuration, two live Codex Desktop scheduled tasks, and connected Slack, tracker, GitHub, and app-control capabilities. Those integrations are conditional: use only tools actually exposed in the current session and follow their live schemas.

Do not create, update, enable, or test a scheduled task until the user explicitly asks. Do not send Slack messages, create tracker items, open pull requests, or perform any other external write during setup unless the user explicitly asks for that action. Never put a secret value in pack files, prompts, committed configuration, or chat.

## 1. Copy the pack and verify global pstack

Do this before asking for Benny configuration.

Ask which repository will run the scheduled tasks. The source pack is the directory containing `FOR_AGENTS.md`. The destination is `<target-repository>/.codex/pstack/benny/pack/`.

Merge the entire source pack into the destination:

1. Create the destination when it is absent.
2. Copy every source file to the same relative path.
3. Preserve destination-only files. Never delete unrelated files during install or refresh.
4. Keep user-owned configuration, feature maps, and routing maps outside the destination. Never overwrite them.
5. When an existing source-managed file differs, inspect the diff and merge without discarding local edits. If ownership is ambiguous, stop and ask before replacing it.
6. Verify that the destination contains `FOR_AGENTS.md`, this setup file, both operational files, their references, and the templates.

If this file is already being read from the target destination, treat the copy as complete and run the same verification before continuing.

pstack is a global Codex skill. Do not create `.cursor/settings.json`, add a plugin entry, or duplicate pstack in the project. Start a fresh Codex task rooted in the target repository and verify that `$pstack` can route to these bundled workflows:

- `how`
- `why`
- `tdd`
- `unslop`
- `principle-separate-before-serializing-shared-state`
- `principle-minimize-reader-load`
- `principle-guard-the-context-window`
- `principle-sequence-verifiable-units`
- `principle-fix-root-causes`
- `principle-prove-it-works`

If the global pstack skill or any shared dependency cannot be loaded, stop and explain the failure.

The Benny files are read directly from `.codex/pstack/benny/pack/`. Do not place them under `.agents/skills`, add them to another manifest, or expect their `SKILL.md` files to appear in the skill list.

Tell the user that `.codex/pstack/benny/pack/` and any referenced secret-free configuration must be committed on the branch used by the scheduled task before either task is enabled. Do not commit unless the user asks.

Once this check passes, live task prompts may read the committed operational files by their stable repository-relative paths. They must not embed a global skill installation path, cache path, or copied excerpt.

## 2. Adapt the configuration

Open these copied examples:

- `../../templates/configuration.example.yaml`
- `../reproduce-and-fix-issues/references/feature-map.example.md`

Create user-owned copies outside `.codex/pstack/benny/pack/`. These are configuration files, not pack files. Example locations:

- Project config, such as `.codex/pstack/benny/configuration.yaml`
- Project feature map, such as `.codex/pstack/benny/feature-map.md`
- Project routing map, such as `.codex/pstack/benny/routing.md`
- User config, such as `~/.config/benny/configuration.yaml`
- User feature map, such as `~/.config/benny/feature-map.md`

Fill one feature-map section for every user-facing feature the repro task may exercise. Keep it at the user point of view. Do not freeze implementation details or current code paths in the map.

Do not edit the copied examples. Pack refreshes may update source-managed files after conflict review, but they must never touch the user-owned copies.

Prefer committed, secret-free files in the target repository when a scheduled task checkout must read them. Otherwise paraphrase the required values into the live prompt. Reference a repository file only after verifying that it is committed in the repository and branch where the scheduled task will run.

Use stable repository-relative paths for committed pack and configuration files. Never reference the global pstack payload or a cache path from a live task.

## 3. Fill the required choices

Ask for or confirm:

- Source Slack channel ID
- Optional operations or status channel ID
- Repository URL and default branch
- Triage identity or Slack user ID
- Issue tracker type, team, project, labels, and intake status
- Tracker connector or MCP actions
- Optional routing map path
- Required control skill name
- Required user-facing feature-map path
- Status emoji strings
- Pull request URL format
- Triage and repro schedules, including timezone
- Polling and effort budgets
- Model and reasoning-effort profile for triage, repro, code work, and media review

Use only model names and reasoning efforts actually supported by the live Codex subagent interface. Keep model and reasoning effort as separate fields. Do not guess an identifier or carry over a private default.

The source channel, triage identity, repository, tracker adapter, control skill, feature map, schedules, and timezone must be explicit. Fail setup if any required value stays ambiguous.

Use `$pstack unslop` on the final task names, descriptions, and prompt shims before saving them.

## 4. Check live integration capabilities

The triage task needs:

- Read access to the configured source Slack channel and its threads
- Thread-reply access in that channel
- Attachment metadata and file download access when reports include media
- Search, read, create, and update access through the configured issue-tracker connector

The repro task needs:

- Read access to the source thread
- Thread-reply access in the source channel
- Optional post and edit access in the configured operations channel
- Repository read and history access
- A GitHub action that can open a draft pull request
- The configured control-adapter skill

Inspect the live tool catalog and connected apps. Record the exact exposed action names and input schemas in user-owned configuration or the prompt. Never invent a tool name, assume a connector is installed, call an undocumented integration endpoint, or call a backend service directly.

An optional `BENNY_SLACK_BOT_TOKEN` may fill a narrow capability gap only when the user explicitly configures and authorizes that route. Store it in a secret manager or environment, never YAML or chat, and never expose it to a subagent.

If any required capability is absent, leave the affected task uncreated or disabled and fail closed.

## 5. Prepare the routing map

If the user wants reroutes or owner pings:

1. Copy `../triage-issue-reports/references/routing.example.md` outside `.codex/pstack/benny/pack/`.
2. Replace every placeholder with public or organization-local values.
3. Keep owner pings off by default.
4. Allow a ping only for a configured feature owner or a confirmed likely regression author.

If no routing map is configured, triage may classify a report but must not guess a destination or owner.

## 6. Verify the control adapter

Read `../reproduce-and-fix-issues/references/control-adapter.md` and the user's completed feature map.

Confirm that the named live skill or tool can:

- Bring up the target app
- Navigate every mapped feature through the real UI
- Exercise mapped states through declared adapter actions
- Inspect state without forcing the result
- Capture screenshots
- Start and stop a recording
- Clean up its processes and temporary data

If any capability is missing, leave the repro task uncreated or disabled. It must fail closed rather than claim a reproduction it did not perform.

## 7. Prepare the live scheduled tasks

Ask whether this is first-time creation or configuration of existing tasks. Do not inspect or mutate live task state until the user explicitly requests it.

Read `../../FOR_AGENTS.md` from the copied pack as the primary user-intent source. Use the matching prompt template as secondary source material.

### First-time creation

Only after the user explicitly requests creation, search for the live Codex automation-management tool, normally `automation_update`. Follow the schema exposed in the current session. If no creation-capable tool is available, stop and give the user the completed prompts and editor checklist for manual setup.

Create one task at a time:

1. Turn `FOR_AGENTS.md`, the finished Benny configuration, and the matching template into a complete prompt.
2. Tell the live prompt to read its exact committed operational file under `.codex/pstack/benny/pack/`.
3. Use a stable repository-relative path. Do not copy the operational file contents into the prompt.
4. Use the user's approved schedule and timezone. Because Codex scheduled tasks are schedule-driven, instruct each run to poll only a bounded window and process at most the configured number of unprocessed reports. Do not claim an event/webhook trigger unless the live tool actually advertises one.
5. Review the proposed name, schedule, working directory, connected apps, prompt, and enabled state with the user.
6. Obtain any confirmation required by the live tool. Keep the new task disabled until configuration and thread-safety tests are ready.
7. Finish review of the first task before starting the second.

The triage prompt must include:

- Name `benny-triage`.
- Read and follow `.codex/pstack/benny/pack/skills/triage-issue-reports/SKILL.md` for every run.
- On each approved schedule, find at most the configured number of unprocessed top-level reports in the configured source Slack channel.
- Read each triggering thread and reply only inside it.
- Use the configured issue-tracker integration.
- Classify, inspect evidence, trace cause, dedupe, and create only clear new bugs.
- End one thread-only verdict with the configured `[benny:bug]`, `[benny:performance]`, or `[benny:other]` marker and optional tracker URL.
- Never post a source-channel root message.

The repro prompt must include:

- Name `benny-reproduce`.
- Read and follow `.codex/pstack/benny/pack/skills/reproduce-and-fix-issues/SKILL.md` for every run.
- On each approved schedule, inspect only the configured bounded report window.
- Use the configured repository and default branch.
- Read the source thread and reply only inside it.
- Include draft pull request, tracker, control-adapter, and feature-map requirements.
- Wait for a trusted triage marker before acting.
- Reproduce the exact symptom twice through the mapped real UI and capture evidence.
- Verify an existing fix without authoring over it.
- Attempt an optional bounded fix only after confirmed repro, then open a draft pull request when proof and checks pass.
- Never post a source-channel root message.

### Existing tasks

Only after the user explicitly asks to inspect or update existing tasks, use the live Codex automation tool or the Scheduled tasks editor. If neither is available, provide the checklist without claiming an update.

For the existing triage task, check:

- Name, description, approved schedule, timezone, and working directory
- Direct instruction to read `.codex/pstack/benny/pack/skills/triage-issue-reports/SKILL.md`
- Bounded Slack polling window and source channel
- Slack thread read and reply capabilities
- Issue-tracker integration
- Paraphrased triage instructions, thread-only rule, dedupe marker, and Benny verdict markers

For the existing repro task, check:

- Name, description, approved schedule, timezone, and working directory
- Direct instruction to read `.codex/pstack/benny/pack/skills/reproduce-and-fix-issues/SKILL.md`
- Matching bounded Slack polling window and source channel
- Repository and default branch
- Slack thread read and reply capabilities
- Draft pull request action
- Tracker, control-adapter, and feature-map requirements
- Paraphrased marker wait, evidence, verification, dedupe marker, and bounded-fix instructions

Do not create replacements or duplicates.

### State-change boundary

Do not call a task or automation backend directly, invent an API, encode draft fields in a browser URL, or build a private protocol deep link. Use only the live Codex automation tool with its exposed schema or the Codex Desktop Scheduled tasks editor. Every creation, update, enablement, test message, and other external write requires the user's explicit request.

Do not enable either task until the thread-safety test passes after the editor or tool save.

## 8. Test thread safety

Use a test channel or a harmless test report only after the user explicitly requests the test.

Before testing, confirm that `.codex/pstack/benny/pack/` and every referenced secret-free configuration file are committed on the branch used by the task. Confirm that both live prompts point at their exact committed operational files. Confirm that the live Slack and tracker actions still match their configured schemas. If any check fails, stop.

Verify:

1. Triage stores the root `thread_ts` and posts exactly one verdict as a reply.
2. The verdict contains one configured marker.
3. Repro accepts the marker only from the configured triage identity.
4. Repro keeps the same immutable source coordinates.
5. No source-channel root message appears.
6. A delegated worker cannot use any Slack write action.
7. Missing coordinates, a deleted parent, a failed preflight, or an unavailable connector produces no post and no tracker issue.
8. A later scheduled poll recognizes the processed marker and does not duplicate work.

Enable normal scheduled runs only after all eight checks pass and the user explicitly asks to enable them.
