# Codex port notes

This directory is a Codex port of Cursor's `pstack` plugin.

## Upstream

- Repository: https://github.com/cursor/plugins/tree/main/pstack
- Commit: `e43c7ee26e0038c6c1fa8380dd34ce86ff94cb2a`
- Upstream version: `0.15.9`
- Retrieved: 2026-10-04
- License: MIT. See [LICENSE](LICENSE).

All 161 upstream files are present at their upstream paths. Of these,
85 are byte-identical and 76 contain Codex compatibility edits.
`CODEX_PORT.md` is the only additional payload file. The manifest, license,
logo, and guide images are copied from the pinned source.

## Update from 0.15.0

The prior source was `71ed0d1076fec562c1b74ee353121a8d00f75382`, retrieved on
2026-09-09. This update applies upstream changes through 0.15.9 to the existing
Codex port, preserving its uncommitted work and the user's model configuration.

- Added `correct`, `benchmark-checklist`, and Explain the Number. The main
  payload has 50 skills, including 24 principles, and 23 Poteto Mode
  playbooks. The dormant Benny pack retains three further skills.
- Added setup's reasoning-budget choices using separate Codex model and effort
  fields. Existing model choices, role labels, aliases, and overrides remain.
- Updated architecture and review guidance to account for mistakes an agent
  contributor can make. Updated performance workflows and schema-first examples.
- Updated fresh-agent routing, measurement evidence, autopilot verification
  rounds, hourly audit cadence, and PR headings. Recurring audits use a Codex
  heartbeat only when the user requests recurrence.
- Updated the decision log to append safely and audit only the current run's
  rows. Codex history access stays limited to authorized task context.

## Codex installation

The discoverable entrypoint is `$HOME/.agents/skills/pstack/`. Its `SKILL.md`
routes to `$HOME/.agents/pstack/`, outside recursive skill discovery. Both paths
can be symlinks to `skills/pstack/` and `pstack/` in agent-skills. Updating that
checkout updates the global Codex installation.

The shim owns the entrypoint, UI metadata, Codex adapter, model routing, and
`scripts/verify_port.py`. The checker compares the complete payload inventory,
the compatibility ledger, the version, and local Markdown links. Run it against
the pstack directory extracted from the pinned upstream commit:

```bash
python3 skills/pstack/scripts/verify_port.py --upstream <extracted-pstack-directory>
```

The port translates invocation syntax, skill paths, model IDs, subagent tools,
shared-filesystem assumptions, task history, persistent loops, automation
registration, and Cursor-only dependencies. Nested Cursor frontmatter remains
inert upstream metadata. The make-bot-ui workflow and Benny pack still require
explicitly connected capabilities and stop when a required tool is unavailable.

The portable helper dependencies and lockfile did not change. Generated
`node_modules/` and bootstrap state are retained during installation.

## Modified upstream files

Every upstream path not listed here is byte-identical to the pinned source.

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
skills/benchmark-checklist/SKILL.md
skills/blast-radius/SKILL.md
skills/correct/SKILL.md
skills/create-verification-skill/SKILL.md
skills/create-verification-skill/references/feature-map-example/README.md
skills/figure-it-out/SKILL.md
skills/how/SKILL.md
skills/interrogate/SKILL.md
skills/maintain-verification-skill/SKILL.md
skills/make-bot-ui/SKILL.md
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

## Verification

Verified on 2026-10-04 before installation:

- Compared the complete upstream inventory and modified-file ledger, checked
  all local Markdown links, and found no merge markers.
- Parsed all 54 skill frontmatters, including the shim and dormant pack, and
  passed Codex's `quick_validate.py` on the discoverable shim.
- Ran `bun test --timeout 15000 orch watch-pr`. All 52 tests and 206 assertions
  passed. Strict TypeScript checking passed.
- Passed Node and Bash syntax checks and exercised both helper CLI help paths.
- Extracted the multi-phase plan template, filled its model placeholder, and
  checked it with `check-plan.mjs`. Also checked rejection of an unfilled model.
- Exercised the log helper with an existing log and an empty file. Prior rows
  remained intact, formula cells were escaped, and tabs and newlines were removed.
- Independently exercised the new benchmark workflow against a measurement
  fixture and reviewed the translated workflows against both upstream versions.

Installation checks the destination against a saved pre-update snapshot before
writing. The installed files and global symlinks are checked against the verified
staging tree after installation.
