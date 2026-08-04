---
name: extract-skills
description: "Extract a reusable skill graph from user-supplied raw material such as articles, transcripts, notes, playbooks, or pasted text. Use when the user wants to mine one or more workflow, methodology, or capability skills from source material and review the proposed decomposition before any skill files are created."
---

# Extract Skills

Turn raw material into the smallest valuable set of reusable skills. Separate
analysis from creation: propose the skill graph first, then build only the
skills the user explicitly approves.

## 1. Bind the source and destination

Read the complete supplied material. Inspect any applicable `AGENTS.md`, the
existing skill layout, naming conventions, and repository visibility. Treat
pasted material as input rather than repository content unless the user asks
to preserve it.

Route publishable reusable skills to `matteo1222/agent-skills` and private or
proprietary skills to `matteo1222/agent-skills-private`. When sensitivity is
uncertain, propose the private destination. Default new skills to
`skills/<skill-name>/` inside the selected repository unless the user names a
different destination.

Distinguish source claims from your inferences. Record missing, corrupted, or
inaccessible portions instead of filling them in.

Complete this step when the full source, visibility decision, target
repository, output root, and material gaps are explicit.

## 2. Mine candidate jobs

Extract reusable outcomes, sequences, decision rules, tactics, and tool gaps.
Classify each candidate by the job it owns:

- **Workflow**: an end-to-end sequence that reaches an outcome and may
  orchestrate other skills. Examples include running a marketing process or
  finding and validating product ideas.
- **Methodology**: a bounded tactic or decision method that is useful on its
  own. Examples include mining Reddit discussions for unmet needs or ranking
  ideas by evidence quality.
- **Capability**: an operational bridge to a source or action the agent cannot
  perform reliably with native abilities. Examples include searching YouTube,
  retrieving transcripts, or calling a specialized API. It owns the tool
  contract, authentication boundary, failure handling, and normalized output.

Treat the types as layers, not quotas. A source may yield one skill, several
skills of one type, a dependency stack across all three types, or no worthwhile
skill.

Complete this step when every reusable job has one candidate type and every
candidate is grounded in specific source material.

## 3. Draw the skill boundaries

Keep a candidate only when it:

- recurs beyond the supplied source or example;
- changes agent behavior compared with the default;
- has a distinct trigger or independently requested job;
- has enough evidence to specify without invention; and
- can end on a checkable completion criterion.

Split candidates when they have independent triggers, different tool or
authority boundaries, reusable lower-level behavior, or a sequence boundary
that protects a difficult step from premature completion. Prefer a dependency
graph of `workflow → methodology → capability` when higher-level skills can
delegate cleanly.

Merge candidates when they are merely steps, examples, or variants of one job.
Keep observations, motivation, unsupported claims, and one-off advice as
reference or leave them unextracted. Keep dependencies acyclic.

Create a coverage ledger that maps every valuable transferable element to one
candidate or to an explicit `reference-only` or `not-a-skill` decision.

Complete this step when each meaning has one owner, the graph has no cycles,
and the coverage ledger accounts for the valuable material.

## 4. Propose before writing

Present an approval-ready proposal with:

1. a one-paragraph source thesis;
2. a table containing candidate name, type, trigger and job, source evidence,
   dependencies, and why it deserves a separate skill;
3. the planned invocation mode, files or resources, destination, and validation
   proof for each candidate;
4. rejected or reference-only material with reasons; and
5. an explicit approval prompt that lets the user approve all, approve a
   subset, merge or split candidates, rename them, or cancel.

Stop after the proposal. Treat feedback as a proposal revision. Create no skill
directories, files, scripts, registries, or commits until the user explicitly
approves the final set.

Complete this step only when the user has approved an exact candidate set.

## 5. Build the approved skills

Before drafting, read `writing-great-skills` in full and follow every context
pointer it requires for the approved branches. Prefer
`skills/writing-great-skills/SKILL.md` in the current repository. If it is not
present, resolve the checkout whose Git remote is
`matteo1222/agent-skills` and read the skill there. If neither source is
available, pause and ask the user to make the quality reference available.

For each approved candidate:

1. Use the available skill-creation tooling to initialize the package with a
   verb-led kebab-case name and matching UI metadata.
2. Write the skill around predictability, a clear information hierarchy, and
   checkable completion criteria.
3. Keep shared behavior in one owner and point dependent skills to it rather
   than duplicating its instructions.
4. Use scripts only for repeated deterministic work. For capability skills,
   specify and test the tool contract, authentication boundary, failure modes,
   and output shape.
5. Paraphrase source material and retain attribution when provenance affects
   trust or reuse. Carry no unsupported claim into an instruction.

Complete this step when every approved package exists, all dependencies
resolve, and no unapproved package or behavior was created.

## 6. Prove the extraction

Run the skill validator on every created package. Execute representative tests
for every added script and inspect each skill's UI metadata and final diff.
Forward-test complex workflow or capability skills with realistic raw material
when the environment permits independent validation.

Report the created skill graph, validation evidence, source coverage, and any
residual uncertainty. Keep publishing, installing globally, committing, and
pushing as separate actions governed by the user's scope.

Complete the run when every approved skill passes its relevant checks, every
valuable source element remains accounted for, and the repository contains
only the approved changes.
