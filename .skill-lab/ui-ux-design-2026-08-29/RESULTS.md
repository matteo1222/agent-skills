# UI and UX skill-lab development results

Date: 2026-08-29

Status: development cases complete. Human votes were frozen before identity reveal. The unseen holdouts were not run.

## Decision

Advance `impeccable` as the strongest general UI skill and `threeui-reference-workflow` as the strongest Three.js specialist. Do not promote either result as production proof yet. The experiment covered three development cases per block, not the sealed holdouts.

Keep `explore-systematize-build` as a revision candidate. It was efficient and excellent on the tax workflow, but it lost two of three human comparisons against the baseline and made a material brief-fidelity error in the scheduling case.

Do not advance `hallmark` as the default general UI skill from this round. Its human result was mixed, the blind judge ranked it last in aggregate, and it used 6.25 times the baseline input tokens.

Before an unseen Three.js holdout, fix the activation path for `threeui-reference-workflow`. The runner did not read the assigned skill in B1. Also make real loading behavior explicit. The B2 treatment labeled a state as loading without implementing a true loading transition.

No candidate files changed after the run.

## Identity reveal

| Hidden identity | Revealed condition |
| --- | --- |
| `variant-quartz` | General UI baseline |
| `variant-linden` | `explore-systematize-build` |
| `variant-ember` | `impeccable` |
| `variant-cobalt` | `hallmark` |
| `variant-sable` | Three.js baseline |
| `variant-ivory` | `threeui-reference-workflow` |

## Human preference

The human comparison was single blind. Left and right positions changed across pairs. A win counts as 1 point and a tie counts as 0.5 points.

### General UI block

| Treatment against baseline | A1 scheduling | A2 approvals | A3 tax workflow | Points |
| --- | ---: | ---: | ---: | ---: |
| `explore-systematize-build` | Loss | Loss | Win | 1.0 of 3 |
| `impeccable` | Tie | Tie | Win | 2.0 of 3 |
| `hallmark` | Loss | Tie | Win | 1.5 of 3 |

The A1 note said that both outputs were close, but the baseline looked cleaner and the `explore-systematize-build` output had spacing or gap problems.

### Three.js block

| Treatment against baseline | B1 lamp | B2 fleet | B3 repair | Points |
| --- | ---: | ---: | ---: | ---: |
| `threeui-reference-workflow` | Loss | Win | Win | 2.0 of 3 |

## Single blind judge

The judge saw sanitized variants, the case briefs, runnable outputs, desktop and mobile captures, and runtime evidence. The judge did not see skill names, baseline labels, human votes, or cost data. It scored five 10-point criteria covering hierarchy and task clarity, visual quality, state and semantic coverage, interaction quality, and production readiness.

### General UI scores

| Condition | A1 | A2 | A3 | Total |
| --- | ---: | ---: | ---: | ---: |
| `impeccable` | 44 | 45 | 46 | 135 |
| `explore-systematize-build` | 38 | 44 | 49 | 131 |
| Baseline | 37 | 46 | 47 | 130 |
| `hallmark` | 43 | 41 | 42 | 126 |

Judge confidence was 0.94. The judge applied no disqualifications.

The judge found `impeccable` strongest overall. It handled conflicts and recovery well in A1, added deep state coverage in A2, and stayed direct in A3. `explore-systematize-build` produced the best A3 workflow, including focus containment, file validation, explicit failure, preserved selection, and progress updates. Its A1 output weakened the requested scenario by exposing a conflict on the wrong room and time. The baseline was strongest in A2. `hallmark` was calm and polished, but slow initial disclosure hurt task discovery in A2 and A3.

### Three.js scores

| Condition | B1 | B2 | B3 | Total |
| --- | ---: | ---: | ---: | ---: |
| `threeui-reference-workflow` | 45 | 43 | 49 | 137 |
| Baseline | 41 | 32 | 24 | 97 |

Judge confidence was 0.99. The judge applied no disqualifications.

The treatment made the 3D object easier to recognize in B1, fixed the core desktop composition in B2, and made the 3D repair model useful in B3. The baseline had a severe B2 layout bug. Its B3 fallback styling also left the viewer obstructed. The human preferred the B1 baseline, but the human and judge agreed on B2 and B3.

