# Define: independent critic loop

Use this branch after a coherent first render exists. The critic supplies taste and perspective; the implementer retains responsibility for product correctness.

## Why the context must be fresh

Implementation history creates attachment to sunk cost and prior rationale. A useful critic sees what a user sees: the rendered result. Keep code, effort, earlier iterations, earlier scores, and the implementer's defense out of the critic packet.

Use a visually capable independent agent in a fresh context when delegation is available. A larger or stronger model is often worth using for this sparse executive judgment while a faster capable model performs implementation. If true context isolation is unavailable, state that limitation and perform a screenshot-only pass before reopening code.

## Critic packet

Provide only:

- screenshots at the same relevant viewports and important states on each pass;
- a one-sentence product purpose and named audience;
- the selected direction's feeling, thesis, signature moments, and non-negotiable constraints;
- three to five professional references when they materially clarify the bar, labeled as a moodboard rather than copy targets;
- the rubric below.

Keep the implementer's pass threshold private so the critic does not calibrate toward it.

## Stable critic contract

Use substantially the same prompt on every pass:

```text
Act as an independent design critic. Review only the supplied rendered interface.
Infer the aesthetic it is pursuing, then picture how an excellent product design
studio would execute that same direction. Evaluate both the overall composition
and the fine details. Penalize generic, excessive, incoherent, or obviously
machine-default choices.

Return:
1. A one-sentence verdict.
2. Scores from 0–10 for purpose, composition, identity, craft, interaction clarity,
   and restraint, plus an overall score.
3. The three highest-impact gaps, ranked, each tied to visible evidence.
4. A precise desired outcome for each gap without prescribing code.
5. One element that is distinctive and should survive revision.

Be concise, concrete, bold, and consistent with the supplied product constraints.
Do not reward novelty that weakens usability. Treat references as a quality bar,
not a target to copy.
```

### Score anchors

- **0–3:** broken, incoherent, or dominated by defaults.
- **4–6:** usable and partly coherent, but generic or visibly unfinished.
- **7–8:** distinctive and strong, with a few material gaps.
- **9:** release-level execution of the intended direction.
- **10:** exceptional, unusually resolved work with no meaningful visible gap.

Scores are a directional convergence signal, not a precise measurement across independent critics. Fixed viewport/state coverage, visible evidence, and closure of previously ranked gaps govern the next edit; a small score change by itself proves nothing.

## Iteration protocol

1. Capture new screenshots from the actual implementation.
2. Dispatch a fresh critic with the stable packet and no history.
3. Choose the one to three changes with the largest expected visual or product impact.
4. Implement them without weakening the brief's invariants.
5. Verify function, then capture the same states again.
6. Compare score movement and whether the named gaps actually closed.

Start with two passes. Continue one pass at a time only while feedback is converging and each pass yields material improvement. Stop after four passes unless the user explicitly asks for further iteration.

When the score plateaus, classify the cause:

- **Execution gap:** the brief is still sound; make the critic's outcome more concrete.
- **Identity gap:** no coherent visual thesis is visible; return to Discover.
- **Constraint conflict:** the desired effect violates usability, accessibility, performance, or product requirements; preserve the constraint and surface the tradeoff.
- **Critic instability:** scores or advice vary without visible cause; strengthen the references or observable rubric.

At the four-pass cap, stop even when the score is below 9. Mark the design **unpassed**, preserve the best verified artifact, and hand off the final score, visible blockers, and three choices: accept the bounded prototype, revisit the direction, or authorize another iteration budget. Never describe an unpassed branch as release-level or complete.

**Branch completion criterion:** the overall score is at least 9/10, every high-impact gap is closed or explicitly rejected for a product reason, and the preserved distinctive element remains intact.
