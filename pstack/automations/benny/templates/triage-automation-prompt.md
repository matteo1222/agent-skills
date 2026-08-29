# Triage scheduled-task prompt

> Source material for the copied setup workflow. After the user explicitly asks for creation, paraphrase this intent into the live Codex scheduled-task tool or editor. Follow the current tool schema; if no creation-capable automation tool is available, provide this as a manual prompt and fail closed.

Read and follow `.codex/pstack/benny/pack/skills/triage-issue-reports/SKILL.md` for this run.

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

On each approved schedule, inspect a bounded recent window and select at most the configured number of unprocessed top-level reports in the configured source Slack channel. Do not claim an event trigger unless the live automation tool advertises one. If the Slack connector or any required action is unavailable, stop without writes.

Treat the source channel and root thread timestamp as immutable. If either is missing or does not match configuration, stop without posting or writing to the issue tracker.

The committed operational file owns classification, attachment review, cause tracing, routing, dedupe, tracker writes, and the final verdict. Post no progress messages. Never post a root message in the source channel.

The coordinator is the only Slack poster. Any delegated worker must be read-only, return findings only, and receive an explicit ban on every Slack write action.

The report must carry a stable processed marker or permalink check so later scheduled polls do not repeat the same work.

End the single verdict with exactly one configured marker:

```text
[benny:bug]
[benny:performance]
[benny:other]
```

A bug or performance marker may add `tracker=<URL>`.
