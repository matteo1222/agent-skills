---
name: delightful-ui
description: Add micro-animations, haptics, and polish to make vibe-coded apps stand out.
---

# Delightful UI

Make your app stand out from generic vibe-coded apps by adding micro-animations, haptic feedback, and polished interactions.

## Why This Matters

Anyone can spin up an app in 24 hours now. Users can spot static, generic apps instantly. The difference between a forgettable app and one that feels premium is in the small details:

- Page transitions with subtle motion
- Haptic feedback on interactions
- Bouncy modals and sheets
- Animated loading states
- Micro-interactions that delight

## Usage

When building or improving an app, invoke this skill to get framework-specific code for adding polish:

```
/delightful-ui [framework] [pattern]
```

**Frameworks:** `swift`, `react`, `react-native`, `flutter`, `web`

**Patterns:**
- `page-transition` - Smooth sliding/bouncing between pages
- `modal-bounce` - Bouncy modal/sheet animations
- `loading-state` - Animated loading indicators with shimmer/pulse
- `haptics` - Haptic feedback on taps and gestures
- `button-press` - Satisfying button press animations
- `list-stagger` - Staggered list item animations
- `pull-refresh` - Custom pull-to-refresh animations
- `skeleton` - Skeleton loading placeholders
- `success` - Success state celebrations (confetti, checkmarks)
- `all` - Show all patterns for the framework

## Examples

```bash
# Get Swift page transition code
/delightful-ui swift page-transition

# Get React modal animations
/delightful-ui react modal-bounce

# Get all patterns for Flutter
/delightful-ui flutter all

# Quick audit of current app
/delightful-ui audit
```

## Quick Wins Checklist

When reviewing any app, check for these:

1. [ ] Page transitions slide/fade instead of instant swap
2. [ ] Modals/sheets bounce in with spring animation
3. [ ] Loading states have motion (not just spinner)
4. [ ] Buttons have press feedback (scale, haptic)
5. [ ] Lists animate items in with stagger
6. [ ] Empty states have personality
7. [ ] Success actions have celebration feedback
8. [ ] Pull-to-refresh has custom animation
9. [ ] Skeleton loaders instead of spinners where appropriate
10. [ ] Haptic feedback on key interactions

## Key Insight

Claude Code is very well trained on animation libraries (SwiftUI, Framer Motion, React Spring, etc). You can get complex custom animations by describing them in plain English. The key is knowing what to ask for.
