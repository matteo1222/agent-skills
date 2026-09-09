# Codex port notes

This directory is a Codex port of Cursor's `pstack` plugin.

## Upstream

- Repository: https://github.com/cursor/plugins/tree/main/pstack
- Commit: `71ed0d1076fec562c1b74ee353121a8d00f75382`
- Upstream version: `0.15.0`
- Retrieved: 2026-09-09
- License: MIT. See [LICENSE](LICENSE).

All 158 upstream files are present at their current upstream paths. Of these,
84 are byte-identical and 74 contain Codex compatibility edits. `LICENSE`, the
plugin manifest, the logo, and all six guide images are byte-identical to the
pinned source. `CODEX_PORT.md` is an additional port-owned file.

## Update from 0.14.4

The prior source was `799151d91b6e12ee7dbd09f708eec108d7de9b3b`, retrieved on
2026-08-27. This update incorporates the eight subsequent pstack commits through
0.15.0 while preserving the Codex adapter and existing model preferences.

- Added the Attack the Premise and Test Behavior, Not Implementation principles.
  The main payload now contains 47 skills, including 23 principles, with 23
  Poteto Mode playbooks. The dormant Benny pack contains three further skills.
- Updated the workflow and prose guidance, including the simpler `how` flow and
  explicit invocation of `reflect`. Removed the two retired `how` critique
  references and the obsolete `how critics` role from setup defaults.
- Moved `skills/grokbot/make-bot-ui/SKILL.md` to
  `skills/make-bot-ui/SKILL.md` and updated the shim and guide links. The Codex
  connector capability gate remains in place.
- Updated the PR, Babysit, Shipping, and Autopilot playbooks to use GitHub by
  default or Origin when available. Preserved the GitHub-only watcher. The
  separate Orchestrate frontier helper still uses Graphite, as upstream does.
- Added the upstream logo and restored the six upstream guide images that were
  missing from the previous repository payload.
- Preserved the current Codex model defaults and the user's
  `~/.codex/pstack-models.md`. A legacy `how critics` override is inert because
  the upstream critique phase no longer exists.

## Codex installation

The single discoverable entrypoint is `$HOME/.agents/skills/pstack/`. Its
`SKILL.md` routes to the payload at `$HOME/.agents/pstack/`, outside recursive
skill discovery. Both paths can be symlinks to the `skills/pstack/` and
`pstack/` directories in agent-skills. Updating that checkout then updates the
global Codex installation without a second copy.

The shim owns:

- `SKILL.md`, the entrypoint and internal workflow router.
- `agents/openai.yaml`, the Codex UI metadata and invocation policy.
- `references/codex-adapter.md`, the Cursor-to-Codex host translations.
- `references/model-routing.md`, separate model and reasoning-effort routing.

The port translates invocation syntax, skill paths, model IDs, subagent
orchestration, shared-worktree assumptions, task history, persistent loops,
automation registration, and Cursor-only dependencies. Host-specific paragraphs
retain the Codex implementation of those boundaries. Upstream nested Cursor
frontmatter remains inert metadata in the payload.

The make-bot-ui workflow and Benny pack require explicitly connected webhook,
Slack, automation, and other capabilities. Their instructions must use the live
Codex tool schemas and stop when a required capability is unavailable.

The retained portable helper source and lockfile did not change in this update.
Existing `skills/poteto-mode/scripts/node_modules/` and its bootstrap key remain
generated installation artifacts and are not replaced during the update.

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
skills/blast-radius/SKILL.md
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

Verified on 2026-09-09 before installation:

- Compared the complete file inventory with the pinned upstream archive and
  checked the upstream removals, relocated router target, manifest, license,
  images, new principle files, and absence of merge markers.
- Parsed all 51 `SKILL.md` frontmatters, including the shim and dormant pack,
  and passed Codex's `quick_validate.py` on the discoverable shim.
- Checked local Markdown links with no new missing targets. The existing
  `[Title](url)` citation placeholder in the Why template remains a template.
- Ran `bun test --timeout 15000 orch watch-pr`: 52 tests passed, 206 assertions.
- Ran `bun run typecheck`: strict TypeScript checking passed.
- Passed Node and Bash syntax checks and both helper CLI help paths.
- Extracted the updated multi-phase plan template and ran `check-plan.mjs`:
  one PR section, 27 boxes, zero problems.

The staged source was installed only after checking that the destination still
matched the captured pre-update files. Global entrypoint and payload symlinks
were verified against the updated repository after installation.
