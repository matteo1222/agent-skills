# Drift tracking

Reference for step 5 of [`SKILL.md`](SKILL.md), and the whole job when editing code that carries `learn:` markers. Goal: a code change never blocks on the guide, and the guide never goes stale silently.

## Pieces

1. **References** - every `data-src`, `data-code` and `data-val` on a slide names `path#name`. One pure module (shared by the browser engine and the CLI tool) parses references and extracts a definition's text: the definition plus the comment lines right above it, skipping marker lines. An ambiguous name (defined twice in a file) is an error, not a guess.
2. **Fingerprints** - a short hash of each referenced definition's text, kept in a stamps file (`learn/stamps.json`), together with the slides noted as outdated and the commit they were deferred on.
3. **Markers** - above every referenced definition, a comment naming the slides that explain it, written by the tool only:
   ```js
   // learn: combat.html#arc-code #hit-test (see learn/README.md)
   export function inSwordArc(p, enemy) {
   ```
   An agent (or human) editing the function sees immediately that a guide depends on it.
4. **The check** - a CLI (`npm run learn`) that recomputes fingerprints and lists the slides whose code changed, plus slides previously noted as outdated. Run it from the test command so a changed definition fails the suite.

## The maintenance loop

After finishing the code change (code first, guide second):

1. Run the check. It names the slides explaining changed code.
2. Read those slides (in every language) and fix prose that no longer matches. Live code and live values update themselves; the words around them do not.
3. `--stamp` accepts the current code, rewrites markers and the written fallbacks of live values. `--stamp room.html#slide` when you reviewed only some slides; other slides on the same code are then noted as outdated.
4. Or `--defer` (optionally per slide): accept the code but note the slides as outdated with the commit, so `git diff <commit>` shows what changed. The guide shows a "may be out of date" note on them; the check keeps listing them without failing until a `--stamp` of that slide clears it.

Small word fixes ride in the same change as the code; a bigger rewrite can be deferred and caught up later on its own.

Never edit markers or the stamps file by hand; the tool owns them.

## Tests that keep the guide honest

- Every reference resolves to exactly one definition; fingerprints and markers are current.
- Every name a demo imports from the project is still exported.
- Links, anchors, images and demo modules exist; every text block has its translation partner.
- Written fallbacks of live values match the code.

## The agent rule

Put the loop in the project's always-loaded agent instructions in one line (see `SKILL.md` step 5). The marker in the code is the context pointer at the moment of editing; the instruction line tells the agent what the marker means.
