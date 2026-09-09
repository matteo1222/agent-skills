---
name: pstack
description: Run pstack's rigorous engineering playbooks in Codex. Use when the user says pstack, poteto mode, asks to configure pstack, names a bundled pstack workflow such as how, why, architect, arena, swarm, interrogate, reflect, or requests pstack's engineering style. Do not apply to casual or trivial work unless explicitly invoked.
metadata:
  short-description: Rigorous pstack engineering workflows for Codex
---

# pstack

This is the Codex adapter for Lauren Tan's pstack Cursor plugin. Preserve pstack's workflow, prose, principles, and verification standards. Translate only the host-specific mechanics.

## Start

1. Read [references/codex-adapter.md](references/codex-adapter.md) in full. Its compatibility rules override conflicting Cursor mechanics in bundled files.
2. Route the request to a bundled skill.
   - An explicit selector is only the first argument immediately after `$pstack`. Match that token to a bundled skill name; do not scan later prose for a selector.
   - With no recognized explicit selector, use [Poteto Mode](../../pstack/skills/poteto-mode/SKILL.md).
   - For `setup` or model configuration, use [Setup pstack](../../pstack/skills/setup-pstack/SKILL.md).
   - For a named workflow, read that workflow's `../../pstack/skills/<name>/SKILL.md` in full.
3. When Poteto Mode applies, read its `SKILL.md`, the matched playbook, and every principle leaf it actually applies. Do not load unrelated playbooks or references.
4. Follow the chosen bundled instructions with the Codex translations from the adapter. System, developer, user, permission, and repository instructions always take precedence.

## Bundled skill references

Bundled `SKILL.md` files live in the non-discovered payload at `../../pstack/`. They are internal resources, not separately installed global skills. A slash reference such as `/how` means read and follow `../../pstack/skills/how/SKILL.md`; it does not mean invoke an unrelated global skill with the same name. `$pstack how ...` is the direct Codex form.

## Delegation

When a bundled workflow delegates, read [references/model-routing.md](references/model-routing.md). Use the current session's subagent tools and available concurrency. Isolate parallel writers in explicit worktrees or output directories because Codex subagents share the filesystem.

## Fidelity

Do not redesign pstack while using it. Treat [CODEX_PORT.md](../../pstack/CODEX_PORT.md) as the compatibility ledger and [README.md](../../pstack/README.md) as the user guide.
