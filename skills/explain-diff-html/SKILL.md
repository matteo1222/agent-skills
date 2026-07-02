---
name: explain-diff-html
description: Use when the user asks for a rich explanation of a code change, diff, branch, or PR. Produces a self-contained interactive HTML file.
---

# Explain Diff HTML

Create a rich, interactive explanation of the specified code change.

## Content

Include these sections:

- Background: Explain the existing system relevant to this change. Broadly explore surrounding code. Include deep background for beginners that can be skipped by readers who already know the system, then narrower background directly relevant to the change.
- Intuition: Explain the core intuition for the code change. Focus on the essence, not every implementation detail. Use concrete examples with toy data. Use figures and diagrams liberally.
- Code: Provide a high-level walkthrough of the changes. Group and order the changes in an understandable way.
- Quiz: Create five medium-difficulty questions that test whether the reader actually understands the PR. Avoid gotchas. Present them as interactive multiple-choice questions; when clicked, each answer should report whether it was correct and give feedback.

## Output

- Output a single self-contained HTML file with CSS and JavaScript.
- Make the page one long document with section headers and a table of contents. Do not use tabs for the top-level structure.
- Use responsive styling so the page is comfortable on phones and desktops.
- Put the file in a global location outside the code repo, such as `/tmp`.
- Prefix the filename with today's date in `YYYY-MM-DD-` format so generated explanations sort by time and stay out of version control. Example: `/tmp/2026-01-12-explanation-<slug>.html`.
- Write with clear, engaging, classic technical prose. Make transitions between sections smooth.

## Diagrams

Pick a small number of diagram families that can be reused throughout the explanation. Useful diagram types include:

- A simplified version of the UI that the user sees in the app, to explain UI changes.
- A system diagram showing data flow or communication between components, including example data.

Do not use ASCII diagrams. Use HTML designs, semantic HTML lists, styled blocks, and other browser-native elements.

For code blocks, always use `<pre>` tags. If using a custom styled `div`, it must have `white-space: pre-wrap` in its CSS, or the browser will collapse newlines. Before saving the file, scan each code block in the HTML source and confirm its CSS includes `white-space: pre` or `pre-wrap`.

Use callouts for key concepts, definitions, important edge cases, and similar emphasis.
