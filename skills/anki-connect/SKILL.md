---
name: anki-connect
description: Control a local Anki desktop collection through AnkiConnect. Use when the user wants to inspect, search, create, update, review, sync, import, or export Anki decks, notes, cards, note types, tags, media, packages, or statistics, or when diagnosing and invoking the AnkiConnect API.
---

# Anki Connect

Use the bundled `scripts/anki.py` CLI as the deterministic boundary around AnkiConnect API v6. Resolve this skill's directory and run the script with Python 3:

```bash
python3 <skill-dir>/scripts/anki.py status
python3 <skill-dir>/scripts/anki.py deck list
python3 <skill-dir>/scripts/anki.py card find 'deck:Spanish is:due' --json
```

## Round trip

1. **Preflight.** Run `status --json` before the first collection request. Continue when permission is `granted` and the reported version is at least 6. If connection fails, ask the user to open Anki and verify that the [AnkiConnect add-on](https://ankiweb.net/shared/info/2055492159) is installed. The step is complete when the endpoint, permission, and API version are known.

2. **Inspect.** Resolve human descriptions to exact deck names and note/card IDs with `deck list`, `note find`, `note get`, `card find`, or `card get`. Read-only requests can end here. A mutation continues only when every target is explicit.

3. **Preview.** Run mutations with `--dry-run` when they affect multiple objects, scheduling, templates, styling, configuration, imports, or an unfamiliar raw action. For bulk notes, run `note can-add` against the same JSON first. The step is complete when the emitted action and parameters match the user's request.

4. **Mutate.** Execute the same command without `--dry-run`. Deletions, card resets, imports, and overwrites prompt on a TTY; pass `--force` only when the user has authorized the exact targets. The step is complete when AnkiConnect returns success.

5. **Verify.** Repeat the narrowest read command that proves the requested postcondition. Report created IDs, changed counts or targets, and any partial batch results. The round trip is complete only when the observed collection state matches the request.

## Command selection

Run `--help` and `<group> --help` for discovery. Read [references/commands.md](references/commands.md) when choosing flags, output contracts, exit codes, or a less common command.

Use `raw` for an AnkiConnect action that has no high-level command. Prefer a high-level command when one exists because it supplies validation, safe file handling, and confirmations.

## Structured inputs

Read [references/payloads.md](references/payloads.md) before preparing JSON for `note add-many`, `note can-add`, `model create`, `model templates-set`, `deck config-save`, `batch`, or `raw`.

Accept JSON from `-` only when stdin is dedicated to that payload. Keep field values as strings; Anki permits HTML. Treat note/card IDs as integers and preserve them exactly.

## Connection and authentication

The default endpoint is `http://127.0.0.1:8765`. Override it with `--url` or `ANKI_CONNECT_URL`. Store an optional API key in a permission-restricted file and select it with `--key-file` or `ANKI_CONNECT_KEY_FILE`.

Use `--json` for structured results, `--plain` for stable line-oriented output, and default output for human-facing work. Primary data goes to stdout; diagnostics and errors go to stderr.
