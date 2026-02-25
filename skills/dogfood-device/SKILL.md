---
name: dogfood-device
description: Systematically explore and test a mobile app on iOS/Android to find bugs, UX issues, and other problems. Use when asked to "dogfood", "QA", "exploratory test", "find issues", "bug hunt", or "test this app" on a mobile target. Produces a structured report with screenshots, repro videos, and detailed repro steps for every issue.
allowed-tools: Bash(agent-device:*)
---

# Dogfood Device

Systematically explore a mobile app, find issues, and produce a report with full reproduction evidence for every finding.

## Setup

Only the **App** and **Platform** are required. Everything else has sensible defaults.

| Parameter | Default | Example override |
|-----------|---------|-----------------|
| **App** | _(required)_ | `Settings`, `com.example.myapp` |
| **Platform** | _(required)_ | `ios`, `android` |
| **Session name** | App name slugified | `--session my-session` |
| **Output directory** | `./dogfood-output/` | `Output directory: /tmp/qa` |
| **Scope** | Full app | `Focus on the settings screen` |
| **Device** | Default simulator/emulator | Specific device from `devices` list |

If the user says something like "dogfood MyApp on ios", start immediately with defaults. Do not ask clarifying questions unless something is ambiguous.

Always use `agent-device` directly -- never `npx agent-device`. The direct binary is faster.

## Workflow

```
1. Initialize    Set up session, output dirs, report file
2. Orient        List devices, open app, take initial snapshot
3. Explore       Systematically navigate screens and test features
4. Document      Screenshot + record each issue as found
5. Wrap up       Update summary counts, close session
```

### 1. Initialize

```bash
mkdir -p {OUTPUT_DIR}/screenshots {OUTPUT_DIR}/videos
```

Copy the report template into the output directory and fill in the header fields:

```bash
cp {SKILL_DIR}/templates/dogfood-report-template.md {OUTPUT_DIR}/report.md
```

Start a named session and open the app:

```bash
agent-device --session {SESSION} open {APP} --platform {PLATFORM}
```

### 2. Orient

Take an initial screenshot and snapshot to understand the app structure:

```bash
agent-device --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/initial.png
agent-device --session {SESSION} snapshot -i
```

Check app state and identify the main navigation elements:

```bash
agent-device --session {SESSION} appstate
```

Map out the tabs, menus, and sections to visit.

### 3. Explore

Read [references/issue-taxonomy.md](references/issue-taxonomy.md) for the full list of what to look for and the exploration checklist.

**Strategy -- work through the app systematically:**

- Start from the main navigation (tab bar, hamburger menu, etc.). Visit each top-level section.
- Within each section, test interactive elements: tap buttons, fill forms, toggle switches, open pickers/modals.
- Check edge cases: empty states, error handling, boundary inputs, long text, special characters.
- Try realistic end-to-end workflows (create, edit, delete flows).
- Test mobile-specific behaviors: keyboard interactions, scroll behavior, pull-to-refresh.
- Check app logs for errors periodically.

**At each screen:**

```bash
agent-device --session {SESSION} snapshot -i
agent-device --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/{screen-name}.png
```

**Check logs periodically** (enable logging first if not already):

```bash
agent-device --session {SESSION} logs clear --restart
# ... perform actions ...
agent-device --session {SESSION} logs path
# Then grep the path for errors:
grep -n -E "Error|Exception|Fatal|crash|SIGABRT" {LOG_PATH}
```

**After any navigation or modal change, re-snapshot:**

```bash
agent-device --session {SESSION} snapshot -i
```

Use your judgment on how deep to go. Spend more time on core features and less on peripheral screens. If you find a cluster of issues in one area, investigate deeper.

### 4. Document Issues (Repro-First)

Steps 3 and 4 happen together -- explore and document in a single pass. When you find an issue, stop exploring and document it immediately before moving on.

Every issue must be reproducible. When you find something wrong, prove it with evidence.

**Choose the right level of evidence for the issue:**

#### Interactive / behavioral issues (crashes, broken flows, wrong state)

These require user interaction to reproduce -- use full repro with video and step-by-step screenshots:

1. **Start a repro video** _before_ reproducing:

```bash
agent-device --session {SESSION} record start {OUTPUT_DIR}/videos/issue-{NNN}-repro.mov
```

Note: Use `.mov` for iOS, `.mp4` for Android.

2. **Walk through the steps at human pace.** Pause 1-2 seconds between actions so the video is watchable. Take a screenshot at each step:

