---
name: ai-design-director
description: Orchestrate bold AI-generated interface design through seeded divergence, a locked visual identity, fresh-context screenshot critics, and final subtraction. Use when the user asks to escape generic AI design, explore ambitious directions, or run an agent-led design-director loop for a web or mobile experience; skip routine UI fixes and ordinary critique.
---

# AI Design Director

Create taste through a controlled process: **Discover** beyond the model's defaults, **Define** one coherent identity, then **Deliver** by subtracting noise and proving the rendered result. The stages widen and narrow on purpose. Keep divergent ideas separate until a direction is selected.

This skill directs the design process. Follow the target project's implementation instructions for frameworks, components, testing, and release.

## Preserve the product contract

- Treat the product's purpose, user tasks, real content, brand system, accessibility needs, and technical constraints as design inputs rather than obstacles.
- Preserve existing information architecture, behavior, design tokens, and component ownership unless the task authorizes changing them.
- Use references as a quality bar and moodboard, never as a pixel-copy target.
- Treat deployment, publishing, paid generation, licensed assets, and account changes as separate actions requiring scope or approval.
- Read secrets from an approved local environment. Keep keys out of prompts, source, logs, screenshots, and generated assets.

## Route the request

Choose the smallest route that reaches the requested outcome:

| Request | Route |
| --- | --- |
| Explore concepts or propose a visual direction | Frame → Discover |
| Create or substantially redesign an experience | Frame → Discover → Define → Deliver |
| Rescue a generic but functional design | Frame → Define; return to Discover when no distinct identity can be stated |
| Polish or prepare an established design for release | Frame → Deliver |
| Critique only | Frame → Deliver as a read-only audit |

When the user asks for edits, continue through implementation and verification. A critique request authorizes findings, not code changes.

## Frame

Inspect the product and the rendered experience before choosing an aesthetic. Gather:

- the audience, primary job, desired feeling, and success condition;
- required content, flows, states, viewports, and platforms;
- the expected integration depth for consequential actions such as signup, purchase, sync, or sharing—concept, local prototype, sandbox, or live service;
- existing brand assets, tokens, typography, components, and interaction conventions;
- implementation, accessibility, performance, schedule, and asset constraints;
- baseline screenshots for an existing interface, including the states that matter.

Classify product statements as **supplied fact**, **verified behavior**, or **proposed requirement**. Present-tense claims may come only from the first two. Label local or simulated actions honestly; they cannot imply that an external outcome occurred.

If a missing choice would materially change the product, ask one precise question. Otherwise, state a reversible hypothesis and proceed. Use real supplied content or explicit placeholders; never invent proof, customers, testimonials, metrics, compliance, or unimplemented product guarantees.

**Completion criterion:** the evidence explains what the design must accomplish, what it must preserve, and how a deliberate choice can be distinguished from decorative novelty.

## Discover

Read [references/discover.md](references/discover.md) and explore broadly before writing production UI.

Inject entropy with a non-sensitive working seed, combine it with product evidence and the user's taste, and create structurally distinct directions. Favor risky but coherent propositions over familiar layouts with different colors. Visualize the strongest candidates cheaply enough to compare them.

If the user has not selected a direction and the choice would cause a costly rewrite, present the shortlist first. When the task grants autonomous execution, choose using the reference's scorecard and record the rationale.

**Completion criterion:** one direction is captured as a buildable brief that locks the intended feeling, layout grammar, type, color, material, motion, signature moments, explicit exclusions, and principal technical risk.

## Define

Turn the selected brief into a coherent system, not a decorated hero. Reuse its relationships across navigation, content hierarchy, components, interaction states, imagery, and transitions. Build with real product content and make the primary task work before adding spectacle.

Judge the render rather than the implementation story. For a substantial visual build, read [references/critic-loop.md](references/critic-loop.md) and run a fresh-context screenshot critique when independent agent or context isolation is available. Give the critic the brief, references, and rendered states—but no code, implementation rationale, prior critique, or pass threshold. Use the same critic contract on each pass.

When bespoke imagery, 3D, shaders, or video could carry the identity, read [references/generated-media.md](references/generated-media.md). Add generated media only when it has a named job that simpler implementation cannot perform as well.

**Completion criterion:** the interface has a recognizable identity across the whole flow, the primary interaction is functional, and the critic loop's branch criterion is met. When independent critique is unavailable, disclose that limitation and close every high-impact gap found in a screenshot-only pass. When the bounded loop stops below its threshold, use the reference's incomplete-handoff route rather than declaring this stage complete.

## Deliver

Read [references/deliver.md](references/deliver.md). Run the subtraction pass before adding final flourishes. Every visible element must earn its place through user value, orientation, trust, decision support, or the chosen identity.

Verify the actual experience at the required viewports and states. Test interaction, keyboard use, focus, contrast, reduced motion, content stress, loading and error behavior, asset failure, console output, and media performance in proportion to the scope. Re-capture screenshots after material fixes.

For a read-only critique, return a ranked punch list with evidence and suggested outcomes. For an implementation task, fix in-scope failures and report any remaining tradeoff.

**Completion criterion:** the requested flow works, the final screenshots retain the selected identity without gratuitous detail, no release-blocking functional or accessibility issue remains, and the verification evidence is named in the handoff.

## Handoff

Lead with the result. Name the chosen direction and its signature idea, link the changed artifacts, summarize the proof run, and disclose remaining risks or paid/external work that was not authorized. Keep the raw seed, discarded brainstorm, and internal critic transcript out of the final answer unless the user asks for them.

## Provenance

This workflow operationalizes Anshu Chimala's Discover → Define → Deliver method in [“How to turn your AI into a world-class designer”](https://www.lennysnewsletter.com/p/how-to-turn-your-ai-into-a-world) and its seed-diversity mechanism from Sakana AI's [String Seed of Thought](https://pub.sakana.ai/ssot/). The skill is self-contained; the links are provenance, not required runtime context.
