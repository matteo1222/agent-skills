# Recursive explanation HTML

Use this reference when rendering an explanation tree as expandable HTML. The
calling skill owns the topic, source coverage, and explanatory content.

## Disclosure and navigation

- Keep the overview visible. Render deeper nodes as nested native `<details>`
  and `<summary>` elements. Each summary names the mechanism and why opening it
  is useful; its parent states the key consequence even while details are closed.
- Embed every node's completed explanation, examples, visuals, code, and children
  in the delivered file. Expansion reveals content already present in the HTML.
- Give nodes stable, unique IDs and parent links. Include their hierarchy in the
  table of contents and a compact scope-to-explanation index; for diffs, index
  the changed files. Mark brief groups and unresolved gaps explicitly.
- Make fragment navigation open all enclosing details before scrolling to the
  target, both on initial load and when navigating within the page.
- Provide Expand all and Collapse all buttons. Preserve native keyboard
  operation and visible focus. Limit visual indentation on narrow screens, and
  make the complete explanation available for printing.
- Escape source excerpts as text. Use `<pre><code>` with `white-space: pre` or
  `pre-wrap` so code preserves its whitespace and displays HTML syntax literally.

## Verification

Open the saved file in a browser when available. Exercise a deepest branch,
fragment navigation into collapsed ancestors on load and within the page, both
global disclosure buttons, and keyboard operation. Check narrow-screen layout,
rendered diagrams, and print visibility. Confirm unique IDs, resolving internal
links, embedded node content, and preserved code whitespace.

When browser verification is unavailable, inspect those properties statically
and state the limitation in the delivery message. The calling skill supplies any
additional checks for its own interactions, such as quizzes.
