---
name: gemini-code-review
description: Code review using Google Gemini CLI. Use when you want a second opinion on code changes from Gemini AI.
allowed-tools: Bash(gemini-code-review:*)
---

# Gemini Code Review

Get code reviews from Google Gemini CLI. Useful for getting a second AI perspective on your changes.

## Prerequisites

1. Install Gemini CLI:
   ```bash
   npm install -g @google/gemini-cli
   ```

2. Authenticate (one of):
   - **Google Login**: Run `gemini` once and follow OAuth flow (free tier: 60 req/min, 1000/day)
   - **API Key**: Set `GEMINI_API_KEY` environment variable
   - **Vertex AI**: Set `GOOGLE_GENAI_USE_VERTEXAI=true` + GCP credentials

3. Verify installation:
   ```bash
   gemini --version
   ```

## Usage

### Review staged changes
```bash
git diff --cached | gemini -p "Review this code for bugs, security issues, and code quality. Be specific with file names and line numbers." -m gemini-3-pro-preview --output-format text
```

### Review unstaged changes
```bash
git diff | gemini -p "Review this code for bugs, security issues, and code quality. Be specific with file names and line numbers." -m gemini-3-pro-preview --output-format text
```

### Review all uncommitted changes
```bash
git diff HEAD | gemini -p "Review this code for bugs, security issues, and code quality. Be specific with file names and line numbers." -m gemini-3-pro-preview --output-format text
```

### Review changes on branch (vs main)
```bash
git diff main...HEAD | gemini -p "Review this code for bugs, security issues, and code quality. Be specific with file names and line numbers." -m gemini-3-pro-preview --output-format text
```

### Review specific file
```bash
git diff HEAD -- path/to/file.ts | gemini -p "Review this code change." -m gemini-3-pro-preview --output-format text
```

### Get JSON output (for parsing)
```bash
git diff --cached | gemini -p "Review this code. Return JSON with: {issues: [{file, line, severity, message}], summary: string}" -m gemini-3-pro-preview --output-format json
```

## Review Prompts

### Standard review
```
Review this code for:
1. Bugs and logic errors
2. Security vulnerabilities
3. Performance issues
4. Code quality and maintainability
Be specific with file names and line numbers.
```

### Security-focused
```
Security review this code. Look for:
- Injection vulnerabilities (SQL, command, XSS)
- Authentication/authorization issues
- Data exposure risks
- Input validation gaps
```

### Quick sanity check
```
Quick review: any obvious bugs or issues in this diff?
```

## Flags Reference

| Flag | Description |
|------|-------------|
| `-p "prompt"` | Non-interactive mode with prompt |
| `-m gemini-3-pro-preview` | Use gemini-3-pro model |
| `--output-format text` | Plain text output (default) |
| `--output-format json` | JSON output for parsing |

## When to Use

- Before committing: get a second opinion on your changes
- PR review: supplement human review with AI analysis
- Learning: understand potential issues in your code
- Security audit: catch common vulnerabilities

## Notes

- Gemini CLI reads from stdin, so pipe your diff directly
- For large diffs, consider reviewing file-by-file
- Output goes to stdout; redirect to file if needed
