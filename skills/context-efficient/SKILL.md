---
name: context-efficient
description: Context-efficient backpressure patterns for AI agents running tests, builds, and linting operations.
---

# Context-Efficient Backpressure

Prevent AI agents from drowning in irrelevant test/build/lint output. Compress success output (✓), show full failures.

## The Problem

When agents run tests, builds, or linters, they get 200+ lines of mostly useless output:
- `PASS src/utils/helper.test.ts`
- `PASS src/components/Button.test.tsx`
- `PASS src/services/api.test.ts`
- ... (197 more lines)
- `FAIL src/auth/login.test.ts`

Every PASS line wastes tokens. Agents burn context parsing junk instead of fixing failures.

## The Solution

**Deterministic output compression**: Developers control what's shown, not models.

- ✓ Success = single symbol
- ✗ Failure = full output with stack traces
- Fail-fast modes surface one issue at a time
- Strip timing/fluff, keep essentials

## Usage

### Bash Output Wrapper

Use `run_silent()` to compress command output:

```bash
run_silent() {
    local output
    local status

    output=$(eval "$@" 2>&1)
    status=$?

    if [ $status -eq 0 ]; then
        echo "✓ $@"
    else
        echo "✗ $@ (exit $status)"
        echo "$output"
    fi

    return $status
}

# Usage
run_silent npm test
run_silent npm run build
run_silent npm run lint
```

### Fail-Fast Configuration

Enable fail-fast to surface one error at a time:

**Jest:**
```json
{
  "jest": {
    "bail": 1
  }
}
```

**pytest:**
```bash
pytest -x  # Stop at first failure
pytest --maxfail=1
```

**ESLint:**
```bash
eslint . --max-warnings 0
```

**TypeScript:**
```json
{
  "compilerOptions": {
    "noEmitOnError": true
  }
}
```

### Output Parsing Patterns

**Strip timing info:**
```bash
npm test 2>&1 | grep -v "Time:" | grep -v "Ran.*tests"
```

**Extract only failures:**
```bash
pytest --tb=short 2>&1 | awk '/FAILED|ERROR/,/^$/'
```

**Show only changed files:**
```bash
git diff --name-only | xargs eslint
```

## Key Patterns

### 1. Compress Success, Expose Failure

```bash
# Good: Deterministic compression
run_silent npm test && echo "All tests passed" || cat test-output.log

# Bad: Hope model truncates correctly
npm test  # 200 lines of PASS spam
```

### 2. Progressive Refinement

Run once, fix one issue, repeat:

```bash
# First failure only
npm test -- --bail

# Fix it
# Run again for next failure
npm test -- --bail
```

### 3. Selective Output

Show only what matters:

```bash
# Only failed test names
npm test 2>&1 | grep "FAIL"

# Only compilation errors
tsc --noEmit 2>&1 | grep "error TS"

# Only lint errors, skip warnings
eslint . --quiet
```

## Anti-Patterns

**Don't let models over-conserve:**
```bash
# Bad: Piping to head burns tokens
npm test | head -20  # Agent sees incomplete output, re-runs, wastes more tokens

# Bad: Suppressing all output
npm test > /dev/null  # Now agent has no info, must run again

# Good: Deterministic compression
run_silent npm test
```

**Don't show irrelevant detail:**
```bash
# Bad: Full jest output with timings
npm test --verbose

# Good: Minimal failure info
npm test --bail --no-coverage
```

## Integration Examples

### CI/CD Scripts

```bash
#!/bin/bash
set -e

run_silent() { ... }

echo "🔨 Building..."
run_silent npm run build

echo "🧪 Testing..."
run_silent npm test -- --bail

echo "📝 Linting..."
run_silent npm run lint -- --max-warnings 0

echo "✅ All checks passed"
```

### Pre-commit Hook

```bash
#!/bin/bash

STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep '\.tsx\?$')

if [ -n "$STAGED" ]; then
    run_silent eslint $STAGED || exit 1
    run_silent npm test -- --bail --findRelatedTests $STAGED || exit 1
fi
```

### Watch Mode

```bash
# Show only failures during development
npm test -- --watch --silent --bail
```

## Benefits

1. **Token efficiency**: 200 lines → 1 line for passing tests
2. **Faster iteration**: Agents see failures immediately
3. **Better focus**: No parsing junk, straight to fixing
4. **Deterministic**: Same output every time, no model guessing

## When to Use

- Running test suites (Jest, pytest, RSpec)
- Build processes (tsc, webpack, rollup)
- Linting operations (ESLint, Flake8, Rubocop)
- Any command with verbose success output

## Source

Based on [Context-Efficient Backpressure for Coding Agents](https://www.humanlayer.dev/blog/context-efficient-backpressure) by HumanLayer.
