---
name: harness-engineering
description: Apply Ryan Lopopolo's harness-engineering corpus to improve agent environments, repository context, tool legibility, authority, proof, feedback loops, and continuous maintenance. Use when assessing or improving how coding agents work in a repository.
---

# Harness Engineering

Use the vendored upstream repository in `repo/` as the source of truth. This
skill is only a Codex entry point for that corpus.

## Required Routing

1. Read `repo/AGENTS.md` first.
2. Follow its application routing before reading any other file.
3. For learning or teaching harness engineering, read `repo/README.md` and
   `repo/docs/README.md`.
4. For improving one observed agent job, read
   `repo/playbooks/improve-harness.md`.
5. For broad repository assessment, read
   `repo/playbooks/repository-review.md`.
6. For comparative, causal, or longitudinal evaluation, read
   `repo/evals/README.md`.

## Working Rule

Treat `repo/` as read-only reference material unless the user explicitly asks to
update this vendored copy. Let the target repository's own instructions,
contracts, tools, and authority govern the final implementation.
