# AST-Grep Pattern Enforcer Skill

A Claude Code skill for detecting code pattern deviations and enforcing coding standards using ast-grep.

## What is This?

This skill teaches Claude how to:
- Create custom ast-grep rules to detect anti-patterns
- Enforce framework best practices (React, Expo, TypeScript, etc.)
- Prevent architectural violations
- Assist with code migrations
- Maintain codebase consistency

## Quick Start

1. **Invoke the skill:**
   ```
   Use the ast-grep-pattern-enforcer skill
   ```

2. **Common requests:**
   - "Create an ast-grep rule to prevent [anti-pattern]"
   - "Enforce [framework] best practice for [pattern]"
   - "Detect when developers use [deprecated API]"
   - "Set up architecture boundary rules for [layer]"

## What Claude Will Do

When you invoke this skill, Claude will:

1. **Understand the pattern** you want to enforce/prevent
2. **Create ast-grep rule YAML** with:
   - Correct AST pattern matching
   - Clear error messages
   - Fix suggestions
   - Documentation links
3. **Set up project integration**:
   - Create `.ast-grep/rules/` directory
   - Add `sgconfig.yml` configuration
   - Update `package.json` scripts
   - Integrate with existing linters
4. **Test the rule** against your codebase
5. **Document usage** in `.ast-grep/README.md`

## Example Interactions

### Example 1: Prevent Anti-Pattern

**You:**
```
I want to prevent developers from manually mocking expo-router with jest.mock().
They should use renderRouter from expo-router/testing-library instead.
```

**Claude will:**
1. Create `.ast-grep/rules/no-manual-expo-router-mock.yml`
2. Add pattern matching for `jest.mock('expo-router', ...)`
3. Include helpful error message with correct alternative
4. Set up `pnpm lint:ast` command
5. Test the rule and verify it works

### Example 2: Enforce Best Practice

**You:**
```
Enforce React hooks rules - hooks can only be called in function components
or custom hooks that start with 'use'.
```

**Claude will:**
1. Create rule detecting hook usage outside functions
2. Add pattern to match hook calls in class components
3. Include educational error messages
4. Provide examples of correct usage

### Example 3: Architecture Boundaries

**You:**
```
Prevent UI components from being imported into the domain layer.
Domain logic should be UI-agnostic.
```

**Claude will:**
1. Create rule detecting UI imports in domain path
2. Add path-based filtering
3. Configure severity as error
4. Explain architecture violation in message

## Files Included

- **SKILL.md** - Main skill documentation with workflows and patterns
- **examples.md** - 30+ real-world rule examples across different scenarios
- **README.md** - This file

## Integration

This skill works alongside:
- ✅ **Biome** - Complementary AST-based linting
- ✅ **ESLint** - Additional custom rules
- ✅ **TypeScript** - Type-level enforcement
- ✅ **Pre-commit hooks** - Prevent violations before commit
- ✅ **CI/CD** - Block PRs with violations

## When to Use This Skill

Use this skill when:
- ❌ Existing linters don't support your pattern
- 🏗️ You need to enforce architecture decisions
- 📚 You want to teach best practices through linting
- 🔄 You're migrating to new APIs/frameworks
- 🎯 You need project-specific conventions

**Don't use when:**
- Biome or ESLint already has a rule for it
- The pattern is better enforced via TypeScript types
- It's a naming convention (use Biome's naming rules)

## Real-World Use Cases

From actual Quick Nutrient project:

1. **Expo Router Testing**
   - Prevent: `jest.mock('expo-router')`
   - Enforce: `renderRouter()` from testing library
   - Status: ✅ Implemented and working

2. **Test Data Factories**
   - Prevent: Hardcoded test data
   - Enforce: Using factory functions
   - Status: 🔄 In progress

3. **Import Boundaries**
   - Prevent: Frontend importing backend code
   - Enforce: Clear module boundaries
   - Status: 📋 Planned

## Resources

- [ast-grep Documentation](https://ast-grep.github.io/)
- [Pattern Playground](https://ast-grep.github.io/playground.html)
- [Rule Examples](./examples.md)

## Tips for Best Results

1. **Be specific** about the anti-pattern you want to prevent
2. **Provide examples** of both wrong and right code
3. **Explain why** the pattern is bad (helps Claude write better messages)
4. **Test iteratively** - start simple, add constraints as needed
5. **Document rationale** - future developers will appreciate it

## Contributing

Found a great rule pattern? Add it to `examples.md` and submit a PR!

## License

MIT - Use freely in your projects