```bash
agent-device --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/issue-{NNN}-step-1.png
sleep 1
# Perform action (press, fill, etc.)
sleep 1
agent-device --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/issue-{NNN}-step-2.png
sleep 1
# ...continue until the issue manifests
```

3. **Capture the broken state.** Pause so the viewer can see it, then take a screenshot:

```bash
sleep 2
agent-device --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/issue-{NNN}-result.png
```

4. **Stop the video:**

```bash
agent-device --session {SESSION} record stop
```

5. Write numbered repro steps in the report, each referencing its screenshot.

#### Static / visible-on-load issues (layout glitches, clipped text, misalignment)

These are visible without interaction -- a single screenshot is sufficient. No video, no multi-step repro:

```bash
agent-device --session {SESSION} screenshot {OUTPUT_DIR}/screenshots/issue-{NNN}.png
```

Write a brief description and reference the screenshot in the report. Set **Repro Video** to `N/A`.

---

**For all issues:**

1. **Append to the report immediately.** Do not batch issues for later. Write each one as you find it so nothing is lost if the session is interrupted.

2. **Increment the issue counter** (ISSUE-001, ISSUE-002, ...).

### 5. Wrap Up

Aim to find **5-10 well-documented issues**, then wrap up. Depth of evidence matters more than total count.

After exploring:

1. Stop logging if active:

```bash
agent-device --session {SESSION} logs stop
```

2. Re-read the report and update the summary severity counts so they match the actual issues.

3. Close the session:

```bash
agent-device --session {SESSION} close
```

4. Tell the user the report is ready and summarize findings: total issues, breakdown by severity, and the most critical items.

## Guidance

- **Repro is everything.** Every issue needs proof -- but match the evidence to the issue type.
- **Don't record video for static issues.** A clipped label or misaligned icon doesn't need video. Save video for issues that involve interaction, timing, or state changes.
- **For interactive issues, screenshot each step.** Capture the before, the action, and the after.
- **Write repro steps that map to screenshots.** Each numbered step should reference its screenshot.
- **Re-snapshot after every navigation.** Refs become stale when the screen changes. Always `snapshot -i` after taps that navigate, open modals, or change the list.
- **Use `press` not `click`.** `press` is the canonical tap command for agent-device. `click` works as an alias but prefer `press`.
- **Use `fill` for form fields, `type` during video.** `fill` clears and types instantly. During video recording, use `type` for character-by-character typing that looks natural.
- **Check logs, not console.** Mobile doesn't have a browser console. Use `logs path` + `grep` to find errors. Enable logging only when debugging -- keep it off during normal exploration.
- **Test like a user, not a robot.** Try common workflows end-to-end. Tap things a real user would tap. Enter realistic data.
- **Pace repro videos for humans.** Add `sleep 1` between actions and `sleep 2` before the final result screenshot.
- **Never read the app's source code.** You are testing as a user. All findings must come from what you observe on screen and in logs.
- **Never delete output files.** Do not remove screenshots, videos, or the report mid-session.
- **Check app state after background/foreground.** Use `appstate` to verify the app is still active after switching away.

## Mobile-Specific Testing

Beyond the standard exploration, test these mobile-specific behaviors:

### Permissions
```bash
agent-device --session {SESSION} settings permission grant camera
# Test feature that uses camera
agent-device --session {SESSION} settings permission deny camera
# Verify graceful handling when permission denied
agent-device --session {SESSION} settings permission reset camera
```

### Push Notifications
```bash
agent-device --session {SESSION} push {BUNDLE_ID} '{"aps":{"alert":{"title":"Test","body":"Notification body"}}}'
```

### Clipboard
```bash
agent-device --session {SESSION} clipboard write "test-paste-content"
# Navigate to text field, paste
agent-device --session {SESSION} clipboard read
```

### App Backgrounding
```bash
agent-device --session {SESSION} appstate
# Close and reopen
agent-device --session {SESSION} open {APP} --relaunch
agent-device --session {SESSION} snapshot -i
# Check if state was preserved or lost
```

### Performance
```bash
agent-device --session {SESSION} perf --json
```

## References

| Reference | When to Read |
|-----------|--------------|
| [references/issue-taxonomy.md](references/issue-taxonomy.md) | Start of session -- calibrate what to look for, severity levels, exploration checklist |

## Templates

| Template | Purpose |
|----------|---------|
| [templates/dogfood-report-template.md](templates/dogfood-report-template.md) | Copy into output directory as the report file |
