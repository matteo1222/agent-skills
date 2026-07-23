import contextlib
import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).parents[1] / "scripts" / "anki.py"
SPEC = importlib.util.spec_from_file_location("anki_connect_cli", SCRIPT)
anki = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
sys.modules[SPEC.name] = anki
SPEC.loader.exec_module(anki)


class FakeClient:
    def __init__(self, responses=None):
        self.responses = responses or {}
        self.calls = []
        self.url = "http://127.0.0.1:8765"

    def invoke(self, action, params=None):
        self.calls.append((action, params))
        response = self.responses.get(action)
        return response(action, params) if callable(response) else response


def run_cli(argv, client):
    stdout = io.StringIO()
    stderr = io.StringIO()
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        code = anki.run(argv, client_factory=lambda **_kwargs: client)
    return code, stdout.getvalue(), stderr.getvalue()


class CliTests(unittest.TestCase):
    def test_status_reports_permission_and_version(self):
        client = FakeClient(
            {
                "requestPermission": {
                    "permission": "granted",
                    "requireApiKey": False,
                    "version": 6,
                }
            }
        )

        code, stdout, _ = run_cli(["status", "--json"], client)

        self.assertEqual(code, 0)
        self.assertEqual(json.loads(stdout)["version"], 6)
        self.assertEqual(client.calls, [("requestPermission", None)])

    def test_global_flags_work_after_nested_command(self):
        client = FakeClient({"deckNames": ["Default", "Spanish"]})

        _, stdout, _ = run_cli(["deck", "list", "--plain"], client)

        self.assertEqual(stdout, "Default\nSpanish\n")

    def test_note_add_builds_ankiconnect_payload(self):
        client = FakeClient({"addNote": 123})

        _, stdout, _ = run_cli(
            [
                "note",
                "add",
                "--deck",
                "Spanish",
                "--field",
                "Front=hola",
                "--field",
                "Back=hello",
                "--tag",
                "language",
                "--json",
            ],
            client,
        )

        self.assertEqual(json.loads(stdout), {"noteId": 123})
        action, params = client.calls[0]
        self.assertEqual(action, "addNote")
        self.assertEqual(params["note"]["modelName"], "Basic")
        self.assertEqual(params["note"]["fields"], {"Front": "hola", "Back": "hello"})
        self.assertEqual(params["note"]["tags"], ["language"])

    def test_note_add_many_reads_array(self):
        notes = [
            {
                "deckName": "Default",
                "modelName": "Basic",
                "fields": {"Front": "Q", "Back": "A"},
            }
        ]
        client = FakeClient({"addNotes": [101]})
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "notes.json"
            path.write_text(json.dumps(notes), encoding="utf-8")

            _, stdout, _ = run_cli(["note", "add-many", str(path), "--json"], client)

        self.assertEqual(json.loads(stdout), [101])
        self.assertEqual(client.calls, [("addNotes", {"notes": notes})])

    def test_note_can_add_uses_detailed_action(self):
        client = FakeClient(
            {"canAddNotesWithErrorDetail": [{"canAdd": False, "error": "duplicate"}]}
        )
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "notes.json"
            path.write_text('{"notes": []}', encoding="utf-8")

            run_cli(["note", "can-add", str(path), "--json"], client)

        self.assertEqual(
            client.calls, [("canAddNotesWithErrorDetail", {"notes": []})]
        )

    def test_dry_run_does_not_call_client(self):
        client = FakeClient()

        _, stdout, _ = run_cli(["deck", "create", "Test", "--dry-run", "--json"], client)

        payload = json.loads(stdout)
        self.assertEqual(payload["action"], "createDeck")
        self.assertEqual(payload["params"], {"deck": "Test"})
        self.assertEqual(client.calls, [])

    def test_destructive_noninteractive_command_requires_force(self):
        client = FakeClient()

        with self.assertRaises(anki.CliError) as raised:
            run_cli(["note", "delete", "123", "--no-input"], client)

        self.assertEqual(raised.exception.exit_code, anki.EXIT_USAGE)
        self.assertIn("--force", str(raised.exception))

    def test_force_allows_destructive_command(self):
        client = FakeClient({"deleteNotes": None})

        _, stdout, _ = run_cli(
            ["note", "delete", "123", "456", "--force"], client
        )

        self.assertIn("Delete 2 note(s)", stdout)
        self.assertEqual(
            client.calls, [("deleteNotes", {"notes": [123, 456]})]
        )

    def test_raw_parses_inline_params(self):
        client = FakeClient({"findCards": [7, 8]})

        _, stdout, _ = run_cli(
            ["raw", "findCards", "--params", '{"query":"is:due"}', "--json"],
            client,
        )

        self.assertEqual(json.loads(stdout), [7, 8])
        self.assertEqual(
            client.calls, [("findCards", {"query": "is:due"})]
        )

    def test_batch_accepts_actions_object(self):
        client = FakeClient({"multi": [["Default"], 6]})
        value = {"actions": [{"action": "deckNames"}, {"action": "version"}]}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "batch.json"
            path.write_text(json.dumps(value), encoding="utf-8")

            _, stdout, _ = run_cli(["batch", str(path), "--json"], client)

        self.assertEqual(json.loads(stdout), [["Default"], 6])
        self.assertEqual(client.calls, [("multi", value)])

    def test_media_put_base64_encodes_file(self):
        client = FakeClient(
            {
                "getMediaFilesNames": [],
                "storeMediaFile": "sound.mp3",
            }
        )
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sound.mp3"
            path.write_bytes(b"audio")

            _, stdout, _ = run_cli(["media", "put", str(path), "--json"], client)

        self.assertEqual(json.loads(stdout), {"filename": "sound.mp3", "bytes": 5})
        self.assertEqual(client.calls[0], ("getMediaFilesNames", {"pattern": "sound.mp3"}))
        self.assertEqual(
            client.calls[1][1]["data"],
            "YXVkaW8=",
        )

    def test_card_get_passes_compact_options(self):
        client = FakeClient({"cardsInfo": []})

        run_cli(
            [
                "card",
                "get",
                "123",
                "--mode",
                "COMPACT",
                "--note-field",
                "Front",
                "--metric",
                "prop:r",
                "--json",
            ],
            client,
        )

        self.assertEqual(
            client.calls,
            [
                (
                    "cardsInfo",
                    {
                        "cards": [123],
                        "retrieved_info_mode": "COMPACT",
                        "noteFields": ["Front"],
                        "fields": ["prop:r"],
                    },
                )
            ],
        )

    def test_tag_add_joins_tags_for_ankiconnect(self):
        client = FakeClient({"addTags": None})

        run_cli(
            ["tag", "add", "123", "456", "--tag", "language", "--tag", "lesson-1"],
            client,
        )

        self.assertEqual(
            client.calls,
            [
                (
                    "addTags",
                    {"notes": [123, 456], "tags": "language lesson-1"},
                )
            ],
        )

    def test_model_templates_set_wraps_template_map(self):
        client = FakeClient({"updateModelTemplates": None})
        templates = {"Card 1": {"Front": "{{Q}}", "Back": "{{A}}"}}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "templates.json"
            path.write_text(json.dumps(templates), encoding="utf-8")

            run_cli(["model", "templates-set", "Concept", str(path)], client)

        self.assertEqual(
            client.calls,
            [
                (
                    "updateModelTemplates",
                    {"model": {"name": "Concept", "templates": templates}},
                )
            ],
        )

    def test_review_answer_uses_gui_action(self):
        client = FakeClient({"guiAnswerCard": True})

        run_cli(["review", "answer", "3"], client)

        self.assertEqual(client.calls, [("guiAnswerCard", {"ease": 3})])

    def test_stats_reviews_uses_millisecond_cursor(self):
        client = FakeClient({"cardReviews": []})

        run_cli(
            ["stats", "reviews", "--deck", "Spanish", "--since-ms", "1700000000000"],
            client,
        )

        self.assertEqual(
            client.calls,
            [
                (
                    "cardReviews",
                    {"deck": "Spanish", "startID": 1700000000000},
                )
            ],
        )

    def test_package_export_dry_run_resolves_path(self):
        client = FakeClient()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "Spanish.apkg"

            _, stdout, _ = run_cli(
                [
                    "package",
                    "export",
                    "--deck",
                    "Spanish",
                    "--output",
                    str(output),
                    "--dry-run",
                    "--json",
                ],
                client,
            )

        payload = json.loads(stdout)
        self.assertEqual(payload["action"], "exportPackage")
        self.assertEqual(payload["params"]["path"], str(output.resolve()))
        self.assertEqual(client.calls, [])

    def test_deck_config_save_passes_complete_object(self):
        client = FakeClient({"saveDeckConfig": True})
        config = {"id": 1, "name": "Default", "new": {"perDay": 20}}
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            path.write_text(json.dumps(config), encoding="utf-8")

            run_cli(["deck", "config-save", str(path)], client)

        self.assertEqual(client.calls, [("saveDeckConfig", {"config": config})])

    def test_invalid_field_fails_before_api_call(self):
        client = FakeClient()

        with self.assertRaises(anki.CliError) as raised:
            run_cli(
                ["note", "add", "--deck", "Default", "--field", "Front"],
                client,
            )

        self.assertEqual(raised.exception.exit_code, anki.EXIT_USAGE)
        self.assertEqual(client.calls, [])

    def test_quiet_suppresses_mutation_but_not_query_data(self):
        mutation_client = FakeClient({"suspend": True})
        _, mutation_stdout, _ = run_cli(
            ["card", "suspend", "123", "--quiet"], mutation_client
        )
        query_client = FakeClient({"findCards": [123]})
        _, query_stdout, _ = run_cli(
            ["card", "find", "is:due", "--quiet"], query_client
        )

        self.assertEqual(mutation_stdout, "")
        self.assertEqual(query_stdout, "123\n")


