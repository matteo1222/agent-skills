# Context-Efficient Backpressure Examples

## Quick Start

### 1. Source the utilities

```bash
source backpressure.sh
```

### 2. Run commands with compression

```bash
# Before: 200 lines of output
npm test

# After: Single line on success
run_silent npm test
```

## Real-World Examples

### Pre-commit Hook

Save as `.git/hooks/pre-commit`:

```bash
#!/bin/bash
source "$(git rev-parse --show-toplevel)/context-efficient/backpressure.sh"

echo "🔍 Running pre-commit checks..."

# Only check staged files
if ! check_changed "\.tsx\?$"; then
    echo "❌ Linting failed"
    exit 1
fi

# Run tests for changed files
STAGED=$(git diff --cached --name-only --diff-filter=ACM)
if ! run_silent "npm test -- --bail --findRelatedTests $STAGED"; then
    echo "❌ Tests failed"
    exit 1
fi

echo "✅ Pre-commit checks passed"
```

### CI Pipeline

```bash
#!/bin/bash
# ci.sh
source backpressure.sh

set -e  # Exit on first error

echo "🏗️  Starting CI pipeline..."

# Run all checks with compression
ci_check

echo "✅ CI pipeline completed successfully"
```

### Development Workflow

```bash
# Terminal 1: Watch tests with compressed output
source backpressure.sh
watch_compressed "npm test -- --bail"

# Terminal 2: Make changes
vim src/app.ts

# Terminal 3: Quick check before committing
source backpressure.sh
run_checks "build_fast" "lint_fast" "test_fast"
```

### Debugging Failures

```bash
# Run tests and capture output
npm test 2>&1 | tee test-output.log

# Filter to see only failures
cat test-output.log | filter_failures jest

# Or use pytest
pytest 2>&1 | filter_failures pytest
```

### Git Integration

```bash
# Check only modified files
git diff --name-only | grep '\.py$' | xargs pytest --tb=short

# Check files in current branch vs main
git diff main...HEAD --name-only | grep '\.ts$' | xargs eslint --quiet

# Check staged files only
check_changed "\.tsx\?$"
```

### Framework-Specific Examples

#### Jest

```bash
# Minimal output, stop at first failure
run_silent "npm test -- --bail --silent --no-coverage"

# Show only test names
npm test -- --verbose=false --silent | grep -E "✓|✕"

# Watch mode with minimal output
npm test -- --watch --silent --bail --notify=false
```

#### pytest

```bash
# Short traceback, stop at first failure
run_silent "pytest -x --tb=short --no-header"

# Show only failed test names
pytest --quiet --tb=no

# Parallel execution with minimal output
run_silent "pytest -n auto -x --tb=short"
```

#### TypeScript

```bash
# Only show errors, no emitting
run_silent "tsc --noEmit --pretty false 2>&1 | grep 'error TS'"

# Incremental build with minimal output
run_silent "tsc --incremental --noEmit"

# Type check specific files
git diff --name-only | grep '\.ts$' | xargs tsc --noEmit
```

#### ESLint

```bash
# Errors only, no warnings
run_silent "eslint . --quiet"

# Specific severity level
run_silent "eslint . --max-warnings 0"

# Changed files only
git diff --name-only | grep '\.jsx\?$' | xargs eslint --quiet
```

### Advanced Patterns

#### Parallel Checks

```bash
# Run checks in parallel, wait for all
build_fast & BUILD_PID=$!
lint_fast & LINT_PID=$!
test_fast & TEST_PID=$!

wait $BUILD_PID && wait $LINT_PID && wait $TEST_PID
```

#### Progressive Enhancement

```bash
# Start with fastest checks
run_silent "eslint . --quiet" || exit 1

# Then type checking
run_silent "tsc --noEmit" || exit 1

# Then unit tests
run_silent "npm test -- --bail" || exit 1

# Finally integration tests
run_silent "npm run test:integration -- --bail" || exit 1
```

#### Custom Filters

```bash
# Create custom filter for your framework
filter_myframework() {
    grep "FAIL" |
    grep -v "Timing" |
    sed 's/^[[:space:]]*//' |
    head -20
}

# Use it
npm test 2>&1 | filter_myframework
```

#### Environment-Specific

```bash
# Development: verbose failures
if [ "$NODE_ENV" = "development" ]; then
    npm test
else
    # CI: compressed output
    run_silent npm test
fi
```

## Token Savings Comparison

### Before Context-Efficient Backpressure

```
$ npm test
PASS src/utils/string.test.ts
PASS src/utils/array.test.ts
PASS src/utils/object.test.ts
PASS src/components/Button.test.tsx
PASS src/components/Input.test.tsx
... (195 more lines)
FAIL src/auth/login.test.ts
  ● should validate email

    expect(received).toBe(expected)

    Expected: true
    Received: false

Test Suites: 1 failed, 49 passed, 50 total
Tests: 1 failed, 499 passed, 500 total
Time: 45.123s
```

**Tokens used: ~2,500**

### After Context-Efficient Backpressure

```
$ run_silent npm test
✗ npm test (exit 1)
FAIL src/auth/login.test.ts
  ● should validate email

    expect(received).toBe(expected)

    Expected: true
    Received: false
```

**Tokens used: ~150**

**Savings: 94%**

## Troubleshooting

### Output still too verbose

```bash
# Add more aggressive filtering
run_silent "npm test" 2>&1 | grep -v "Time:\|Snapshots:\|Ran all test"
```

### Need to see passing tests occasionally

```bash
# Add flag to show summary
run_silent_verbose() {
    output=$(eval "$@" 2>&1)
    status=$?

    if [ $status -eq 0 ]; then
        echo "✓ $@"
        echo "$output" | tail -5  # Last 5 lines for summary
    else
        echo "✗ $@"
        echo "$output"
    fi
}
```

### Debugging the wrapper itself

```bash
# Run without compression
bash -x backpressure.sh

# Or just use the original command
npm test  # Full output
```

## Best Practices

1. **Always use fail-fast in CI**: Stop at first failure to save time and tokens
2. **Filter at the source**: Configure tools (Jest, pytest) for minimal output
3. **Progressive checks**: Run fast checks first (lint), then slow (tests)
4. **Cache aggressively**: Use incremental builds and test caching
5. **Check only changes**: Use git diff to target relevant files
6. **Separate concerns**: Different scripts for dev vs CI environments

## Integration with AI Agents

When using with Claude Code or other AI coding agents:

```bash
# In your project's CLAUDE.md or instructions
echo "When running tests, always use: run_silent npm test"
echo "For CI checks, use: ci_check"
echo "For git hooks, use: check_changed"
```

This ensures agents automatically use context-efficient patterns.