## Reconciliation

The human vote and the judge answer different parts of the design question. The human appears to give more weight to cleanliness, spacing, and immediate visual confidence. The judge gives more weight to brief fidelity, state depth, and interaction behavior. This is an inference from the disagreements, not a measured preference model.

That difference matters most in A1. The human preferred or tied the baseline in all three A1 comparisons, while the judge ranked the baseline last. A skill should not win by adding state depth while making the first view feel less clean. The next revision needs both.

The baseline remained competitive. It won A2 for the judge, won or tied most A1 human comparisons, and won the B1 human comparison. These skills are not universal improvements.

## Cost evidence

Ratios compare average tokens per run with the matching block baseline. Cached and uncached input tokens are both included in the input ratio.

| Condition | Average input | Input ratio | Average output | Output ratio | Skill activation |
| --- | ---: | ---: | ---: | ---: | ---: |
| General UI baseline | 1,815,016 | 1.00 | 39,779 | 1.00 | Not applicable |
| `explore-systematize-build` | 1,302,355 | 0.72 | 41,448 | 1.04 | 3 of 3 |
| `impeccable` | 5,649,855 | 3.11 | 53,986 | 1.36 | 3 of 3 |
| `hallmark` | 11,337,397 | 6.25 | 76,905 | 1.93 | 3 of 3 |
| Three.js baseline | 1,548,444 | 1.00 | 42,916 | 1.00 | Not applicable |
| `threeui-reference-workflow` | 2,225,501 | 1.44 | 44,132 | 1.03 | 2 of 3 |

The experiment did not instrument exact wall time. Token use is the available cost measure.

`explore-systematize-build` is unusually cheap for its judge result. `impeccable` buys a modest quality lead at a large input cost. `hallmark` does not justify its cost here. `threeui-reference-workflow` has a reasonable specialist premium.

## Controls and audit

- All 18 runners used `gpt-5.6-luna` with maximum reasoning effort.
- All runners received the same organic instruction. They read `brief.md`, built the requested page, completed the requested states and interactions, and verified the result locally.
- Runner directories, labels, paths, and prompts omitted evaluation terms and candidate identities.
- Each runner used a separate no-history profile and a sanitized project directory.
- All 18 runners exited successfully and produced a runnable result.
- The harness did not retry a runner.
- No runner referenced a sibling project.
- No runner attempted `curl`, `wget`, `git clone`, `npm install`, `pnpm add`, or another external dependency fetch.
- Every copied treatment skill matched its frozen source after the run.
- Eleven of 12 treatment runners read the assigned skill. B1 was the exception.
- All outputs passed the local resource, runtime error, 390-pixel overflow, keyboard focus, and reduced-motion gates.
- All six Three.js outputs rendered a real WebGL canvas from the same pinned Three.js bundle and license file.
- All six Three.js outputs removed the canvas after cleanup, remounted one canvas, and removed it again without an error.
- All six Three.js outputs kept useful controls and fallback content when WebGL was disabled.
- The single judge remained blind until it returned a sealed verdict.
- Human votes were frozen at `2026-08-29T06:41:39.957Z` before identity reveal.

## Limits

This round has three development cases per block and one human voter. The judge is one model, not an independent panel. Token counts include cache behavior and do not measure elapsed time. B1 cannot establish a causal treatment effect because the runner did not read the assigned Three.js skill. The unseen A4 and B4 holdouts remain sealed and unrun.

## Recommended next step

Do not run the holdouts until the owner asks for synthesis. If synthesis is approved, revise only from the development evidence. Keep the cases, controls, rubric, and holdouts fixed. Then run each unseen holdout once.

The best next-round set is:

1. `impeccable` against the general UI baseline.
2. A revised `explore-systematize-build` only if its brief-fidelity and spacing problems receive targeted changes.
3. A trigger-fixed `threeui-reference-workflow` against the Three.js baseline.

Retire `hallmark` from the default general UI comparison unless a narrower visual-taste use case justifies a separate evaluation.