class _FakeResponse:
    def __init__(self, value):
        self.body = json.dumps(value).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def read(self):
        return self.body


class ClientTests(unittest.TestCase):
    def test_http_client_sends_version_params_and_key(self):
        response = _FakeResponse({"result": ["Default"], "error": None})
        with mock.patch.object(
            anki.urllib.request, "urlopen", return_value=response
        ) as urlopen:
            client = anki.AnkiClient(
                "http://127.0.0.1:8765", timeout=1, key="secret"
            )
            result = client.invoke("deckNames", {"ignored": False})

        self.assertEqual(result, ["Default"])
        request = urlopen.call_args.args[0]
        self.assertEqual(
            json.loads(request.data),
            {
                "action": "deckNames",
                "version": 6,
                "params": {"ignored": False},
                "key": "secret",
            },
        )

    def test_http_client_surfaces_api_error(self):
        response = _FakeResponse({"result": None, "error": "unsupported action"})
        with mock.patch.object(anki.urllib.request, "urlopen", return_value=response):
            client = anki.AnkiClient("http://127.0.0.1:8765", timeout=1)
            with self.assertRaises(anki.CliError) as raised:
                client.invoke("missing")

        self.assertEqual(raised.exception.exit_code, anki.EXIT_API)
        self.assertIn("unsupported action", str(raised.exception))


if __name__ == "__main__":
    unittest.main()
