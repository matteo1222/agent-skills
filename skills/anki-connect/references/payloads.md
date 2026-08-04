# Structured input payloads

Read this reference before constructing JSON files for bulk notes, note types, deck configuration, raw actions, or batches. The CLI adds the outer AnkiConnect `action` and `version` envelope.

## Contents

- [Notes](#notes)
- [Create a note type](#create-a-note-type)
- [Update templates or styling](#update-templates-or-styling)
- [Save deck configuration](#save-deck-configuration)
- [Raw parameters](#raw-parameters)
- [Batch actions](#batch-actions)

## Notes

`note add-many` and `note can-add` accept either an array:

```json
[
  {
    "deckName": "Spanish",
    "modelName": "Basic",
    "fields": {
      "Front": "hola",
      "Back": "hello"
    },
    "tags": ["vocabulary", "lesson-01"],
    "options": {
      "allowDuplicate": false
    }
  }
]
```

or an object containing the array:

```json
{
  "notes": [
    {
      "deckName": "Spanish",
      "modelName": "Cloze",
      "fields": {
        "Text": "La capital de España es {{c1::Madrid}}.",
        "Extra": "Madrid"
      },
      "tags": ["geography"]
    }
  ]
}
```

Use exact field names returned by:

```bash
anki model fields Basic --json
```

Optional duplicate controls:

```json
{
  "options": {
    "allowDuplicate": false,
    "duplicateScope": "deck"
  }
}
```

Run `note can-add` against the final payload before `note add-many`. Each result contains `canAdd` and an error detail.

## Create a note type

`model create` accepts the parameter object for AnkiConnect `createModel`:

```json
{
  "modelName": "Concept",
  "inOrderFields": ["Question", "Answer", "Source"],
  "css": ".card { font-family: sans-serif; font-size: 22px; }",
  "isCloze": false,
  "cardTemplates": [
    {
      "Name": "Concept Card",
      "Front": "{{Question}}",
      "Back": "{{FrontSide}}<hr id=\"answer\">{{Answer}}<br>{{Source}}"
    }
  ]
}
```

Every template needs `Front` and `Back`; `Name` is optional. A cloze note type sets `isCloze` to `true` and normally uses one template.

## Update templates or styling

`model templates-set MODEL FILE` accepts only the template map returned by `model templates MODEL`:

```json
{
  "Card 1": {
    "Front": "{{Question}}",
    "Back": "{{FrontSide}}<hr id=\"answer\">{{Answer}}"
  }
}
```

Only named templates and sides in the file change. `model styling-set MODEL FILE` reads the CSS file as text, so its input is CSS rather than JSON.

Preview both commands and verify by reading `model templates` or `model styling` afterward.

## Save deck configuration

Start from the object returned by:

```bash
anki deck config-get Spanish --json
```

Modify the necessary fields while preserving its `id` and remaining members, then pass the complete object:

```bash
anki deck config-save updated-config.json --dry-run --json
anki deck config-save updated-config.json
```

Deck configuration fields vary across Anki scheduler versions; round-tripping the returned object avoids inventing a stale schema.

## Raw parameters

`raw` accepts the action-specific `params` object, not the outer request:

```bash
anki raw findCards --params '{"query":"deck:Spanish is:due"}' --json
```

The file form is equivalent:

```json
{
  "query": "deck:Spanish is:due"
}
```

```bash
anki raw findCards --params-file params.json --json
```

Use `anki actions ACTION --json` to check action availability. Consult current [AnkiConnect documentation](https://git.sr.ht/~foosoft/anki-connect) for parameters outside this skill's high-level commands.

## Batch actions

`batch` accepts an action array:

```json
[
  {
    "action": "deckNames"
  },
  {
    "action": "findCards",
    "params": {
      "query": "is:due"
    }
  }
]
```

The wrapped form is also accepted:

```json
{
  "actions": [
    {"action": "deckNames"},
    {"action": "modelNames"}
  ]
}
```

AnkiConnect returns one result per action in input order. Inspect every entry because a `multi` call can return a successful outer response containing per-action errors.
