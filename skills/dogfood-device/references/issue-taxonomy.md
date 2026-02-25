# Issue Taxonomy (Mobile)

What to look for when dogfooding a mobile app, and how to classify findings.

## Severity Levels

| Level | Label | Definition | Example |
|-------|-------|-----------|---------|
| S0 | **Critical** | App crashes, data loss, security hole | Crash on login, saved data disappears |
| S1 | **Major** | Core feature broken, blocks user flow | Cannot submit form, navigation dead end |
| S2 | **Minor** | Feature works but has noticeable problem | Wrong date format, slow transition |
| S3 | **Cosmetic** | Visual polish issue, no functional impact | Misaligned icon, extra padding |

## Issue Categories

### 1. Crash / Fatal

- App crashes (SIGABRT, SIGSEGV, uncaught exception)
- ANR (Application Not Responding) on Android
- Watchdog kills on iOS (app frozen > 20 seconds)
- Memory pressure kills (jetsam on iOS)
- Crash on specific input or navigation path

**How to detect:** `logs path` + grep for `Error|Exception|Fatal|SIGABRT|SIGSEGV|crash|killed|terminated`

### 2. Functional

- Feature doesn't work as expected
- Button/tap does nothing
- Form submission fails silently
- Data not saved or loaded correctly
- Navigation leads to wrong screen or dead end
- Search returns wrong or no results
- Incorrect calculations or data display

**How to detect:** Perform the action, verify the expected outcome with `snapshot -i` and `get text`

### 3. Visual / Layout

- Text clipped or truncated
- Elements overlapping
- Content hidden behind safe area / notch
- Incorrect spacing or alignment
- Wrong colors or fonts
- Images not loading or wrong aspect ratio
- Dark mode issues (invisible text, wrong backgrounds)
- Landscape orientation layout breaks

**How to detect:** `screenshot` at each screen, visually inspect

### 4. UX / Interaction

- Confusing flow or unclear affordance
- Missing loading indicator
- No feedback after user action (tap with no response)
- Keyboard covers input field
- Cannot dismiss keyboard
- Scroll doesn't reach bottom content
- Pull-to-refresh missing or broken
- Back navigation unexpected behavior
- Gesture conflicts (swipe to go back vs. swipe carousel)

**How to detect:** Walk through flows as a real user would

### 5. Performance

- Slow app launch (> 3 seconds)
- Laggy scrolling or transitions
- Long loading times with no indicator
- High memory usage (visible in `perf --json`)
- Battery drain (excessive background activity)

**How to detect:** `perf --json` after open, observe transition smoothness during exploration

### 6. State Management

- State lost after backgrounding/foregrounding
- State lost after app relaunch (`open --relaunch`)
- Login state not persisted
- Stale data shown (cache not invalidated)
- Race conditions on rapid taps
- Incorrect state after permission change

**How to detect:** `appstate`, background/foreground cycle, `open --relaunch`

### 7. Platform-Specific

- iOS-only: Safe area insets wrong, status bar overlap, home indicator overlap
- iOS-only: Face ID / Touch ID prompt handling
- Android-only: Back button behavior unexpected
- Android-only: System navigation bar overlap
- Android-only: Different behavior across API levels
- Permission prompt missing or poorly handled
- Push notification not displayed or wrong deep link

**How to detect:** `settings permission grant/deny/reset`, `push` command, platform observation

### 8. Accessibility

- Interactive elements too small (< 44pt iOS / 48dp Android)
- Missing labels on interactive elements (check snapshot tree)
- Poor contrast (text hard to read)
- Content not reachable via standard navigation

**How to detect:** `snapshot -i` to check element tree for labels and roles

### 9. Error Handling

- No error message on failure
- Generic "Something went wrong" with no detail
- Error not recoverable (stuck state after error)
- Network error not handled (airplane mode)
- Invalid input not validated or poorly communicated

**How to detect:** Try invalid inputs, simulate failures

### 10. Console / Log Errors

- JavaScript errors (React Native / web views)
- Native exceptions caught but logged
- Deprecation warnings indicating future breaks
- Failed network requests visible in logs

**How to detect:** `logs path` + targeted grep

## Exploration Checklist

Work through this systematically. Not every item applies to every app.

### Navigation
- [ ] Visit every tab / top-level section
- [ ] Test back navigation from each screen
- [ ] Test deep linking if applicable
- [ ] Verify navigation state after backgrounding

### Core Flows
- [ ] Complete primary user journey end-to-end
- [ ] Test create / read / update / delete flows
- [ ] Test search and filtering
- [ ] Test sorting and pagination

### Input
- [ ] Fill every form field
- [ ] Test with empty input
- [ ] Test with very long input
- [ ] Test with special characters and emoji
- [ ] Test with pasted content (`clipboard write` + paste)
- [ ] Verify keyboard type matches field (email, number, etc.)

### States
- [ ] Check empty states (no data)
- [ ] Check loading states
- [ ] Check error states
- [ ] Check offline behavior (if applicable)
- [ ] Background and foreground the app
- [ ] Relaunch the app

### Visual
- [ ] Check all screens for layout issues
- [ ] Verify text is not clipped
- [ ] Check safe area / notch handling
- [ ] Test with different text sizes if applicable

### Permissions
- [ ] Grant required permissions and verify feature works
- [ ] Deny permissions and verify graceful handling
- [ ] Reset permissions and verify re-prompt

### Performance
- [ ] Check launch time with `perf --json`
- [ ] Note any visible lag during scrolling or transitions
