---
name: show-me-recursive
description: Explain a topic visually with recursive drill-downs into important or difficult parts.
disable-model-invocation: true
---

# Show Me Recursively

Read [show-me](../show-me/SKILL.md) for visual selection and concise presentation.
Apply its smallest-useful-view principle at every level of the explanation.

## 1. Map the question

Resolve the topic from the user's request and conversation. Name what the reader
should be able to understand or predict, using their demonstrated familiarity
to choose the starting level. Inspect the relevant source material and follow
dependencies where they determine the answer.

Map the parts needed to answer the whole question: each part's source, role,
and explanation destination. Choose a depth for each:

- **Drill down:** the part is consequential or its mechanism is difficult to
  infer from the overview. Look for subtle conditions, hidden state, ordering,
  concurrency, failure paths, ownership boundaries, interactions across
  components, and assumptions or tradeoffs that determine the result. A single
  condition or arrow can deserve its own explanation.
- **Brief:** a concise visual and its annotation explain the part directly.
- **Unresolved:** evidence is missing. Identify the missing source and the
  conclusion that depends on it.

For a diff, account for every changed file and substantive hunk within the
requested scope, fetching large diffs in batches. For other topics, follow the
question's scope and dependencies. Group verified mechanical changes or repeated
structures by their common cause while retaining coverage of their members.

Finish when every relevant part has a disposition and every drill-down has a
reason. Keep unresolved gaps explicit throughout the explanation.

## 2. Show each part recursively

A **node** answers one coherent question about the topic. Start with the smallest
visual that answers the overall question, then apply this pattern at each node:

- State the node's answer and why it matters to its parent in a short caption.
  Supply local background only where the reader needs it to interpret the visual.
- Choose the visual form from Show Me that makes this node's mechanism clearest.
  A parent may show component interactions while a child shows a condition as
  pseudocode. Preserve names, state labels, and visual meaning across levels so
  the connection is easy to follow.
- Show a concrete example or trace. Connect input or starting state through the
  relevant steps to the result; for structural topics, show an actual instance
  and how responsibility or ownership is divided. Explain the important
  conditions, boundaries, or edge cases beside the visual they qualify.
- Ground the view in the source. Label code excerpts with file, symbol, and
  revision/line location when available. Distinguish actual code from pseudocode,
  examples from observed data, and source-backed rationale from interpretation.
  When source details determine the answer, include the actual condition or
  block and trace the example through it. Show before/after shapes when the
  question concerns a change.
- Inspect each important mechanism that the current view leaves opaque and
  give it a child node answering that smaller question. Connect it to the exact
  step, arrow, component, or condition it explains in the parent.

Each child must add a distinct explanation. Recurse until a leaf's visual and
annotations let the reader trace the mechanism or locate the responsibility,
predict the relevant outcome, and explain why its critical conditions matter.
Use this criterion without a fixed depth cap. Stop following dependencies when
their stated contracts suffice to answer the local question. Explain shared
mechanisms once and link back to them, including cycles.

Finish when all drill-down candidates have nodes and each leaf meets the
criterion or names a specific evidence gap. Preserve the map and tree across
context windows so unfinished branches remain visible.

## 3. Present the tree

When the root already meets the leaf criterion, deliver the smallest inline
visual that answers the question. When there are drill-downs, read and apply
[the shared recursive HTML reference](../../docs/recursive-explanation-html.md).
Render the tree as one self-contained HTML file with the overview visible and
deeper views expandable. Match the product's visual language when applicable.
Render diagrams as actual visuals in the file, using inline SVG, browser-native
elements, or a bundled renderer that works offline.

Place each short explanation beside its visual. Keep the main reading path
focused on the user's question, with deeper background and mechanisms inside
their nodes. Save HTML outside the source repository with a dated filename such
as `/tmp/YYYY-MM-DD-show-me-recursive-<topic>.html`.

Finish when the collapsed view answers the overall question and every deeper
node reveals its completed visual explanation in context.

## 4. Verify and deliver

Reconcile the result with the scope map. Check that important small details and
interactions have the promised depth, each child answers its parent's open
question, and every trace agrees with the inspected source. Check that visual
labels and connections remain consistent across levels.

For HTML, run the interaction checks in the shared reference, then open the
saved file for the user with the available preview tool and return its link.
For an inline result, show the visual directly. State any coverage or verification
gaps briefly. Completion requires accounted-for scope and satisfied leaf
criteria, plus verified disclosure behavior for HTML; qualify checks that could
only be performed statically.
