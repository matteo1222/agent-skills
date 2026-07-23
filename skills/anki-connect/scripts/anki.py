#!/usr/bin/env python3
"""Human-first, script-friendly CLI for a local AnkiConnect server."""

from __future__ import annotations

import argparse
import base64
import json
import os
import socket
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable, Optional, Sequence


CLI_VERSION = "1.0.0"
API_VERSION = 6
DEFAULT_URL = "http://127.0.0.1:8765"
DEFAULT_TIMEOUT = 10.0

EXIT_FAILURE = 1
EXIT_USAGE = 2
EXIT_CONNECTION = 3
EXIT_API = 4
EXIT_INPUT = 5

DESTRUCTIVE_ACTIONS = {
    "deleteDecks",
    "deleteMediaFile",
    "deleteNotes",
    "forgetCards",
}


class CliError(Exception):
    def __init__(self, message: str, exit_code: int = EXIT_FAILURE):
        super().__init__(message)
        self.exit_code = exit_code


@dataclass
class Outcome:
    value: Any
    human: Optional[str] = None
    changed: bool = False
    emitted: bool = False


class AnkiClient:
    def __init__(
        self,
        url: str,
        timeout: float,
        key: Optional[str] = None,
        verbose: int = 0,
    ):
        self.url = url
        self.timeout = timeout
        self.key = key
        self.verbose = verbose

    def invoke(self, action: str, params: Optional[dict[str, Any]] = None) -> Any:
        payload: dict[str, Any] = {"action": action, "version": API_VERSION}
        if params:
            payload["params"] = params
        if self.key:
            payload["key"] = self.key

        if self.verbose:
            print(f"anki: POST {self.url} action={action}", file=sys.stderr)

        request = urllib.request.Request(
            self.url,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                raw = response.read()
        except urllib.error.HTTPError as error:
            detail = error.read(500).decode("utf-8", errors="replace").strip()
            suffix = f": {detail}" if detail else ""
            raise CliError(
                f"AnkiConnect returned HTTP {error.code}{suffix}", EXIT_CONNECTION
            ) from error
        except (urllib.error.URLError, socket.timeout, TimeoutError) as error:
            reason = getattr(error, "reason", error)
            raise CliError(
                f"Cannot reach AnkiConnect at {self.url}: {reason}. "
                "Open Anki and verify that AnkiConnect is installed.",
                EXIT_CONNECTION,
            ) from error

        try:
            data = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise CliError(
                "AnkiConnect returned a malformed JSON response", EXIT_API
            ) from error

        if not isinstance(data, dict) or "result" not in data or "error" not in data:
            raise CliError(
                "AnkiConnect response is missing result or error", EXIT_API
            )
        if data["error"] is not None:
            raise CliError(f"AnkiConnect: {data['error']}", EXIT_API)
        return data["result"]


def positive_int(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f"expected an integer, got {value!r}") from error
    if number <= 0:
        raise argparse.ArgumentTypeError("expected a positive integer")
    return number


def positive_float(value: str) -> float:
    try:
        number = float(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError(f"expected a number, got {value!r}") from error
    if number <= 0:
        raise argparse.ArgumentTypeError("expected a positive number")
    return number


def read_text(path: str) -> str:
    if path == "-":
        return sys.stdin.read()
    try:
        return Path(path).expanduser().read_text(encoding="utf-8")
    except OSError as error:
        raise CliError(f"Cannot read {path}: {error}", EXIT_INPUT) from error


def read_json(path: str) -> Any:
    raw = read_text(path)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as error:
        location = f"line {error.lineno}, column {error.colno}"
        raise CliError(f"Invalid JSON in {path}: {error.msg} ({location})", EXIT_INPUT)


def parse_json_object(raw: str, source: str) -> dict[str, Any]:
    try:
        value = json.loads(raw)
    except json.JSONDecodeError as error:
        raise CliError(
            f"Invalid JSON in {source}: {error.msg} "
            f"(line {error.lineno}, column {error.colno})",
            EXIT_INPUT,
        )
    if not isinstance(value, dict):
        raise CliError(f"{source} must contain a JSON object", EXIT_INPUT)
    return value


def require_object(value: Any, source: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise CliError(f"{source} must contain a JSON object", EXIT_INPUT)
    return value


def require_notes(value: Any, source: str) -> list[dict[str, Any]]:
    if isinstance(value, dict) and "notes" in value:
        value = value["notes"]
    if not isinstance(value, list) or not all(isinstance(item, dict) for item in value):
        raise CliError(
            f"{source} must contain a JSON array of note objects "
            "or an object with a notes array",
            EXIT_INPUT,
        )
    return value


def parse_fields(values: Optional[list[str]]) -> dict[str, str]:
    fields: dict[str, str] = {}
    for item in values or []:
        if "=" not in item:
            raise CliError(
                f"Invalid field {item!r}; use --field NAME=VALUE", EXIT_USAGE
            )
        name, value = item.split("=", 1)
        if not name:
            raise CliError("Field name cannot be empty", EXIT_USAGE)
        if name in fields:
            raise CliError(f"Field {name!r} was provided more than once", EXIT_USAGE)
        fields[name] = value
    return fields


def read_key_file(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    key = read_text(path).strip()
    if not key:
        raise CliError(f"API key file is empty: {path}", EXIT_INPUT)
    return key


def confirm(args: argparse.Namespace, description: str) -> None:
    if getattr(args, "dry_run", False) or getattr(args, "force", False):
        return
    if args.no_input or not sys.stdin.isatty():
        raise CliError(
            f"{description} requires confirmation; rerun with --force", EXIT_USAGE
        )
    print(f"{description}. Type 'yes' to continue: ", end="", file=sys.stderr)
    if input().strip().lower() != "yes":
        raise CliError("Cancelled")


def request_preview(action: str, params: Optional[dict[str, Any]]) -> dict[str, Any]:
    request: dict[str, Any] = {"action": action, "version": API_VERSION}
    if params:
        request["params"] = params
    return request


def mutate(
    client: AnkiClient,
    args: argparse.Namespace,
    action: str,
    params: Optional[dict[str, Any]],
    human: str,
) -> Outcome:
    if args.dry_run:
        return Outcome(
            request_preview(action, params),
            human=f"Would {human[0].lower() + human[1:]}",
            changed=True,
        )
    result = client.invoke(action, params)
    return Outcome(result, human=f"{human} succeeded", changed=True)


def emit_plain(value: Any) -> None:
    if value is None:
        return
    if isinstance(value, bool):
        print("true" if value else "false")
    elif isinstance(value, (str, int, float)):
        print(value)
    elif isinstance(value, list):
        for item in value:
            if isinstance(item, bool):
                print("true" if item else "false")
            elif item is None:
                print("null")
            elif isinstance(item, (str, int, float)):
                print(item)
            else:
                print(json.dumps(item, ensure_ascii=False, separators=(",", ":")))
    elif isinstance(value, dict):
        for key in sorted(value):
            item = value[key]
            rendered = (
                str(item)
                if isinstance(item, (str, int, float))
                else json.dumps(item, ensure_ascii=False, separators=(",", ":"))
            )
            print(f"{key}\t{rendered}")
    else:
        print(json.dumps(value, ensure_ascii=False, separators=(",", ":")))


def emit(args: argparse.Namespace, outcome: Outcome) -> None:
    if outcome.emitted:
        return
    if args.quiet and outcome.changed:
        return
    if args.json:
        print(json.dumps(outcome.value, ensure_ascii=False, sort_keys=True))
        return
    if args.plain:
        emit_plain(outcome.value)
        return
    if outcome.human is not None:
        print(outcome.human)
        return
    value = outcome.value
    if isinstance(value, list) and all(
        item is None or isinstance(item, (str, int, float, bool)) for item in value
    ):
        emit_plain(value)
    elif isinstance(value, (str, int, float, bool)) or value is None:
        emit_plain(value)
    else:
        print(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True))


def handle_status(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    permission = client.invoke("requestPermission")
    if not isinstance(permission, dict):
        raise CliError("AnkiConnect returned malformed permission data", EXIT_API)
    value = {"url": client.url, **permission}
    granted = permission.get("permission") == "granted"
    version = permission.get("version")
    human = (
        f"Connected to AnkiConnect v{version} at {client.url}"
        if granted
        else f"AnkiConnect permission is {permission.get('permission', 'unknown')}"
    )
    return Outcome(value, human=human)


def handle_actions(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    params = {"scopes": ["actions"], "actions": args.actions or None}
    return Outcome(client.invoke("apiReflect", params))


def handle_sync(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return mutate(client, args, "sync", None, "Sync Anki")


def load_raw_params(args: argparse.Namespace) -> dict[str, Any]:
    if args.params is not None:
        return parse_json_object(args.params, "--params")
    if args.params_file is not None:
        return require_object(read_json(args.params_file), args.params_file)
    return {}


def handle_raw(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    params = load_raw_params(args)
    if args.action in DESTRUCTIVE_ACTIONS:
        confirm(args, f"Run destructive action {args.action}")
    if args.dry_run:
        return Outcome(
            request_preview(args.action, params),
            human=f"Would call {args.action}",
            changed=True,
        )
    return Outcome(client.invoke(args.action, params))


def handle_batch(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    value = read_json(args.input)
    actions = value.get("actions") if isinstance(value, dict) else value
    if not isinstance(actions, list) or not all(
        isinstance(action, dict) and isinstance(action.get("action"), str)
        for action in actions
    ):
        raise CliError(
            f"{args.input} must contain an array of AnkiConnect action objects "
            "or an object with an actions array",
            EXIT_INPUT,
        )
    destructive = [
        action["action"]
        for action in actions
        if action["action"] in DESTRUCTIVE_ACTIONS
    ]
    if destructive:
        confirm(args, f"Run destructive batch actions: {', '.join(destructive)}")
    return mutate(
        client,
        args,
        "multi",
        {"actions": actions},
        f"Run {len(actions)} AnkiConnect actions",
    )


def handle_deck_list(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    action = "deckNamesAndIds" if args.ids else "deckNames"
    return Outcome(client.invoke(action))


def handle_deck_create(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    if args.dry_run:
        return mutate(
            client, args, "createDeck", {"deck": args.name}, f"Create deck {args.name!r}"
        )
    deck_id = client.invoke("createDeck", {"deck": args.name})
    return Outcome(
        {"name": args.name, "id": deck_id},
        human=f"Deck {args.name!r} is ready (id {deck_id})",
        changed=True,
    )


def handle_deck_delete(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    confirm(args, f"Delete {len(args.names)} deck(s) and all of their cards")
    return mutate(
        client,
        args,
        "deleteDecks",
        {"decks": args.names, "cardsToo": True},
        f"Delete {len(args.names)} deck(s)",
    )


def handle_deck_config_get(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return Outcome(client.invoke("getDeckConfig", {"deck": args.name}))


def handle_deck_config_save(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    config = require_object(read_json(args.input), args.input)
    return mutate(
        client,
        args,
        "saveDeckConfig",
        {"config": config},
        "Save deck configuration",
    )


def note_options(args: argparse.Namespace) -> dict[str, Any]:
    options: dict[str, Any] = {"allowDuplicate": args.allow_duplicate}
    if args.duplicate_scope:
        options["duplicateScope"] = args.duplicate_scope
    return options


def handle_note_add(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    fields = parse_fields(args.field)
    if not fields:
        raise CliError("note add requires at least one --field NAME=VALUE", EXIT_USAGE)
    note = {
        "deckName": args.deck,
        "modelName": args.model,
        "fields": fields,
        "tags": args.tag or [],
        "options": note_options(args),
    }
    if args.dry_run:
        return mutate(client, args, "addNote", {"note": note}, "Add one note")
    note_id = client.invoke("addNote", {"note": note})
    return Outcome(
        {"noteId": note_id},
        human=f"Added note {note_id}",
        changed=True,
    )


def handle_note_file_action(
    client: AnkiClient,
    args: argparse.Namespace,
    action: str,
    human_verb: str,
    changed: bool,
) -> Outcome:
    notes = require_notes(read_json(args.input), args.input)
    if changed:
        return mutate(
            client,
            args,
            action,
            {"notes": notes},
            f"{human_verb} {len(notes)} note(s)",
        )
    return Outcome(client.invoke(action, {"notes": notes}))


def handle_note_add_many(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_note_file_action(client, args, "addNotes", "Add", True)


def handle_note_can_add(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_note_file_action(
        client, args, "canAddNotesWithErrorDetail", "Check", False
    )


def handle_note_find(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return Outcome(client.invoke("findNotes", {"query": args.query}))


def handle_note_get(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return Outcome(client.invoke("notesInfo", {"notes": args.notes}))


def handle_note_update(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    fields = parse_fields(args.field)
    note: dict[str, Any] = {"id": args.note}
    if fields:
        note["fields"] = fields
    if args.clear_tags:
        note["tags"] = []
    elif args.tag is not None:
        note["tags"] = args.tag
    if len(note) == 1:
        raise CliError(
            "note update requires --field, --tag, or --clear-tags", EXIT_USAGE
        )
    return mutate(
        client,
        args,
        "updateNote",
        {"note": note},
        f"Update note {args.note}",
    )


def handle_note_delete(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    confirm(args, f"Delete {len(args.notes)} note(s) and their cards")
    return mutate(
        client,
        args,
        "deleteNotes",
        {"notes": args.notes},
        f"Delete {len(args.notes)} note(s)",
    )


def handle_tag_list(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return Outcome(client.invoke("getTags"))


def handle_tag_change(
    client: AnkiClient, args: argparse.Namespace, action: str, verb: str
) -> Outcome:
    return mutate(
        client,
        args,
        action,
        {"notes": args.notes, "tags": " ".join(args.tags)},
        f"{verb} tag(s) on {len(args.notes)} note(s)",
    )


def handle_tag_add(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_tag_change(client, args, "addTags", "Add")


def handle_tag_remove(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_tag_change(client, args, "removeTags", "Remove")


def handle_card_find(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    params: dict[str, Any] = {"query": args.query}
    if args.metric:
        params["fields"] = args.metric
    return Outcome(client.invoke("findCards", params))


def handle_card_get(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    params: dict[str, Any] = {"cards": args.cards}
    if args.mode:
        params["retrieved_info_mode"] = args.mode
    if args.note_field:
        params["noteFields"] = args.note_field
    if args.metric:
        params["fields"] = args.metric
    return Outcome(client.invoke("cardsInfo", params))


def handle_card_move(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return mutate(
        client,
        args,
        "changeDeck",
        {"cards": args.cards, "deck": args.deck},
        f"Move {len(args.cards)} card(s) to {args.deck!r}",
    )


def handle_card_simple(
    client: AnkiClient,
    args: argparse.Namespace,
    action: str,
    verb: str,
    destructive: bool = False,
) -> Outcome:
    if destructive:
        confirm(args, f"{verb} {len(args.cards)} card(s)")
    return mutate(
        client,
        args,
        action,
        {"cards": args.cards},
        f"{verb} {len(args.cards)} card(s)",
    )


def handle_card_suspend(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_card_simple(client, args, "suspend", "Suspend")


def handle_card_unsuspend(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_card_simple(client, args, "unsuspend", "Unsuspend")


def handle_card_forget(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_card_simple(client, args, "forgetCards", "Reset", destructive=True)


def handle_card_relearn(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_card_simple(client, args, "relearnCards", "Relearn")


def handle_card_set_due(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return mutate(
        client,
        args,
        "setDueDate",
        {"cards": args.cards, "days": args.days},
        f"Set due date for {len(args.cards)} card(s) to {args.days!r}",
    )


def handle_model_list(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    action = "modelNamesAndIds" if args.ids else "modelNames"
    return Outcome(client.invoke(action))


def handle_model_named_read(
    client: AnkiClient, args: argparse.Namespace, action: str
) -> Outcome:
    return Outcome(client.invoke(action, {"modelName": args.model}))


def handle_model_fields(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_model_named_read(client, args, "modelFieldNames")


def handle_model_templates(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_model_named_read(client, args, "modelTemplates")


def handle_model_styling(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_model_named_read(client, args, "modelStyling")


def handle_model_create(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    params = require_object(read_json(args.input), args.input)
    return mutate(client, args, "createModel", params, "Create note type")


def handle_model_templates_set(
    client: AnkiClient, args: argparse.Namespace
) -> Outcome:
    templates = require_object(read_json(args.input), args.input)
    params = {"model": {"name": args.model, "templates": templates}}
    return mutate(
        client,
        args,
        "updateModelTemplates",
        params,
        f"Update templates for {args.model!r}",
    )


def handle_model_styling_set(
    client: AnkiClient, args: argparse.Namespace
) -> Outcome:
    css = read_text(args.input)
    params = {"model": {"name": args.model, "css": css}}
    return mutate(
        client,
        args,
        "updateModelStyling",
        params,
        f"Update styling for {args.model!r}",
    )


def handle_media_list(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return Outcome(client.invoke("getMediaFilesNames", {"pattern": args.pattern}))


def handle_media_get(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    output = args.output
    if args.dry_run:
        return Outcome(
            request_preview("retrieveMediaFile", {"filename": args.name}),
            human=f"Would retrieve {args.name!r} to {output!r}",
            changed=True,
        )
    if output == "-" and args.json:
        raise CliError("--json cannot be combined with --output -", EXIT_USAGE)
    target = None if output == "-" else Path(output).expanduser()
    if target is not None and target.exists():
        confirm(args, f"Overwrite local file {target}")
    encoded = client.invoke("retrieveMediaFile", {"filename": args.name})
    if encoded is False:
        raise CliError(f"Media file not found: {args.name}", EXIT_API)
    try:
        content = base64.b64decode(encoded, validate=True)
    except (ValueError, TypeError) as error:
        raise CliError("AnkiConnect returned invalid base64 media data", EXIT_API) from error
    if output == "-":
        sys.stdout.buffer.write(content)
        return Outcome(None, emitted=True)
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
    except OSError as error:
        raise CliError(f"Cannot write {target}: {error}", EXIT_INPUT) from error
    value = {"filename": args.name, "output": str(target), "bytes": len(content)}
    return Outcome(
        value,
        human=f"Saved {args.name!r} to {target} ({len(content)} bytes)",
        changed=True,
    )


def handle_media_put(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    source = Path(args.input).expanduser()
    name = args.name or source.name
    if not name:
        raise CliError("Media filename cannot be empty", EXIT_USAGE)
    try:
        content = source.read_bytes()
    except OSError as error:
        raise CliError(f"Cannot read {source}: {error}", EXIT_INPUT) from error
    params = {
        "filename": name,
        "data": base64.b64encode(content).decode("ascii"),
    }
    if args.dry_run:
        preview = request_preview(
            "storeMediaFile",
            {"filename": name, "data": f"<base64:{len(content)} bytes>"},
        )
        return Outcome(
            preview,
            human=f"Would store {source} as {name!r}",
            changed=True,
        )
    existing = client.invoke("getMediaFilesNames", {"pattern": name})
    if name in existing:
        confirm(args, f"Replace Anki media file {name!r}")
    result = client.invoke("storeMediaFile", params)
    return Outcome(
        {"filename": result, "bytes": len(content)},
        human=f"Stored {source} as {result!r}",
        changed=True,
    )


def handle_media_delete(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    confirm(args, f"Delete {len(args.names)} Anki media file(s)")
    actions = [
        {"action": "deleteMediaFile", "params": {"filename": name}}
        for name in args.names
    ]
    return mutate(
        client,
        args,
        "multi",
        {"actions": actions},
        f"Delete {len(args.names)} media file(s)",
    )


def handle_review_simple(
    client: AnkiClient,
    args: argparse.Namespace,
    action: str,
    params: Optional[dict[str, Any]],
    human: Optional[str] = None,
) -> Outcome:
    if human:
        return mutate(client, args, action, params, human)
    return Outcome(client.invoke(action, params))


def handle_review_start(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_review_simple(
        client,
        args,
        "guiDeckReview",
        {"name": args.deck},
        f"Start review for {args.deck!r}",
    )


def handle_review_browse(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_review_simple(
        client, args, "guiBrowse", {"query": args.query}, "Open Anki browser"
    )


def handle_review_current(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_review_simple(client, args, "guiCurrentCard", None)


def handle_review_show_question(
    client: AnkiClient, args: argparse.Namespace
) -> Outcome:
    return handle_review_simple(
        client, args, "guiShowQuestion", None, "Show current question"
    )


def handle_review_show_answer(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_review_simple(
        client, args, "guiShowAnswer", None, "Show current answer"
    )


def handle_review_answer(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_review_simple(
        client,
        args,
        "guiAnswerCard",
        {"ease": args.ease},
        f"Answer current card with ease {args.ease}",
    )


def handle_review_undo(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return handle_review_simple(client, args, "guiUndo", None, "Undo last Anki action")


def handle_package_export(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    path = Path(args.output).expanduser().resolve()
    if path.exists():
        confirm(args, f"Overwrite local package {path}")
    params = {
        "deck": args.deck,
        "path": str(path),
        "includeSched": args.include_scheduling,
    }
    return mutate(
        client,
        args,
        "exportPackage",
        params,
        f"Export {args.deck!r} to {path}",
    )


def handle_package_import(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    path = Path(args.input).expanduser().resolve()
    if not path.is_file():
        raise CliError(f"Package does not exist: {path}", EXIT_INPUT)
    confirm(args, f"Import package {path} into the Anki collection")
    return mutate(
        client,
        args,
        "importPackage",
        {"path": str(path)},
        f"Import {path}",
    )


def handle_stats_reviewed_today(
    client: AnkiClient, args: argparse.Namespace
) -> Outcome:
    return Outcome(client.invoke("getNumCardsReviewedToday"))


def handle_stats_reviewed_by_day(
    client: AnkiClient, args: argparse.Namespace
) -> Outcome:
    return Outcome(client.invoke("getNumCardsReviewedByDay"))


def handle_stats_collection(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return Outcome(
        client.invoke(
            "getCollectionStatsHTML", {"wholeCollection": args.whole_collection}
        )
    )


def handle_stats_reviews(client: AnkiClient, args: argparse.Namespace) -> Outcome:
    return Outcome(
        client.invoke("cardReviews", {"deck": args.deck, "startID": args.since_ms})
    )


def add_force(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="skip an overwrite or destructive-action confirmation",
    )


def add_cards(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("cards", nargs="+", type=positive_int, metavar="CARD_ID")


def add_notes(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("notes", nargs="+", type=positive_int, metavar="NOTE_ID")


def add_nested(
    parent: argparse.ArgumentParser, name: str, help_text: str
) -> argparse.ArgumentParser:
    return parent.add_parser(name, help=help_text, description=help_text)


def build_parser() -> argparse.ArgumentParser:
    examples = """examples:
  anki status --json
  anki deck list
  anki note add --deck Spanish --field Front=hola --field Back=hello
  anki card find 'deck:Spanish is:due'
  anki --dry-run card suspend 1234567890
  anki raw version
"""
    parser = argparse.ArgumentParser(
        prog="anki",
        description="Control a local Anki desktop collection through AnkiConnect.",
        epilog=examples,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--url",
        default=os.environ.get("ANKI_CONNECT_URL", DEFAULT_URL),
        help=f"AnkiConnect endpoint (env: ANKI_CONNECT_URL; default: {DEFAULT_URL})",
    )
    parser.add_argument(
        "--key-file",
        default=os.environ.get("ANKI_CONNECT_KEY_FILE"),
        help="file containing the AnkiConnect API key (env: ANKI_CONNECT_KEY_FILE)",
    )
    parser.add_argument(
        "--timeout",
        type=positive_float,
        default=os.environ.get("ANKI_CONNECT_TIMEOUT", str(DEFAULT_TIMEOUT)),
        help="request timeout in seconds (env: ANKI_CONNECT_TIMEOUT; default: 10)",
    )
    output = parser.add_mutually_exclusive_group()
    output.add_argument("--json", action="store_true", help="emit compact JSON")
    output.add_argument("--plain", action="store_true", help="emit stable line-based text")
    parser.add_argument(
        "-q",
        "--quiet",
        action="store_true",
        help="suppress successful mutation messages",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="count",
        default=0,
        help="show request diagnostics on stderr",
    )
    parser.add_argument(
        "-n",
        "--dry-run",
        action="store_true",
        help="print mutation requests without sending them",
    )
    parser.add_argument(
        "--no-input",
        action="store_true",
        help="disable prompts and fail when confirmation is required",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {CLI_VERSION}")

    commands = parser.add_subparsers(dest="command", required=True)

    status = commands.add_parser("status", help="check AnkiConnect connectivity")
    status.set_defaults(handler=handle_status)

    actions = commands.add_parser("actions", help="list or inspect supported actions")
    actions.add_argument("actions", nargs="*", metavar="ACTION")
    actions.set_defaults(handler=handle_actions)

    sync = commands.add_parser("sync", help="synchronize Anki with AnkiWeb")
    sync.set_defaults(handler=handle_sync)

    raw = commands.add_parser("raw", help="invoke any AnkiConnect action")
    raw.add_argument("action", metavar="ACTION")
    raw_input = raw.add_mutually_exclusive_group()
    raw_input.add_argument("--params", help="inline JSON parameter object")
    raw_input.add_argument(
        "--params-file", metavar="PATH", help="JSON parameter object file, or -"
    )
    add_force(raw)
    raw.set_defaults(handler=handle_raw)

    batch = commands.add_parser("batch", help="invoke actions through AnkiConnect multi")
    batch.add_argument("input", metavar="JSON_FILE", help="action array file, or -")
    add_force(batch)
    batch.set_defaults(handler=handle_batch)

    deck = commands.add_parser("deck", help="manage decks")
    decks = deck.add_subparsers(dest="deck_command", required=True)
    deck_list = add_nested(decks, "list", "list decks")
    deck_list.add_argument("--ids", action="store_true", help="include deck IDs")
    deck_list.set_defaults(handler=handle_deck_list)
    deck_create = add_nested(decks, "create", "create a deck")
    deck_create.add_argument("name", metavar="NAME")
    deck_create.set_defaults(handler=handle_deck_create)
    deck_delete = add_nested(decks, "delete", "delete decks and their cards")
    deck_delete.add_argument("names", nargs="+", metavar="NAME")
    add_force(deck_delete)
    deck_delete.set_defaults(handler=handle_deck_delete)
    deck_config_get = add_nested(decks, "config-get", "get a deck configuration")
    deck_config_get.add_argument("name", metavar="NAME")
    deck_config_get.set_defaults(handler=handle_deck_config_get)
    deck_config_save = add_nested(
        decks, "config-save", "save a deck configuration object"
    )
    deck_config_save.add_argument("input", metavar="JSON_FILE")
    deck_config_save.set_defaults(handler=handle_deck_config_save)

    note = commands.add_parser("note", help="manage notes")
    notes = note.add_subparsers(dest="note_command", required=True)
    note_add = add_nested(notes, "add", "add one note")
    note_add.add_argument("--deck", required=True, metavar="NAME")
    note_add.add_argument("--model", default="Basic", metavar="NAME")
    note_add.add_argument(
        "--field", action="append", metavar="NAME=VALUE", help="repeat for each field"
    )
    note_add.add_argument(
        "--tag", action="append", metavar="TAG", help="repeat for each tag"
    )
    note_add.add_argument("--allow-duplicate", action="store_true")
    note_add.add_argument(
        "--duplicate-scope", choices=("deck", "collection"), metavar="SCOPE"
    )
    note_add.set_defaults(handler=handle_note_add)
    note_add_many = add_nested(notes, "add-many", "add notes from JSON")
    note_add_many.add_argument("input", metavar="JSON_FILE")
    note_add_many.set_defaults(handler=handle_note_add_many)
    note_can_add = add_nested(notes, "can-add", "validate notes without adding them")
    note_can_add.add_argument("input", metavar="JSON_FILE")
    note_can_add.set_defaults(handler=handle_note_can_add)
    note_find = add_nested(notes, "find", "find note IDs with an Anki query")
    note_find.add_argument("query", metavar="QUERY")
    note_find.set_defaults(handler=handle_note_find)
    note_get = add_nested(notes, "get", "get note details")
    add_notes(note_get)
    note_get.set_defaults(handler=handle_note_get)
    note_update = add_nested(notes, "update", "update note fields or exact tags")
    note_update.add_argument("note", type=positive_int, metavar="NOTE_ID")
    note_update.add_argument("--field", action="append", metavar="NAME=VALUE")
    tag_mode = note_update.add_mutually_exclusive_group()
    tag_mode.add_argument("--tag", action="append", metavar="TAG")
    tag_mode.add_argument("--clear-tags", action="store_true")
    note_update.set_defaults(handler=handle_note_update)
    note_delete = add_nested(notes, "delete", "delete notes and their cards")
    add_notes(note_delete)
    add_force(note_delete)
    note_delete.set_defaults(handler=handle_note_delete)

    tag = commands.add_parser("tag", help="manage note tags")
    tags = tag.add_subparsers(dest="tag_command", required=True)
    tag_list = add_nested(tags, "list", "list all tags")
    tag_list.set_defaults(handler=handle_tag_list)
    for name, handler, help_text in (
        ("add", handle_tag_add, "add tags to notes"),
        ("remove", handle_tag_remove, "remove tags from notes"),
    ):
        tag_command = add_nested(tags, name, help_text)
        add_notes(tag_command)
        tag_command.add_argument(
            "--tag", dest="tags", action="append", required=True, metavar="TAG"
        )
        tag_command.set_defaults(handler=handler)

    card = commands.add_parser("card", help="manage cards")
    cards = card.add_subparsers(dest="card_command", required=True)
    card_find = add_nested(cards, "find", "find card IDs with an Anki query")
    card_find.add_argument("query", metavar="QUERY")
    card_find.add_argument(
        "--metric", action="append", choices=("prop:r", "prop:s"), metavar="FIELD"
    )
    card_find.set_defaults(handler=handle_card_find)
    card_get = add_nested(cards, "get", "get card details")
    add_cards(card_get)
    card_get.add_argument(
        "--mode", choices=("ALL", "COMPACT", "FIELDS_ONLY"), metavar="MODE"
    )
    card_get.add_argument("--note-field", action="append", metavar="NAME")
    card_get.add_argument(
        "--metric",
        action="append",
        choices=("prop:r", "prop:s", "prop:d"),
        metavar="FIELD",
    )
    card_get.set_defaults(handler=handle_card_get)
    card_move = add_nested(cards, "move", "move cards to a deck")
    card_move.add_argument("--deck", required=True, metavar="NAME")
    add_cards(card_move)
    card_move.set_defaults(handler=handle_card_move)
    for name, handler, help_text in (
        ("suspend", handle_card_suspend, "suspend cards"),
        ("unsuspend", handle_card_unsuspend, "unsuspend cards"),
        ("relearn", handle_card_relearn, "put cards into relearning"),
    ):
        card_command = add_nested(cards, name, help_text)
        add_cards(card_command)
        card_command.set_defaults(handler=handler)
    card_forget = add_nested(cards, "forget", "reset cards to new")
    add_cards(card_forget)
    add_force(card_forget)
    card_forget.set_defaults(handler=handle_card_forget)
    card_due = add_nested(cards, "set-due", "set a due date or range")
    card_due.add_argument("--days", required=True, metavar="DAYS")
    add_cards(card_due)
    card_due.set_defaults(handler=handle_card_set_due)

    model = commands.add_parser("model", help="manage note types")
    models = model.add_subparsers(dest="model_command", required=True)
    model_list = add_nested(models, "list", "list note types")
    model_list.add_argument("--ids", action="store_true", help="include model IDs")
    model_list.set_defaults(handler=handle_model_list)
    for name, handler, help_text in (
        ("fields", handle_model_fields, "list fields for a note type"),
        ("templates", handle_model_templates, "get templates for a note type"),
        ("styling", handle_model_styling, "get CSS for a note type"),
    ):
        model_command = add_nested(models, name, help_text)
        model_command.add_argument("model", metavar="MODEL")
        model_command.set_defaults(handler=handler)
    model_create = add_nested(models, "create", "create a note type from JSON")
    model_create.add_argument("input", metavar="JSON_FILE")
    model_create.set_defaults(handler=handle_model_create)
    templates_set = add_nested(
        models, "templates-set", "update note type templates from JSON"
    )
    templates_set.add_argument("model", metavar="MODEL")
    templates_set.add_argument("input", metavar="JSON_FILE")
    templates_set.set_defaults(handler=handle_model_templates_set)
    styling_set = add_nested(models, "styling-set", "update note type CSS from a file")
    styling_set.add_argument("model", metavar="MODEL")
    styling_set.add_argument("input", metavar="CSS_FILE")
    styling_set.set_defaults(handler=handle_model_styling_set)

    media = commands.add_parser("media", help="manage collection media")
    medias = media.add_subparsers(dest="media_command", required=True)
    media_list = add_nested(medias, "list", "list media filenames")
    media_list.add_argument("--pattern", default="*", metavar="GLOB")
    media_list.set_defaults(handler=handle_media_list)
    media_get = add_nested(medias, "get", "retrieve a media file")
    media_get.add_argument("name", metavar="NAME")
    media_get.add_argument("-o", "--output", required=True, metavar="PATH")
    add_force(media_get)
    media_get.set_defaults(handler=handle_media_get)
    media_put = add_nested(medias, "put", "store a local file as Anki media")
    media_put.add_argument("input", metavar="FILE")
    media_put.add_argument("--name", metavar="NAME")
    add_force(media_put)
    media_put.set_defaults(handler=handle_media_put)
    media_delete = add_nested(medias, "delete", "delete Anki media files")
    media_delete.add_argument("names", nargs="+", metavar="NAME")
    add_force(media_delete)
    media_delete.set_defaults(handler=handle_media_delete)

    review = commands.add_parser("review", help="control the Anki review UI")
    reviews = review.add_subparsers(dest="review_command", required=True)
    review_start = add_nested(reviews, "start", "start review for a deck")
    review_start.add_argument("deck", metavar="DECK")
    review_start.set_defaults(handler=handle_review_start)
    review_browse = add_nested(reviews, "browse", "open the card browser with a query")
    review_browse.add_argument("query", metavar="QUERY")
    review_browse.set_defaults(handler=handle_review_browse)
    for name, handler, help_text in (
        ("current", handle_review_current, "get the current review card"),
        ("show-question", handle_review_show_question, "show the current question"),
        ("show-answer", handle_review_show_answer, "show the current answer"),
        ("undo", handle_review_undo, "undo the last Anki action"),
    ):
        review_command = add_nested(reviews, name, help_text)
        review_command.set_defaults(handler=handler)
    review_answer = add_nested(reviews, "answer", "answer the current card")
    review_answer.add_argument("ease", type=int, choices=(1, 2, 3, 4), metavar="EASE")
    review_answer.set_defaults(handler=handle_review_answer)

    package = commands.add_parser("package", help="import or export Anki packages")
    packages = package.add_subparsers(dest="package_command", required=True)
    package_export = add_nested(packages, "export", "export a deck as .apkg")
    package_export.add_argument("--deck", required=True, metavar="NAME")
    package_export.add_argument("-o", "--output", required=True, metavar="PATH")
    package_export.add_argument("--include-scheduling", action="store_true")
    add_force(package_export)
    package_export.set_defaults(handler=handle_package_export)
    package_import = add_nested(packages, "import", "import an .apkg file")
    package_import.add_argument("input", metavar="PATH")
    add_force(package_import)
    package_import.set_defaults(handler=handle_package_import)

    stats = commands.add_parser("stats", help="read collection statistics")
    statistics = stats.add_subparsers(dest="stats_command", required=True)
    reviewed_today = add_nested(
        statistics, "reviewed-today", "get today's review count"
    )
    reviewed_today.set_defaults(handler=handle_stats_reviewed_today)
    reviewed_by_day = add_nested(
        statistics, "reviewed-by-day", "get daily review counts"
    )
    reviewed_by_day.set_defaults(handler=handle_stats_reviewed_by_day)
    collection = add_nested(
        statistics, "collection", "get Anki's collection statistics HTML"
    )
    collection.add_argument("--whole-collection", action="store_true")
    collection.set_defaults(handler=handle_stats_collection)
    stats_reviews = add_nested(
        statistics, "reviews", "get review history for a deck"
    )
    stats_reviews.add_argument("--deck", required=True, metavar="NAME")
    stats_reviews.add_argument("--since-ms", required=True, type=int, metavar="UNIX_MS")
    stats_reviews.set_defaults(handler=handle_stats_reviews)

    return parser


GLOBAL_VALUE_FLAGS = {"--url", "--key-file", "--timeout"}
GLOBAL_BOOLEAN_FLAGS = {
    "--json",
    "--plain",
    "-q",
    "--quiet",
    "-v",
    "--verbose",
    "-n",
    "--dry-run",
    "--no-input",
    "--version",
}


def normalize_global_flags(argv: Sequence[str]) -> list[str]:
    """Allow documented global flags before or after nested subcommands."""
    global_args: list[str] = []
    command_args: list[str] = []
    index = 0
    while index < len(argv):
        item = argv[index]
        if item in GLOBAL_VALUE_FLAGS:
            if index + 1 >= len(argv):
                global_args.append(item)
                index += 1
                continue
            global_args.extend((item, argv[index + 1]))
            index += 2
        elif any(item.startswith(f"{flag}=") for flag in GLOBAL_VALUE_FLAGS):
            global_args.append(item)
            index += 1
        elif item in GLOBAL_BOOLEAN_FLAGS:
            global_args.append(item)
            index += 1
        else:
            command_args.append(item)
            index += 1
    return global_args + command_args


def run(
    argv: Optional[Sequence[str]] = None,
    client_factory: Callable[..., AnkiClient] = AnkiClient,
) -> int:
    parser = build_parser()
    raw_argv = list(sys.argv[1:] if argv is None else argv)
    args = parser.parse_args(normalize_global_flags(raw_argv))
    key = read_key_file(args.key_file)
    client = client_factory(
        url=args.url,
        timeout=args.timeout,
        key=key,
        verbose=args.verbose,
    )
    outcome = args.handler(client, args)
    emit(args, outcome)
    return 0


def main() -> int:
    try:
        return run()
    except CliError as error:
        print(f"anki: error: {error}", file=sys.stderr)
        return error.exit_code
    except BrokenPipeError:
        return 0
    except KeyboardInterrupt:
        print("anki: interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
