---
name: explain-diff-notion
description: Use when the user asks for a rich explanation of a code change, diff, branch, or PR. Produces a Notion page.
---

# Explain Diff Notion

Create a rich explanation of the specified code change as a Notion page.

## Content

Include these sections:

- Background: Explain the existing system relevant to this change. Broadly explore surrounding code. Include deep background for beginners that can be skipped by readers who already know the system, then narrower background directly relevant to the change.
- Intuition: Explain the core intuition for the code change. Focus on the essence, not every implementation detail. Use concrete examples with toy data. Use figures and diagrams liberally.
- Code: Provide a high-level walkthrough of the changes. Group and order the changes in an understandable way.
- Quiz: Create five medium-difficulty questions that test whether the reader actually understands the PR. Avoid gotchas. Each question should have multiple-choice answers with an explanation detailing why each answer is correct or incorrect. Use toggle blocks for the answer feedback.

Example quiz structure:

```markdown
1. Question
   > Option 1
     Incorrect: Explanation for why it was incorrect.
   > Option 2
     Incorrect: Explanation for why it was incorrect.
   > Option 3
     Correct: Explanation for why it was correct.
   > Option 4
     Incorrect: Explanation for why it was incorrect.
2. Question
   ...
```

## Output

- Use the Notion MCP tools to create a new page and return the URL of the new page.
- Write with clear, engaging, classic technical prose. Make transitions between sections smooth.
- Use a small number of reusable diagram families throughout the explanation where helpful. Include example data in diagrams.
- Use callouts for key concepts, definitions, important edge cases, and similar emphasis.
