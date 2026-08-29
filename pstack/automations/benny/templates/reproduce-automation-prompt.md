# Reproduce scheduled-task prompt

> Source material for the copied setup workflow. After the user explicitly asks for creation, paraphrase this intent into the live Codex scheduled-task tool or editor. Follow the current tool schema; if no creation-capable automation tool is available, provide this as a manual prompt and fail closed.

Read and follow `.codex/pstack/benny/pack/skills/reproduce-and-fix-issues/SKILL.md` for this run.

Configuration source. Include this repository-relative path only when it is committed in the same target repository. Otherwise paraphrase the configured values. Never use a plugin source or cache path:

```text
{{BENNY_CONFIG_PATH}}
```

Trigger:

```json
{
	"source_channel_id": "{{SLACK_CHANNEL_ID}}",
	"message_ts": "{{SLACK_MESSAGE_TS}}",
	"thread_ts": "{{SLACK_THREAD_TS_OR_EMPTY}}"
}
```

On each approved schedule, inspect a bounded recent window for configured triage markers on unprocessed reports. Do not claim an event trigger unless the live automation tool advertises one. Include the configured repository, default branch, issue tracker, control adapter, feature map, and draft pull request capability. If any required live connector or action is unavailable, stop without writes.

Treat the source channel and root thread timestamp as immutable. If either is missing or does not match configuration, stop without posting.

Wait for a configured triage marker from the configured triage identity in this exact thread. Proceed only for `[benny:bug]` or `[benny:performance]`.

Require the configured control-adapter skill before attempting a repro. Reproduce the exact discriminating symptom twice through the real UI. Verify existing pull requests or commits without authoring over them. Attempt a bounded fix only after a confirmed repro and the operational file's fix gate.

The coordinator is the only Slack poster. Every child prompt must forbid `SendSlackMessage`, `PostToSlack`, `chat.postMessage`, and all other Slack writes. Children return findings only.

Record a stable processed result so later scheduled polls do not repeat the same work.

Never post a root message in the source channel.
