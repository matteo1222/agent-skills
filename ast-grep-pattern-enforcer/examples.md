# AST-Grep Pattern Enforcer - Examples

This document provides real-world examples of ast-grep rules for common scenarios.

## React & React Native

### Prevent useState in Class Components

```yaml
id: no-usestate-in-class
language: tsx
rule:
  all:
    - pattern: useState($_)
    - inside:
        pattern: |
          class $NAME extends Component {
            $$$
          }
severity: error
message: |
  ❌ Cannot use useState hook in class components

  Convert to functional component or use this.setState()
```

### Enforce Hooks Rules of React

```yaml
id: hooks-only-in-functions
language: tsx
rule:
  all:
    - pattern: use$HOOK($_)
    - not:
        inside:
          any:
            - pattern: function $NAME() { $$$ }
            - pattern: const $NAME = () => { $$$ }
            - pattern: export function $NAME() { $$$ }
severity: error
message: Hooks can only be called inside function components
```

### Prevent Inline Styles

```yaml
id: no-inline-styles
language: tsx
rule:
  pattern: <$TAG style={{ $$$ }} />
severity: warning
message: |
  ⚠️  Avoid inline styles

  Use StyleSheet.create() or Tailwind classes instead:
  <View className="..." />
```

## Testing Best Practices

### Require Test IDs for Integration Tests

```yaml
id: require-testid-for-touchable
language: tsx
rule:
  all:
    - pattern: <Touchable$TYPE onPress={$_} $$$></$TAG>
    - not:
        has:
          pattern: testID="$_"
    - inside:
        path: "**/__tests__/integration/**"
severity: warning
message: |
  Integration tests should use testID for reliable element selection

  Add: testID="descriptive-id"
```

### Prevent .only() in Committed Tests

```yaml
id: no-test-only
language: typescript
rule:
  any:
    - pattern: it.only($_, $_)
    - pattern: describe.only($_, $_)
    - pattern: test.only($_, $_)
severity: error
message: |
  ❌ Remove .only() before committing

  This causes other tests to be skipped in CI
```

### Enforce Async Wait Patterns

```yaml
id: prefer-findby-over-getby-async
language: tsx
rule:
  all:
    - pattern: await $_.getBy$METHOD($_)
    - inside:
        pattern: async () => { $$$ }
severity: warning
message: |
  ⚠️  Use findBy* instead of await getBy*

  Bad:  await screen.getByText('Hello')
  Good: await screen.findByText('Hello')
```

## TypeScript Patterns

### Prevent `any` Type

```yaml
id: no-explicit-any
language: typescript
rule:
  any:
    - pattern: ": any"
    - pattern: "as any"
    - pattern: "<any>"
severity: error
message: |
  ❌ Explicit 'any' type is not allowed

  Use proper typing or 'unknown' for truly unknown types
```

### Require Return Type Annotations

```yaml
id: require-return-type-public-functions
language: typescript
rule:
  all:
    - pattern: |
        export function $NAME($$$) {
          $$$
        }
    - not:
        pattern: |
          export function $NAME($$$): $TYPE {
            $$$
          }
severity: warning
message: |
  Public functions should have explicit return types

  export function foo(): ReturnType { ... }
```

### Prevent Type Assertions on Imports

```yaml
id: no-import-assertions
language: typescript
rule:
  pattern: import $_ from '$_' as $_
severity: error
message: |
  ❌ Don't use type assertions on imports

  Fix types at the source or use proper typing
```

## Import/Export Patterns

### Enforce Barrel Exports

```yaml
id: prefer-barrel-imports
language: typescript
rule:
  all:
    - pattern: import { $EXPORT } from '@/components/$NAME/$FILE'
    - regex: "^(?!index)"
severity: warning
message: |
  ⚠️  Import from barrel file instead

  Bad:  import { Button } from '@/components/Button/Button'
  Good: import { Button } from '@/components/Button'
```

### Prevent Relative Imports Across Boundaries

```yaml
id: no-relative-imports-outside-module
language: typescript
rule:
  all:
    - pattern: import $_ from '$PATH'
    - regex: "^(\\.\\./){3,}"
severity: error
message: |
  ❌ Relative imports should not go up more than 2 levels

  Use absolute imports: @/module/path
```

### Enforce Path Alias Usage

```yaml
id: use-path-aliases
language: typescript
rule:
  all:
    - pattern: import $_ from '$PATH'
    - regex: "^\\.\\./\\.\\./src/"
severity: warning
message: |
  Use path alias instead of relative imports

  Bad:  import X from '../../../src/lib/utils'
  Good: import X from '@/lib/utils'
```

## API & Backend Patterns

### Prevent Blocking Operations in Async Functions

```yaml
id: no-sync-in-async
language: typescript
rule:
  all:
    - pattern: $FUNC.readFileSync($_)
    - inside:
        pattern: async function $NAME() { $$$ }
severity: error
message: |
  ❌ Don't use sync methods in async functions

  Use: await fs.readFile() instead of readFileSync()
```

### Require Error Handling in Async Routes

```yaml
id: async-routes-need-try-catch
language: typescript
rule:
  all:
    - pattern: |
        app.$METHOD('$PATH', async ($REQ, $RES) => {
          $$$
        })
    - not:
        has:
          pattern: try { $$$ } catch ($ERR) { $$$ }
severity: warning
message: |
  ⚠️  Async route handlers should have try-catch

  Or use async error handling middleware
```

