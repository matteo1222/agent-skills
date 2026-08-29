# Codex port notes

This directory is a fidelity-first Codex port of Cursor's `pstack` plugin.

## Upstream

- Repository: https://github.com/cursor/plugins/tree/main/pstack
- Commit: `799151d91b6e12ee7dbd09f708eec108d7de9b3b`
- Upstream version: `0.14.4`
- Retrieved: 2026-08-27
- License: MIT. See [LICENSE](LICENSE).

All 157 upstream files were copied into this directory. Of those, 83 remain byte-identical and 74 contain narrow Codex compatibility edits. No upstream path was removed or renamed. `LICENSE`, every guide image, and the ignored `.cursor-plugin/plugin.json` manifest remain byte-identical; the manifest is retained as inert provenance.

## Added for Codex

- `$HOME/.agents/skills/pstack/SKILL.md` is the user-global Codex entrypoint and internal subskill router.
- `$HOME/.agents/skills/pstack/agents/openai.yaml` supplies Codex UI metadata and invocation policy.
- `$HOME/.agents/skills/pstack/references/codex-adapter.md` translates Cursor host mechanics to Codex.
- `$HOME/.agents/skills/pstack/references/model-routing.md` defines current Codex model and reasoning-effort routing.
- This ledger records the port boundary.
- `skills/poteto-mode/scripts/node_modules/` and its bootstrap integrity key are generated install artifacts, not upstream source replacements. They were produced from the retained lockfile so the globally installed helpers do not need a first-use network write.

## Compatibility boundary

The payload is installed at `$HOME/.agents/pstack/`, outside Codex's recursive skill-discovery root. This keeps its bundled `SKILL.md` files internal and prevents collisions with separately installed skills such as `tdd` and `teach`.

The port changes only host-specific behavior: invocation syntax, skill paths, model IDs and reasoning fields, subagent orchestration, shared-worktree assumptions, transcript access, persistent loops, automation registration, and Cursor-only tool/plugin dependencies. Pstack's engineering principles, playbook ordering, rubrics, templates, prose standards, and portable scripts remain unchanged.

The `make-bot-ui` workflow and Benny automation pack require capabilities that may not be installed in Codex. Their source is preserved. The adapter requires those workflows to fail closed when their webhook, Slack, routine, or automation dependencies are unavailable.

## Modified upstream files

The following 74 upstream files differ from the pinned commit. Every other upstream file is byte-identical.

```text
README.md
agents/comment-sicko.md
agents/poteto-agent.md
automations/benny/FOR_AGENTS.md
automations/benny/README.md
automations/benny/skills/reproduce-and-fix-issues/SKILL.md
automations/benny/skills/reproduce-and-fix-issues/references/control-adapter.md
automations/benny/skills/reproduce-and-fix-issues/references/feature-map.example.md
automations/benny/skills/setup-benny/SKILL.md
automations/benny/skills/triage-issue-reports/SKILL.md
automations/benny/skills/triage-issue-reports/references/routing.example.md
automations/benny/templates/configuration.example.yaml
automations/benny/templates/reproduce-automation-prompt.md
automations/benny/templates/triage-automation-prompt.md
docs/guide/01-setup.md
docs/guide/02-poteto-mode.md
docs/guide/03-understand.md
docs/guide/04-design.md
docs/guide/05-build-and-clean.md
docs/guide/06-verify-and-ship.md
docs/guide/07-overnight.md
docs/guide/08-principles.md
docs/guide/09-make-it-yours.md
docs/guide/10-recipes-and-pitfalls.md
docs/guide/README.md
skills/architect/SKILL.md
skills/architect/references/runner-prompt.md
skills/arena/SKILL.md
skills/automate-me/SKILL.md
skills/blast-radius/SKILL.md
skills/create-verification-skill/SKILL.md
skills/create-verification-skill/references/feature-map-example/README.md
skills/figure-it-out/SKILL.md
skills/grokbot/make-bot-ui/SKILL.md
skills/how/SKILL.md
skills/interrogate/SKILL.md
skills/maintain-verification-skill/SKILL.md
skills/no-comments/SKILL.md
skills/poteto-mode/SKILL.md
skills/poteto-mode/playbooks/authoring-a-skill.md
skills/poteto-mode/playbooks/autonomous-run.md
skills/poteto-mode/playbooks/autopilot-full.md
skills/poteto-mode/playbooks/autopilot-stack.md
skills/poteto-mode/playbooks/babysit.md
skills/poteto-mode/playbooks/bug-fix.md
skills/poteto-mode/playbooks/eval.md
skills/poteto-mode/playbooks/feature.md
skills/poteto-mode/playbooks/hillclimb.md
skills/poteto-mode/playbooks/multi-phase-plan.md
skills/poteto-mode/playbooks/opening-a-pr.md
skills/poteto-mode/playbooks/orchestrate.md
skills/poteto-mode/playbooks/pause-safely.md
skills/poteto-mode/playbooks/perf-issue.md
skills/poteto-mode/playbooks/refactoring.md
skills/poteto-mode/playbooks/session-pickup.md
skills/poteto-mode/playbooks/shipping.md
skills/poteto-mode/playbooks/visual-parity.md
skills/poteto-mode/playbooks/worktree-cleanup.md
skills/poteto-mode/scripts/bun.lock
skills/poteto-mode/scripts/check-plan.mjs
skills/poteto-mode/scripts/package.json
skills/poteto-mode/scripts/worktree-audit.sh
skills/recall/SKILL.md
skills/reflect/SKILL.md
skills/reflect/references/divergent-reviewer.md
skills/reflect/references/judgment-reviewer.md
skills/reflect/references/synthesizer.md
skills/reflect/references/tooling-reviewer.md
skills/setup-pstack/SKILL.md
skills/show-me-your-work/SKILL.md
skills/swarm/SKILL.md
skills/technical-writing/SKILL.md
skills/why/SKILL.md
skills/why/references/sources/slack.md
```

The edits fall into four host-boundary groups: `$pstack` routing and documentation; Codex plan, subagent, model, history, worktree, and Goal mechanics; fail-closed automation and webhook integration; and the four helper files whose Cursor paths or combined model syntax were executable behavior. Inert nested Cursor frontmatter stays in the payload because that directory is outside Codex skill discovery.

## Verification

The completed port is checked by:

1. Comparing every path against the pinned upstream commit.
2. Reviewing every changed hunk for a Cursor or Codex compatibility reason.
3. Running the Codex skill validator on the root skill.
4. Running the bundled script tests and type check.

The final staged payload passed all 52 Bun tests, strict TypeScript checking, Node and Bash syntax checks, both helper CLI startup paths, the extracted multi-phase-plan validator fixture, the worktree task-activity mapping, and decision-log sanitization. The combined Bun run needed a 15-second per-test timeout on this host after repeated parallel validation caused transient 5-second child-process timeouts; the orch and watch-pr suites also pass separately at their default timeout.
