---
name: explain-diff-html-recursive
description: Explain a diff in interactive HTML with recursive drill-downs into important or difficult code.
disable-model-invocation: true
---

# Explain Diff HTML Recursively

Read [explain-diff-html](../explain-diff-html/SKILL.md) for the shared content,
output, and diagram rules. Use its high-level treatment for the overview; the
workflow below extends the code walkthrough with recursive explanations.

## 1. Map the full change

Resolve the requested diff and record its base and target revisions, or the
working-tree scope. Inventory every changed file, including additions,
deletions, and renames. Read every substantive hunk, fetching large diffs in
file or hunk batches until the inventory is covered. Inspect surrounding code,
callers, callees, and tests wherever behavior depends on them.

Maintain a working coverage map: file and hunk/symbol, behavior changed,
explanation destination, and reason for the chosen depth. Classify each chunk:

- **Drill down:** consequential behavior or code whose mechanism needs unpacking.
  Look for subtle conditions, algorithms, state transitions, ordering,
  concurrency, failure handling, security boundaries, data integrity,
  compatibility, performance, and contracts spanning files. A one-line change
  can qualify; line count and file prominence do not determine depth.
- **Brief:** straightforward changes whose behavior and purpose can be explained
  directly. Group verified mechanical or generated changes by their common cause,
  retaining every affected file in the map.
- **Unresolved:** missing source or evidence prevents a grounded explanation.
  Name what is missing and which conclusion depends on it.

Finish when every changed file and substantive hunk has a disposition and every
drill-down candidate has an explicit reason. Carry unresolved gaps into the page
and qualify its coverage accordingly.

## 2. Explain recursively

Organize the explanation tree by behavior and dependency order. A **node** is a
coherent mechanism: it may span several files or occupy one condition. The root
explains the whole change; its children explain the important parts.

For each drill-down node, apply the same explanatory pattern at its own scope:

- **Background:** the local contract, relevant prior behavior, and prerequisites.
  Link to background already explained elsewhere; give newly needed concepts
  their own skippable explanation.
- **Intuition:** why this mechanism matters to its parent. Use concrete inputs,
  states, or a small diagram to make the behavior tangible. Distinguish rationale
  supported by the source from your interpretation.
- **Code:** show the relevant actual code, with before/after excerpts where
  applicable. Label excerpts with file, symbol, and revision/line location;
  identify omissions and label illustrative pseudocode separately. Trace the
  example through the changed statements to outputs or side effects. Explain
  the consequential conditions, invariants, and edge or failure paths.
- **Children:** identify any remaining important mechanism whose implementation
  the current explanation leaves opaque, inspect it, and apply this pattern
  again to that smaller question.

Keep each node readable at its own level: state its conclusion and its role in
the parent before offering children. Brief chunks remain concise explanations
at the appropriate level.

Recurse until each leaf connects concrete input or state, the relevant code,
and the resulting behavior, including why its critical conditions matter. Each
child must answer a distinct question left open by its parent. Stop following
unchanged helpers when their stated contracts suffice to explain the change.
Explain shared mechanisms once and link back to them, including cyclic calls.
Depth follows the mechanism; use this stopping rule without a fixed depth cap.

Finish when every drill-down candidate maps to a node and every leaf satisfies
the stopping rule or names a specific evidence gap. Preserve the map and tree
when work spans context windows so the remaining branches stay visible.

## 3. Render the explanation tree

Keep the original Background, Intuition, Code, and Quiz sections as the visible
reading path. Read and apply [the shared recursive HTML reference](../../docs/recursive-explanation-html.md)
for expandable nodes, navigation, and interaction checks.

Use the original five-question interactive quiz to test both the overall change
and its important deeper mechanisms. Give each question one clear target and
link its feedback to the relevant node. Add a local question only when it tests
a distinct difficult mechanism that benefits from immediate practice.

Finish when the collapsed page explains the whole change coherently and every
drill-down node is present, reachable, and connected to its parent.

## 4. Verify and deliver

Reconcile the rendered page with the coverage map. Confirm that consequential
small edits, deleted behavior, and interactions across files have the promised
explanations. Check excerpts and behavioral claims against the inspected source;
label examples, inferred intent, and evidence gaps accurately.

Check the original skill's HTML rules and run the interaction checks in the
shared reference. Exercise every quiz answer and verify that its feedback and
link to the relevant node work.

Deliver the dated HTML file with a link, identifying any remaining coverage or
verification gaps. Completion requires accounted-for changes, satisfied leaf
criteria, and working navigation through the explanation tree.