## Performance Patterns

### Prevent Expensive Operations in Render

```yaml
id: no-heavy-operations-in-render
language: tsx
rule:
  all:
    - any:
        - pattern: JSON.parse($_)
        - pattern: JSON.stringify($_)
        - pattern: $_.sort($_)
        - pattern: $_.filter($_).map($_)
    - inside:
        pattern: |
          function $NAME() {
            return (
              $$$
            )
          }
    - not:
        inside:
          pattern: useMemo(() => { $$$ }, $_)
severity: warning
message: |
  ⚠️  Heavy operations in render can cause performance issues

  Use useMemo() to cache expensive computations
```

### Detect Missing Dependencies in useEffect

```yaml
id: useeffect-missing-deps
language: tsx
rule:
  all:
    - pattern: |
        useEffect(() => {
          $$$
          $VAR
          $$$
        }, [$$$])
    - not:
        pattern: |
          useEffect(() => { $$$ }, [$$$, $VAR, $$$])
severity: warning
message: Check if all dependencies are included in useEffect
note: This is a simplified check - use eslint-plugin-react-hooks for complete analysis
```

## Security Patterns

### Prevent Dangerous innerHTML Usage

```yaml
id: no-dangerous-html
language: tsx
rule:
  pattern: dangerouslySetInnerHTML={{ __html: $HTML }}
severity: warning
message: |
  ⚠️  Security risk: XSS vulnerability

  Sanitize HTML before rendering:
  import DOMPurify from 'dompurify'
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
```

### Detect Hardcoded Secrets

```yaml
id: no-hardcoded-tokens
language: typescript
rule:
  all:
    - pattern: |
        $VAR = "$VALUE"
    - regex: "(token|secret|password|api_key)\\s*=\\s*[\"'][A-Za-z0-9]{20,}[\"']"
severity: error
message: |
  ❌ Possible hardcoded secret detected

  Use environment variables: process.env.API_KEY
```

### Require HTTPS in Production

```yaml
id: require-https-in-production
language: typescript
rule:
  all:
    - pattern: 'http://$URL'
    - not:
        pattern: 'http://localhost$_'
    - not:
        pattern: 'http://127.0.0.1$_'
severity: error
message: |
  ❌ Use HTTPS in production

  HTTP connections are not secure
```

## Architecture Patterns

### Enforce Layered Architecture

```yaml
id: no-ui-in-domain-layer
language: typescript
rule:
  all:
    - pattern: import $_ from '$PATH'
    - regex: "(components|ui|views)"
    - inside:
        path: "src/domain/**"
severity: error
message: |
  ❌ Domain layer cannot depend on UI layer

  Domain logic should be UI-agnostic
```

### Prevent Cross-Module Imports

```yaml
id: no-cross-module-imports
language: typescript
rule:
  all:
    - pattern: import $_ from '@/modules/$MODULE/$_'
    - inside:
        path: "src/modules/$OTHER/**"
    - regex: "^(?!$OTHER$)"
severity: error
message: |
  ❌ Modules should not import from other modules directly

  Use shared interfaces or events for cross-module communication
```

## Migration Helpers

### Detect Old API Usage

```yaml
id: migrate-to-new-query-api
language: typescript
rule:
  pattern: useQuery($KEY, $FETCHER)
severity: warning
message: |
  📦 Migrate to React Query v5 syntax

  Old: useQuery('key', fetcher)
  New: useQuery({ queryKey: ['key'], queryFn: fetcher })
```

### Find Deprecated Component Usage

```yaml
id: no-deprecated-button
language: tsx
rule:
  pattern: <OldButton $$$>$$$</OldButton>
severity: error
message: |
  ❌ OldButton is deprecated

  Use new Button component:
  import { Button } from '@/components/ui/button'
```

## Complex Patterns

### Detect Potential Memory Leaks

```yaml
id: cleanup-event-listeners
language: typescript
rule:
  all:
    - pattern: |
        useEffect(() => {
          $$$
          $TARGET.addEventListener($EVENT, $HANDLER)
          $$$
        }, $_)
    - not:
        has:
          pattern: |
            return () => {
              $$$
              $TARGET.removeEventListener($EVENT, $HANDLER)
              $$$
            }
severity: warning
message: |
  ⚠️  Event listeners should be cleaned up

  Add cleanup function:
  useEffect(() => {
    element.addEventListener('event', handler)
    return () => element.removeEventListener('event', handler)
  }, [])
```

### Enforce Consistent Error Handling

```yaml
id: consistent-error-handling
language: typescript
rule:
  all:
    - pattern: |
        catch ($ERR) {
          console.log($ERR)
        }
severity: error
message: |
  ❌ Don't log errors with console.log

  Use proper error handling:
  - logger.error(err)
  - Sentry.captureException(err)
  - throw err (if not handled)
```

## Testing This Skill

Try creating a rule for your codebase:

```bash
# 1. Create a test file with violation
echo 'jest.mock("expo-router", () => ({}))' > test.tsx

# 2. Test pattern interactively
ast-grep run --pattern 'jest.mock("expo-router", $_)' test.tsx

# 3. Create rule YAML
cat > rule.yml << 'EOF'
id: test-rule
language: tsx
rule:
  pattern: jest.mock("expo-router", $_)
severity: error
message: Don't mock expo-router manually
EOF

# 4. Test rule
ast-grep scan --rule rule.yml test.tsx

# 5. Clean up
rm test.tsx rule.yml
```
