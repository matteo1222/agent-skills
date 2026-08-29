# benny scheduled-task intent

## what i want to automate

i want two codex desktop scheduled tasks that work together in one slack issue channel. these files are a dormant prompt and configuration resource pack. they do not create tasks, connect slack, or send messages by themselves.

### task 1: triage issue reports

- trigger: on an approved schedule, i want this task to check for one unprocessed top-level report in my configured source slack channel, then keep its original thread coordinates.
- behavior: i want it to read the thread and attachments, classify the report as a bug or performance issue, feature request, question or feedback, or reroute, and trace the likely owning layer before routing.
- tracker: i want it to search my configured tracker for duplicates, update a confident duplicate, and create a ticket only for a clear net-new bug.
- tools: i want slack thread read and reply access, my configured tracker integration, and my optional routing map.
- outcome: i want exactly one reply in the source thread with a short verdict and `[benny:bug]`, `[benny:performance]`, or `[benny:other]`. a bug or performance marker may include the tracker url.
- boundary: i never want this task to post a root message in the source channel.

### task 2: reproduce and fix confirmed bugs

- trigger: on an approved schedule, i want this task to check the same reports for a trusted triage marker in the original thread.
- gates: i want it to stop when someone clearly owns the fix. if an existing pull request or merged commit may fix the report, i want verification instead of a competing change.
- behavior: i want it to use my configured control adapter and feature map, reproduce the exact symptom twice through the real ui, and capture screenshots, video, and a read-only state cross-check.
- fix: i want it to verify existing pull requests without authoring over them. after a confirmed repro, it may attempt one bounded root-cause fix, use tdd when the test is cheap, smoke the blast radius, and open a draft pull request only when before-and-after proof passes.
- tools: i want slack thread read and reply access, repository and history access, draft pull request creation, my configured tracker, and my control adapter.
- outcome: i want evidence and a verified result in the source or optional operations threads, plus an optional draft pull request. updates should be concise.
- boundary: i never want this task to post a root message in the source channel.

### shared rules

- i want the source channel and root thread coordinates to stay immutable for the whole run.
- i treat utility and debug bots as evidence, not delegation or fix ownership.
- i allow subagents to help, but they cannot post to slack or receive slack credentials.
- i want this entire pack committed at `.codex/pstack/benny/pack/` in the target repository. its `SKILL.md` files are direct task instructions, not discovered codex skills.
- pstack is already a global codex skill. i do not want project plugin settings or a second copy of pstack.
- i want each live scheduled-task prompt to read its committed operational file directly. i do not want cache paths, copied excerpts, or skill discovery.
- i keep user-owned configuration, feature maps, routing maps, and secrets outside the copied pack so pack refreshes cannot overwrite them.
- i want both tasks to fail closed when channel coordinates, tracker access, the control adapter, the feature map, or a required live connector is missing or uncertain.
- i want draft pull requests only. do not merge or deploy.
- setup must not create or update a scheduled task, send a test message, create a tracker issue, or perform any other external write until i explicitly ask for that action.

### my configuration

- source slack channel: `<channel>`
- optional operations channel: `<channel or none>`
- repository and default branch: `<repo>`, `<branch>`
- tracker: `<type, team, project, labels, intake status>`
- routing map: `<path or none>`
- triage identity: `<slack identity>`
- control skill: `<configured skill or adapter>`
- feature map: `<committed same-repo path outside the copied pack, or behavior to paraphrase>`
- codex profiles: `<triage model and effort, reproduce model and effort, code model and effort, media-review model and effort>`
- schedules: `<triage schedule, reproduce schedule, timezone>`
- status emoji strings: `<seen, reproducing, reproduced, blocked, fixing, failed, pull request opened>`
- budgets: `<polling, verdict wait, follow-up, repro, rejection, fix>`
- optional bot token capability: `<none, file download, or editable operations status>`

start from [`configuration.example.yaml`](./templates/configuration.example.yaml) and [`feature-map.example.md`](./skills/reproduce-and-fix-issues/references/feature-map.example.md). copy and fill them outside this pack, for example under `.codex/pstack/benny/`. keep secret values in a connector credential store, secret manager, or environment, never in committed files or chat.

## for the agent

the human enters setup by pointing codex at this file. do not look for or invoke a discovered benny skill.

1. ask which repository will run the scheduled tasks.
2. treat the directory containing this `FOR_AGENTS.md` as the source pack.
3. merge the entire source pack into `<target-repository>/.codex/pstack/benny/pack/`.
4. preserve every destination-only file. never delete unrelated files or overwrite user-owned configuration, feature maps, or routing maps.
5. when an existing destination file at a source-managed path differs, review the diff and merge without discarding local edits. if ownership is ambiguous, stop and ask before replacing it.
6. verify that the copied `FOR_AGENTS.md` and `skills/setup-benny/SKILL.md` exist in the target repository.
7. read and follow `.codex/pstack/benny/pack/skills/setup-benny/SKILL.md` directly from the target repository.

verify from a fresh codex task rooted in the target repository that the global `$pstack` router can load `how`, `why`, `tdd`, `unslop`, and the principle workflows used by benny. do not install or duplicate pstack in the project.

if a required live slack, tracker, github, control, or scheduled-task tool is unavailable, stop and explain what failed. use only tool names and schemas actually exposed in the current codex session; never invent an action or call an undocumented backend.

tell me that `.codex/pstack/benny/pack/` and any referenced secret-free configuration must be committed before either task is enabled. do not commit unless i ask. do not create, update, enable, or test a scheduled task until i explicitly ask.

when i explicitly ask for first-time creation, search for and use the live codex automation-management tool (normally `automation_update`) once for triage and once for repro and fix, following its current schema. complete the approval and editor handoff for the first task before starting the second. if no such tool is available, fail closed and give me the prepared prompts for manual setup instead.

paraphrase this intent and the finished configuration into each scheduled-task prompt. the triage prompt must read and follow `.codex/pstack/benny/pack/skills/triage-issue-reports/SKILL.md`. the repro prompt must read and follow `.codex/pstack/benny/pack/skills/reproduce-and-fix-issues/SKILL.md`.

for existing tasks, inspect or update them only when i explicitly ask and only through the live codex automation tools or editor. validate the configuration, use the concise field checklist in the copied setup file, and never create duplicates.
