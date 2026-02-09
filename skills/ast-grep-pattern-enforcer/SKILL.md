---
name: ast-grep-pattern-enforcer
description: Detect code pattern deviations and enforce coding standards using ast-grep AST-based linting. Creates custom rules to prevent anti-patterns, ensure best practices, and maintain codebase consistency across TypeScript, JavaScript, React, and other languages.
---

# AST-Grep Pattern Enforcer

## Overview

This skill helps you create and maintain custom ast-grep rules to detect deviations from desired coding patterns. Unlike regex-based linting, ast-grep understands code structure through Abstract Syntax Trees (AST), making it ideal for enforcing architecture decisions, framework best practices, and team conventions.

Use this skill when:
- You need to prevent specific anti-patterns (e.g., manual mocking, deprecated APIs)
- You want to enforce framework best practices (e.g., React hooks rules, Expo Router patterns)
- You need to detect architectural violations (e.g., import restrictions, component patterns)
- Existing linters (ESLint, Biome) don't support the pattern you need

## Core Capabilities

### 1. Rule Creation
- **Pattern-based detection** – Match code structures using AST patterns, not fragile regex
- **Multi-language support** – TypeScript, JavaScript, TSX, JSX, Python, Rust, Go, and more
- **Semantic matching** – Understands code meaning, not just text (`$_` matches any expression)

### 2. Integration
- **Works alongside Biome/ESLint** – Complements existing linters without conflicts
- **CI/CD ready** – Exit codes for automated checks in pre-commit hooks and CI pipelines
- **Fast execution** – Scans entire codebases in seconds using parallel processing

### 3. Developer Experience
- **Clear error messages** – Provides fix suggestions and documentation links
- **Auto-fix support** – Can rewrite code automatically where patterns are deterministic
- **IDE integration** – Works with VS Code, Neovim, and other editors

## Workflow

### Step 1: Identify the Pattern Deviation

**Ask these questions:**
- What specific code pattern needs to be prevented?
- What's the correct alternative developers should use?
- Is this pattern detectable via AST structure (not just naming)?

**Example anti-patterns:**
```typescript
// Anti-pattern: Manual expo-router mocking
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

// Anti-pattern: Deprecated API usage
oldApi.doSomething();

// Anti-pattern: Direct state mutation
state.items.push(newItem);
```

**Verification:**
- Run `ast-grep run --pattern 'YOUR_PATTERN'` to test if pattern matches
- If unsure, search existing code: `ast-grep run --pattern 'PATTERN' .`

### Step 2: Create the Rule Definition

**Rule structure:**
```yaml
id: rule-name
language: tsx  # or typescript, javascript, python, etc.
rule:
  pattern: $PATTERN  # or use any, all, not, inside, etc.
severity: error  # or warning, hint
message: |
  Description of the problem.

  Why this is wrong and how to fix it.
note: |
  Additional context or links
fix: |
  Optional auto-fix pattern
```

**Pattern syntax:**
- `$_` – Matches any single AST node (expression, statement, etc.)
- `$VAR` – Matches and captures a named variable
- `$$$` – Matches multiple statements/expressions (variadic)

**Common rule types:**

1. **Exact pattern match:**
```yaml
rule:
  pattern: jest.mock('expo-router', $_)
```

2. **Multiple alternatives (any):**
```yaml
rule:
  any:
    - pattern: oldApi.method($_)
    - pattern: deprecatedFunction($_)
```

3. **Combined conditions (all):**
```yaml
rule:
  all:
    - pattern: useState($INITIAL)
    - inside:
        pattern: function $NAME() { $$$ }
```

4. **Exclusions (not):**
```yaml
rule:
  all:
    - pattern: import $_ from '$PATH'
    - not:
        pattern: import $_ from '@/lib/$_'
```

### Step 3: Test the Rule

**Create test file:**
```bash
mkdir -p .ast-grep/test
```

**Test pattern interactively:**
```bash
# Test on specific file
ast-grep run --pattern 'YOUR_PATTERN' path/to/file.tsx

# Test rule YAML
ast-grep scan --rule .ast-grep/rules/your-rule.yml path/to/file.tsx

# See matched code with context
ast-grep run --pattern 'PATTERN' . -A 2 -B 2
```

**Verify matches:**
- Should catch all violations (no false negatives)
- Should not match valid code (no false positives)
- Error message should be clear and actionable

### Step 4: Configure Project Integration

**Directory structure:**
```
project-root/
├── sgconfig.yml          # ast-grep configuration
├── .ast-grep/
│   ├── rules/
│   │   ├── no-manual-router-mock.yml
│   │   ├── no-deprecated-api.yml
│   │   └── enforce-import-structure.yml
│   └── README.md         # Documentation
└── package.json
```

**sgconfig.yml:**
```yaml
ruleDirs:
  - .ast-grep/rules
```

**package.json scripts:**
```json
{
  "scripts": {
    "lint:ast": "ast-grep scan",
    "lint": "biome check . && pnpm lint:ast"
  }
}
```

**Pre-commit hook (.husky/pre-commit):**
```bash
#!/bin/sh
pnpm lint:ast
```

### Step 5: Document the Rule

**In .ast-grep/README.md:**
```markdown
### `rule-name.yml`

**Purpose**: One-line description

**Why**: Explanation of the anti-pattern

**Example violation**:
\`\`\`typescript
// ❌ Bad
violatingCode();
\`\`\`

**Correct code**:
\`\`\`typescript
// ✅ Good
correctCode();
\`\`\`
```

**In rule YAML:**
- Use `message:` for clear error description
- Use `note:` for additional context
- Include documentation links in messages

## Advanced Patterns

### Conditional Matching

**Match only inside specific contexts:**
```yaml
rule:
  pattern: setState($_)
  inside:
    pattern: |
      class $NAME extends Component {
        $$$
      }
```

