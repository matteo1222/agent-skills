#!/bin/bash
# Context-Efficient Backpressure Utilities
# Source this file in your shell: source backpressure.sh

# Core function: Run command and compress output on success
run_silent() {
    local output
    local status
    local cmd="$@"

    # Capture both stdout and stderr
    output=$(eval "$cmd" 2>&1)
    status=$?

    if [ $status -eq 0 ]; then
        echo "✓ $cmd"
    else
        echo "✗ $cmd (exit $status)"
        echo "$output"
    fi

    return $status
}

# Run multiple commands, stop at first failure
run_checks() {
    local failed=0

    for cmd in "$@"; do
        if ! run_silent "$cmd"; then
            failed=1
            break
        fi
    done

    return $failed
}

# Test runner with fail-fast
test_fast() {
    local framework="${1:-auto}"

    case $framework in
        jest|auto)
            if [ -f "package.json" ] && grep -q "jest" package.json; then
                run_silent "npm test -- --bail --silent"
                return $?
            fi
            ;&  # fallthrough
        pytest)
            if command -v pytest &> /dev/null; then
                run_silent "pytest -x --tb=short --no-header"
                return $?
            fi
            ;&
        *)
            echo "❌ No supported test framework detected"
            return 1
            ;;
    esac
}

# Lint runner with fail-fast
lint_fast() {
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
        run_silent "eslint . --max-warnings 0 --quiet"
    elif [ -f ".flake8" ] || [ -f "setup.cfg" ]; then
        run_silent "flake8 --select=E,F"
    elif [ -f ".rubocop.yml" ]; then
        run_silent "rubocop --fail-level error"
    else
        echo "❌ No linter configuration found"
        return 1
    fi
}

# Build with minimal output
build_fast() {
    if [ -f "tsconfig.json" ]; then
        run_silent "tsc --noEmit"
    elif [ -f "webpack.config.js" ]; then
        run_silent "webpack --mode production --stats errors-only"
    elif [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
        run_silent "vite build --logLevel error"
    else
        echo "❌ No build configuration found"
        return 1
    fi
}

# Run full CI check suite
ci_check() {
    echo "🔍 Running context-efficient checks..."

    local checks=(
        "build_fast"
        "lint_fast"
        "test_fast"
    )

    for check in "${checks[@]}"; do
        if ! $check; then
            echo "❌ Check failed: $check"
            return 1
        fi
    done

    echo "✅ All checks passed"
    return 0
}

# Filter test output to show only failures
filter_failures() {
    local framework="${1:-auto}"

    case $framework in
        jest)
            grep -E "(FAIL|●|Expected|Received)" | grep -v "PASS"
            ;;
        pytest)
            awk '/FAILED|ERROR/,/^$/' | grep -v "passed"
            ;;
        rspec)
            grep -E "(Failures:|expected|got:)" | grep -v "examples, 0 failures"
            ;;
        *)
            grep -i "fail\|error" | grep -v -i "pass\|success\|ok"
            ;;
    esac
}

# Extract only changed files for targeted checks
check_changed() {
    local extension="${1:-.}"
    local files=$(git diff --name-only --cached --diff-filter=ACM | grep "$extension$")

    if [ -z "$files" ]; then
        echo "✓ No changed files matching pattern: $extension"
        return 0
    fi

    echo "📝 Checking $(echo "$files" | wc -l | xargs) changed file(s)..."

    # Run appropriate checks based on file type
    if [[ "$extension" == *".ts"* ]] || [[ "$extension" == *".js"* ]]; then
        run_silent "eslint $files --max-warnings 0"
    elif [[ "$extension" == *".py"* ]]; then
        run_silent "flake8 $files"
    fi
}

# Watch mode with compressed output
watch_compressed() {
    local cmd="$@"
    echo "👀 Watching with compressed output..."
    echo "Press Ctrl+C to stop"

    while true; do
        clear
        echo "$(date '+%H:%M:%S') - Running: $cmd"
        run_silent "$cmd"
        sleep 2
    done
}

# Export functions for use in sub-shells
export -f run_silent
export -f run_checks
export -f test_fast
export -f lint_fast
export -f build_fast
export -f ci_check
export -f filter_failures
export -f check_changed
export -f watch_compressed

echo "✓ Context-efficient backpressure utilities loaded"
echo "Available commands: run_silent, test_fast, lint_fast, build_fast, ci_check, check_changed"
