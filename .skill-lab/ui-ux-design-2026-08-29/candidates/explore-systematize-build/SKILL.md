---
name: explore-systematize-build
description: Guide AI-assisted product-interface design through divergent working options, reusable design rules, and implementation from an explicit system. Use for new or established product UI with unresolved design decisions; not for isolated polish or critique.
---

# Explore, Systematize, Build

Treat generated interfaces as evidence about a design question, not as design authority. Move through `explore → systematize → build`, then loop when real use produces new evidence. Keep three forms of context distinct throughout: product-specific reference evidence, reusable craft rules, and executable checks.

## 1. Define the inquiry

Name:

- the user and intended outcome;
- required behavior and content;
- constraints, permissions, failure paths, and accessibility needs;
- the decision this exploration must resolve; and
- what would make a result wrong.

For an established product, inspect what its current design system already claims. Separate rules that still hold from drift, contradictions, and unanswered questions.

This step is complete when the inquiry can reject an attractive but wrong option.

## 2. Explore with working options

Create a small set of genuinely different working options. Vary structure, interaction, hierarchy, or system assumptions—not merely color and decoration.

Use realistic content and include the non-default states needed to expose hidden decisions. Let stakeholders or the user interact with the options when possible. Record findings as evidence tied to the inquiry:

```text
option → observed behavior → finding → decision or open question
```

Volume is not the goal. Stop when the options expose the material tradeoffs and another variant has low expected information value.

This step is complete when every retained finding points to an observed option or state and the chosen direction has explicit rejected alternatives.

## 3. Turn findings into a system

Convert settled findings into reusable constraints at the smallest owning level:

- product or interaction principles;
- behaviors and state transitions;
- content patterns;
- accessibility requirements;
- tokens;
- components and documented states; and
- executable checks where a rule can be tested mechanically.

For an established system, prefer repairing or removing contradictory rules over adding another local exception. Tokens and components encode decisions; they do not replace the decision trail.

This step is complete when each adopted finding has one authoritative owner and future screens can reuse it without rediscovering the choice.

## 4. Build from the system

Implement against the resolved inquiry and system. Reuse an existing pattern where one governs the case. When no rule applies, surface the gap as a design question instead of silently inventing a screen-local answer.

Exercise real content, permissions, loading, empty, error, success, and recovery states relevant to the task. Verify behavior, accessibility, responsiveness, and production constraints with the project's normal tools.

This step is complete when the implementation consumes the named system revision, passes its observable checks, and leaves unresolved judgment visible.

## 5. Return the result to people

Review the built result against the original inquiry:

- Does the behavior support the intended outcome?
- Do states, permissions, and failure paths make sense?
- Does the work strengthen or contradict product patterns?
- Does the content explain what happened and what comes next?
- Can people perceive and operate it in realistic conditions?
- Is it credible in the production environment?

Passing instructions and checks does not decide what should ship. Record the owner's acceptance, rejection, or next question. Feed new evidence into another exploration only when it changes a material decision.

## Source

Adapted from Tyler Young's [How I design with AI](https://www.tyleryoung.design/how-i-design-with-ai/), the source note `tyler-young-ai-design-explore-systematize-build-loop-2026-08-26.md`, and the knowledge synthesis `good-ui-generation-needs-reference-evidence-craft-rules-and-executable-checks-2026-07-23.md`.
