# Quick Start Guide

## Try the Skill in 2 Minutes

### Step 1: Invoke the Skill

In Claude Code, type:
```
Use the ast-grep-pattern-enforcer skill to create a rule that prevents console.log in production code
```

### Step 2: Watch Claude Work

Claude will:
1. Create `.ast-grep/rules/no-console-log.yml`
2. Set up the pattern to detect `console.log()`
3. Add helpful error message
4. Configure project integration
5. Test the rule

### Step 3: Verify

```bash
# Test the rule manually
echo 'console.log("test")' > test.ts
ast-grep scan test.ts

# Should output:
# error[no-console-log]: Don't use console.log in production
# Use a proper logger instead
```

## Common Patterns to Try

### React/React Native

**Prevent inline styles:**
```
Create a rule to prevent inline styles in React Native.
Developers should use StyleSheet.create() instead.
```

**Enforce hooks rules:**
```
Create a rule to detect useState usage in class components.
```

**Prevent dangerous patterns:**
```
Create a rule to detect dangerouslySetInnerHTML without sanitization.
```

### Testing

**No .only() in commits:**
```
Create a rule to prevent test.only() and it.only() from being committed.
```

**Proper async assertions:**
```
Create a rule to enforce using findBy instead of await getBy in async tests.
```

### Architecture

**Import boundaries:**
```
Create a rule to prevent frontend code from importing backend modules.
```

**Layer separation:**
```
Create a rule to prevent UI components in the domain layer.
```

### TypeScript

**No `any` type:**
```
Create a rule to prevent explicit 'any' types.
Suggest using 'unknown' instead.
```

**Require return types:**
```
Create a rule requiring explicit return types on exported functions.
```

## Advanced Usage

### Migration Helper

```
Create rules to help migrate from React Query v4 to v5:
1. Detect old useQuery syntax: useQuery(key, fetcher)
2. Suggest new syntax: useQuery({ queryKey, queryFn })
3. Include auto-fix where possible
```

### Multiple Related Rules

```
Create a suite of rules for our authentication layer:
1. Prevent hardcoded tokens/secrets
2. Require HTTPS in production URLs
3. Enforce error handling in auth functions
4. Validate token expiration checks
```

### Framework Best Practices

```
Create comprehensive Expo Router testing rules:
1. No manual jest.mock('expo-router')
2. Must use renderRouter for navigation tests
3. Prefer navigation assertions over mock verification
4. Include links to official Expo docs
```

## Tips for Writing Good Prompts

### ✅ Good Prompts (Specific)

- "Prevent manual mocking of expo-router. Use renderRouter instead."
- "Detect useState in class components. This is invalid in React."
- "Require try-catch in async Express route handlers."
- "No relative imports going up more than 2 levels. Use path aliases."

### ❌ Vague Prompts (Hard to Implement)

- "Make the code better"
- "Add linting for React"
- "Check for bad patterns"
- "Improve testing"

### 🎯 Best Format

```
Create a rule to prevent [SPECIFIC_PATTERN]

Why: [REASON]
Wrong: [CODE_EXAMPLE]
Right: [CODE_EXAMPLE]
Severity: [error|warning]
```

**Example:**
```
Create a rule to prevent .readFileSync() in async functions

Why: Blocking operations in async code defeat the purpose of async
Wrong: async function load() { const data = fs.readFileSync('file.txt'); }
Right: async function load() { const data = await fs.readFile('file.txt'); }
Severity: error
```

## Testing Your Rules

After Claude creates a rule:

```bash
# 1. Scan your codebase
pnpm lint:ast

# 2. Test on specific file
ast-grep scan path/to/file.tsx

# 3. See what would be matched
ast-grep run --pattern 'YOUR_PATTERN' .

# 4. Interactive debugging
ast-grep run --pattern 'PATTERN' . -A 2 -B 2
```

## Iterating on Rules

If the rule isn't quite right:

```
The rule is matching too much. Can you:
1. Only match in production code (not __tests__)
2. Exclude console.error and console.warn
3. Make it a warning instead of error
```

## Next Steps

Once you're comfortable:

1. **Explore examples.md** - 30+ real-world rule patterns
2. **Read SKILL.md** - Complete workflow and advanced patterns
3. **Check ast-grep docs** - Deep dive into pattern syntax
4. **Share your rules** - Contribute useful patterns back

## Need Help?

The skill handles:
- ✅ Pattern syntax (even complex AST patterns)
- ✅ Rule configuration (severity, messages, fixes)
- ✅ Project integration (package.json, configs)
- ✅ Testing and validation
- ✅ Documentation

Just ask Claude:
```
I'm trying to [GOAL] but [PROBLEM]. Can you help?
```

Example:
```
I'm trying to detect when developers forget to clean up event listeners
in useEffect, but I'm not sure how to match the pattern. Can you help?
```
