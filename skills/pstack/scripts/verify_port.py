#!/usr/bin/env python3
"""Check the Codex payload and its compatibility ledger against upstream."""

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


def files(root):
    return {
        path.relative_to(root).as_posix(): path
        for path in root.rglob("*")
        if path.is_file()
        and not {"node_modules", "__pycache__"}.intersection(path.parts)
        and path.name not in {".DS_Store", ".bootstrap-key"}
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream", required=True, type=Path,
                        help="Extracted pstack directory at the ledger's pinned commit")
    args = parser.parse_args()
    shim = Path(__file__).resolve().parents[1]
    payload = shim.parents[1] / "pstack"
    upstream = files(args.upstream)
    local = files(payload)
    problems = []
    ledger = (payload / "CODEX_PORT.md").read_text()
    section = ledger.split("## Modified upstream files", 1)[1]
    declared = set(re.search(r"```text\n(.*?)\n```", section, re.S).group(1).splitlines())
    missing = upstream.keys() - local.keys()
    extra = local.keys() - upstream.keys() - {"CODEX_PORT.md"}
    if missing:
        problems.append(f"Missing upstream files: {sorted(missing)}")
    if extra:
        problems.append(f"Unlisted payload additions: {sorted(extra)}")
    modified = {name for name in upstream.keys() & local.keys()
                if upstream[name].read_bytes() != local[name].read_bytes()}
    if modified != declared:
        problems.append(f"Ledger differences: unlisted={sorted(modified - declared)}, "
                        f"unchanged={sorted(declared - modified)}")
    version = json.loads((payload / ".cursor-plugin/plugin.json").read_text())["version"]
    upstream_version = json.loads((args.upstream / ".cursor-plugin/plugin.json").read_text())["version"]
    if version != upstream_version or f"Upstream version: `{version}`" not in ledger:
        problems.append("Manifest and ledger versions do not match upstream")
    markdown = [path for path in local.values() if path.suffix == ".md"]
    markdown += list(shim.rglob("*.md"))
    for path in markdown:
        content = path.read_text()
        if re.search(r"^(<<<<<<<|=======|>>>>>>>)(?: |$)", content, re.M):
            problems.append(f"Merge marker in {path}")
        for match in re.finditer(r"\[[^\]]*\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)", content):
            raw = match.group(1).strip("<>")
            link = urlsplit(raw)
            if link.scheme or not link.path or raw == "url" or "<" in raw or ">" in raw:
                continue
            target = path.parent / unquote(link.path)
            if not target.exists():
                problems.append(f"Missing link in {path}: {raw}")
    print(f"pstack {version}: {len(upstream)} upstream files, "
          f"{len(modified)} adapted, {len(upstream) - len(modified)} identical")
    for problem in problems:
        print(problem, file=sys.stderr)
    return bool(problems)


if __name__ == "__main__":
    sys.exit(main())