**Match with field constraints:**
```yaml
rule:
  pattern:
    selector: call_expression
    has:
      kind: identifier
      regex: "^(oldApi|deprecatedFunc)"
```

### Multi-file Enforcement

**Restrict imports across boundaries:**
```yaml
id: no-backend-imports-in-frontend
language: typescript
rule:
  all:
    - pattern: import $_ from '$PATH'
    - regex: "^(../)*(backend|server)"
    - inside:
        path: "frontend/**/*.ts"
severity: error
message: Frontend code cannot import from backend
```

### Contextual Rules

**Different rules per directory:**
```yaml
# .ast-grep/rules/test-files-only.yml
id: no-test-utils-in-production
language: tsx
rule:
  pattern: import $_ from '@/test-utils'
  not:
    inside:
      path: "**/__tests__/**"
severity: error
```

## Integration Patterns

### With Biome/ESLint

```json
// package.json
{
  "scripts": {
    "lint": "biome check . && ast-grep scan",
    "lint:fix": "biome check --write . && ast-grep scan --update-all"
  }
}
```

### With CI/CD

```yaml
# .github/workflows/lint.yml
- name: Run ast-grep
  run: pnpm lint:ast
  # Exits with code 1 if violations found
```

### With Pre-commit Hooks

```json
// lint-staged config
{
  "*.{ts,tsx}": ["biome check --write", "ast-grep scan"]
}
```

## Common Use Cases

### 1. Framework Best Practices

**Prevent manual framework mocking:**
```yaml
id: no-manual-expo-router-mock
language: tsx
rule:
  any:
    - pattern: jest.mock('expo-router', $_)
    - pattern: jest.mock("expo-router", $_)
message: |
  Use renderRouter from 'expo-router/testing-library' instead
  See: https://docs.expo.dev/router/reference/testing/
```

**Enforce React hooks rules:**
```yaml
id: hooks-must-start-with-use
language: tsx
rule:
  pattern: |
    function $NAME() {
      $$$
      useState($INIT)
      $$$
    }
  regex: "^[^u]|^u[^s]|^us[^e]"
message: Components using hooks must be named starting with 'use'
```

### 2. Architecture Enforcement

**Prevent circular dependencies:**
```yaml
id: no-circular-imports
language: typescript
rule:
  all:
    - pattern: import $_ from '@/services/$NAME'
    - inside:
        path: "src/services/$NAME/**"
message: Circular dependency detected in services layer
```

**Enforce layer boundaries:**
```yaml
id: no-ui-in-business-logic
language: typescript
rule:
  all:
    - pattern: import $_ from '$PATH'
    - regex: "(components|ui)"
    - inside:
        path: "src/domain/**"
message: Domain logic cannot depend on UI components
```

### 3. Migration Assistance

**Detect deprecated APIs:**
```yaml
id: no-deprecated-query-methods
language: typescript
rule:
  any:
    - pattern: useQuery({ queryKey, queryFn })
    - pattern: useMutation({ mutationFn })
message: |
  Deprecated React Query v4 syntax.

  Use v5 syntax:
  useQuery({ queryKey, queryFn: async () => ... })
```

**Find unsafe patterns:**
```yaml
id: no-unsafe-innerhtml
language: tsx
rule:
  pattern: dangerouslySetInnerHTML={{ __html: $HTML }}
severity: warning
message: |
  Using dangerouslySetInnerHTML can expose XSS vulnerabilities.

  Sanitize HTML or use safe alternatives.
```

## Debugging Rules

### Pattern not matching?

1. **Check language setting** – `tsx` vs `typescript` vs `javascript`
2. **Test simpler pattern** – Start with basic match, add constraints incrementally
3. **Use debug mode** – `ast-grep run --debug-query 'pattern'`
4. **Inspect AST** – `ast-grep run --pattern '$$$' file.tsx` shows all nodes

### Too many false positives?

1. **Add context constraints** – Use `inside:`, `has:`, or `not:` to narrow scope
2. **Use regex filters** – Combine pattern with `regex:` for exact matching
3. **Add file path filters** – Restrict to specific directories

### Performance issues?

1. **Use file globs** – `ast-grep scan 'src/**/*.tsx'` instead of `.`
2. **Parallelize** – ast-grep uses all CPU cores by default
3. **Add to .gitignore** – Exclude `node_modules`, `dist`, etc.

## Best Practices

### Rule Design
- ✅ **One rule, one purpose** – Don't combine unrelated checks
- ✅ **Clear error messages** – Explain why and how to fix
- ✅ **Provide examples** – Show both wrong and right code
- ✅ **Link to docs** – Include URLs for framework best practices

### Organization
- ✅ **Semantic naming** – `no-X`, `enforce-Y`, `require-Z` conventions
- ✅ **Document rules** – Maintain `.ast-grep/README.md`
- ✅ **Version control** – Commit rules with code they validate
- ✅ **Test rules** – Create test cases for each rule

### Integration
- ✅ **Run in CI** – Prevent violations from merging
- ✅ **Local feedback** – Pre-commit hooks for fast iteration
- ✅ **Gradual adoption** – Start with `severity: warning`, upgrade to `error`

## Resources

- [ast-grep Documentation](https://ast-grep.github.io/)
- [Pattern Syntax Guide](https://ast-grep.github.io/guide/pattern-syntax.html)
- [Rule Configuration](https://ast-grep.github.io/guide/rule-config.html)
- [Playground](https://ast-grep.github.io/playground.html) – Test patterns interactively

## Examples Repository

See `.ast-grep/rules/` in your project for working examples of:
- Framework best practice enforcement
- Anti-pattern detection
- Migration assistance rules
- Architecture boundary validation
