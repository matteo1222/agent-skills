# UI/UX skill-lab proposal

Status: approved and executed. This file preserves the pre-run proposal. See `RESULTS.md` for the frozen development result.

## Source-derived candidates

### `explore-systematize-build`

- Source: Tyler Young, “How I design with AI”
- Knowledge record: `evergreen/references/tyler-young-ai-design-explore-systematize-build-loop-2026-08-26.md`
- Supporting synthesis: `evergreen/notes/good-ui-generation-needs-reference-evidence-craft-rules-and-executable-checks-2026-07-23.md`
- Claimed delta: improves product-interface design work by separating divergent exploration, explicit system formation, and implementation from that system.
- Candidate path: `candidates/explore-systematize-build/SKILL.md`

### `threeui-reference-workflow`

- Source: Meng To’s ThreeUI Community library
- Knowledge record: `evergreen/references/meng-to-threeui-agent-consumable-reference-library-2026-08-21.md`
- Claimed delta: improves React + Three.js UI work by treating a reference as a pinned packet of behavior, source, assets, runtime, license, and transferable qualities.
- Candidate path: `candidates/threeui-reference-workflow/SKILL.md`

Both drafts use the `writing-for-agents` structure: concise scope, staged procedures, explicit completion criteria, and references kept close to the decisions they support.

## Recommended pilot

Use separate blocks because the two new candidates solve different problems.

### Block A: general product-interface design

Treatments:

1. Baseline with no candidate skill
2. `explore-systematize-build`
3. `impeccable`
4. `hallmark`

Three varied frozen cases produce 12 runner executions.

### Block B: Three.js product UI

Treatments:

1. Baseline with no candidate skill
2. `threeui-reference-workflow`

Three varied frozen cases produce 6 runner executions.

Total: 18 runner executions, followed by deterministic checks and blinded pairwise preference judgments.

## Reserves for a second round

- `grilling-frontend-prototyping`: useful when iterative prototype rounds and explicit user verdicts are central.
- `superdesign`: useful as a UI-variation and mockup-oriented comparator.
- `design-critique`: useful for critique-only cases, but its narrower job makes it a poor first-round comparator for end-to-end design work.
- `impeccable` in Block B: add only if the first Three.js round shows value and a generalist comparator is needed.

## Approval boundary

After approval, a fresh isolated context will freeze cases, rubrics, gates, and opaque candidate IDs without reading the candidate bodies. The run matrix will then be shown one final time before runner fanout if it differs from this proposal.
