# Anki CLI contract

Use this reference when selecting commands or depending on output, safety, configuration, and exit-code behavior. Examples use `anki` as shorthand for:

```bash
python3 <skill-dir>/scripts/anki.py
```

## Contents

- [Usage](#usage)
- [Command tree](#command-tree)
- [Global flags](#global-flags)
- [Command semantics](#command-semantics)
- [Output and errors](#output-and-errors)
- [Safety](#safety)
- [Configuration](#configuration)
- [Examples](#examples)

## Usage

```text
anki [global flags] <command> [subcommand] [arguments and flags]
```

Global flags may appear before or after nested subcommands. Use:

```bash
anki --help
anki note --help
anki note add --help
```

## Command tree

```text
status
actions [ACTION...]
sync
raw ACTION [--params JSON | --params-file PATH] [--force]
batch JSON_FILE [--force]

deck
  list [--ids]
  create NAME
  delete NAME... [--force]
  config-get NAME
  config-save JSON_FILE

note
  add --deck NAME [--model NAME] --field NAME=VALUE...
      [--tag TAG...] [--allow-duplicate]
      [--duplicate-scope deck|collection]
  add-many JSON_FILE
  can-add JSON_FILE
  find QUERY
  get NOTE_ID...
  update NOTE_ID [--field NAME=VALUE...] [--tag TAG... | --clear-tags]
  delete NOTE_ID... [--force]

tag
  list
  add NOTE_ID... --tag TAG...
  remove NOTE_ID... --tag TAG...

card
  find QUERY [--metric prop:r|prop:s...]
  get CARD_ID... [--mode ALL|COMPACT|FIELDS_ONLY]
      [--note-field NAME...] [--metric prop:r|prop:s|prop:d...]
  move --deck NAME CARD_ID...
  suspend CARD_ID...
  unsuspend CARD_ID...
  set-due --days DAYS CARD_ID...
  forget CARD_ID... [--force]
  relearn CARD_ID...

model
  list [--ids]
  fields MODEL
  templates MODEL
  styling MODEL
  create JSON_FILE
  templates-set MODEL JSON_FILE
  styling-set MODEL CSS_FILE

media
  list [--pattern GLOB]
  get NAME --output PATH|- [--force]
  put FILE [--name NAME] [--force]
  delete NAME... [--force]

review
  start DECK
  browse QUERY
  current
  show-question
  show-answer
  answer 1|2|3|4
  undo

package
  export --deck NAME --output PATH [--include-scheduling] [--force]
  import PATH [--force]

stats
  reviewed-today
  reviewed-by-day
  collection [--whole-collection]
  reviews --deck NAME --since-ms UNIX_MS
```

## Global flags

| Flag | Type/default | Contract |
|---|---|---|
| `-h`, `--help` | boolean | Show context-sensitive help. |
| `--version` | boolean | Print the CLI version to stdout. |
| `--url URL` | `http://127.0.0.1:8765` | Select the AnkiConnect endpoint. |
| `--key-file PATH` | unset | Read the API key from a file; the key is never logged. |
| `--timeout SECONDS` | `10` | Bound each HTTP request. |
| `--json` | boolean | Emit one compact JSON value. |
| `--plain` | boolean | Emit stable line-oriented text. |
| `-q`, `--quiet` | boolean | Suppress mutation success messages; preserve query data. |
| `-v`, `--verbose` | repeatable | Write endpoint/action diagnostics to stderr. |
| `-n`, `--dry-run` | boolean | Emit mutation requests without sending them. |
| `--no-input` | boolean | Disable prompts; fail when confirmation is required. |

`--json` and `--plain` are mutually exclusive.

## Command semantics

### Connection and escape hatches

- `status` calls `requestPermission` and reports endpoint, permission, API-key requirement, and version.
- `actions` uses `apiReflect`. With names, it checks only those actions.
- `sync` calls Anki's `sync` action.
- `raw` accepts an inline JSON parameter object or a file. It prints the raw action result.
- `batch` accepts an action array or `{"actions": [...]}` and sends one `multi` request. Results preserve action order.

### Decks

- `deck list --ids` returns the name-to-ID map; without `--ids`, it returns names.
- `deck create` is safe to repeat because AnkiConnect does not overwrite an existing deck.
- `deck delete` also deletes the contained cards and requires confirmation.
- `deck config-get` returns the complete configuration object expected by `config-save`. Modify that object rather than constructing undocumented fields.

### Notes and tags

- `note add` defaults to model `Basic`. Each `--field` splits on the first `=`, so values may contain `=`.
- `note add-many` sends `addNotes`; `note can-add` sends `canAddNotesWithErrorDetail`.
- `note update --tag` replaces the exact tag list. Use `tag add` or `tag remove` for incremental changes.
- Deleting a note also deletes all cards generated from it.
- Anki search syntax is documented in the [Anki manual](https://docs.ankiweb.net/searching.html).

### Cards

- `card find` and `card get` expose FSRS metrics supported by current AnkiConnect builds: retrievability (`prop:r`), stability (`prop:s`), and difficulty (`prop:d`, get only).
- `card get --mode COMPACT` omits rendered question, answer, CSS, and next-review payloads. `FIELDS_ONLY` returns only IDs, selected note fields, and metrics.
- `card set-due` passes Anki's date expression unchanged, such as `0`, `1!`, or `3-7`.
- `card forget` resets scheduling and requires confirmation.

### Models, media, review, packages, and stats

- `model` is the CLI name for Anki note types because AnkiConnect calls them models.
- `media get --output -` writes raw bytes to stdout and cannot be combined with `--json`.
- `media put` base64-encodes a local file. Replacing an existing media name requires confirmation.
- `review answer` uses Anki ease buttons `1` through `4`; the answer must be visible before Anki accepts a rating.
- Package paths are resolved locally because Anki and the CLI run on the same computer.
- `stats collection` returns Anki-generated HTML. Use `--whole-collection` instead of the current deck context.

## Output and errors

Primary results go to stdout. Diagnostics, prompts, and errors go to stderr.

- Default query output prints scalar lists one item per line and pretty-prints structured data.
- Default mutation output states what changed.
- `--json` prints the AnkiConnect result or a structured CLI result.
- `--plain` prints scalars one per line, objects as sorted `key<TAB>value` rows, and nested values as compact JSON.

Exit codes:

| Code | Meaning |
|---:|---|
| `0` | Success. |
| `1` | Generic failure or cancelled prompt. |
| `2` | Invalid CLI usage or missing non-interactive confirmation. |
| `3` | AnkiConnect endpoint/HTTP/timeout failure. |
| `4` | AnkiConnect API error or malformed response. |
| `5` | Invalid or unreadable local input/output. |
| `130` | Interrupted with Ctrl-C. |

## Safety

`--dry-run` never sends mutation actions. For `raw`, it previews every action; for high-level commands, read operations still run normally.

TTY prompts protect:

- deck and note deletion;
- media deletion and overwrite;
- card scheduling reset (`forget`);
- package import and export overwrite;
- destructive actions inside `raw` or `batch`.

In a non-interactive shell, protected commands fail with code 2 unless `--force` is present. `--force` skips only confirmation; server-side validation remains active.

## Configuration

Precedence is command flag, environment variable, built-in default.

| Setting | Flag | Environment | Default |
|---|---|---|---|
| Endpoint | `--url` | `ANKI_CONNECT_URL` | `http://127.0.0.1:8765` |
| API key file | `--key-file` | `ANKI_CONNECT_KEY_FILE` | unset |
| Timeout | `--timeout` | `ANKI_CONNECT_TIMEOUT` | `10` seconds |

The CLI uses no config file and performs no telemetry.

## Examples

```bash
# Preflight and inventory
anki status --json
anki deck list --ids --json
anki model fields Basic --plain

# Create and verify one note
anki note add \
  --deck Spanish \
  --model Basic \
  --field Front=hola \
  --field Back=hello \
  --tag vocabulary \
  --json
anki note find 'deck:Spanish Front:hola' --plain

# Validate and add a batch from stdin
generate-notes | anki note can-add - --json
generate-notes | anki note add-many - --json

# Inspect due cards without large rendered fields
anki card find 'deck:Spanish is:due' --plain
anki card get 1712345678901 --mode COMPACT --json

# Preview then apply a scheduling change
anki card set-due --days 3-7 1712345678901 --dry-run --json
anki card set-due --days 3-7 1712345678901

# Raw and batched API access
anki raw findNotes --params '{"query":"tag:leech"}' --json
anki batch actions.json --dry-run --json

# Media and package transfer
anki media put ./audio/example.mp3 --name example.mp3
anki media get example.mp3 --output ./example.mp3
anki package export --deck Spanish --output ./Spanish.apkg
```
