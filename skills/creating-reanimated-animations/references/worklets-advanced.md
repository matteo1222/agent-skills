# Worklets & Advanced APIs

Understanding worklets and advanced Reanimated APIs for complex use cases.

## Table of Contents
- [Worklets](#worklets)
- [Thread Communication](#thread-communication)
- [Advanced Hooks](#advanced-hooks)
- [Advanced Utilities](#advanced-utilities)
- [Performance & Debugging](#performance--debugging)

---

## Worklets

A worklet is a JavaScript function that runs on the UI thread. Reanimated uses worklets to calculate styles and respond to events synchronously without crossing the JS-UI bridge.

### Defining Worklets

Add the `'worklet'` directive at the top of a function:

```tsx
function myWorklet() {
  'worklet';
  console.log('Running on UI thread');
}
```

### Auto-Workletization

Most Reanimated callbacks are automatically workletized:

```tsx
// These run on UI thread automatically:
useAnimatedStyle(() => ({ opacity: sv.value }));
useAnimatedScrollHandler({ onScroll: (e) => {} });
Gesture.Pan().onUpdate((e) => {});
```

### Closure Capturing

Worklets capture variables from their enclosing scope:

```tsx
const threshold = 100;

function checkThreshold() {
  'worklet';
  console.log('Threshold is', threshold); // captures `threshold`
}
```

**Performance warning:** Avoid capturing large objects:

```tsx
// BAD - captures entire theme object
const theme = { colors: {...}, spacing: {...}, /* large */ };
function myWorklet() {
  'worklet';
  console.log(theme.colors.primary); // captures ALL of theme
}

// GOOD - capture only what you need
const primaryColor = theme.colors.primary;
function myWorklet() {
  'worklet';
  console.log(primaryColor); // captures only primaryColor
}
```

### Worklets Don't Hoist

Unlike regular functions, worklets are not hoisted:

```tsx
myWorklet(); // ERROR - not defined yet

function myWorklet() {
  'worklet';
}
```

---

## Thread Communication

### scheduleOnUI / runOnUI

Execute worklets on the UI thread from JS thread:

```tsx
// Reanimated v4
import { scheduleOnUI } from 'react-native-worklets';

function startAnimation() {
  'worklet';
  sharedValue.value = withSpring(100);
}

// From JS thread:
scheduleOnUI(startAnimation);

// With arguments:
function animateTo(target) {
  'worklet';
  sharedValue.value = withSpring(target);
}
scheduleOnUI(animateTo, 200);
```

For Reanimated v3, use the legacy `runOnUI(startAnimation)()` form from `react-native-reanimated`. `runOnUI` remains available for v4 compatibility but is deprecated.

### scheduleOnRN / runOnJS

Execute JS functions from worklets (UI thread):

```tsx
// Reanimated v4
import { scheduleOnRN } from 'react-native-worklets';

function showAlert(message) {
  Alert.alert('Done', message);
}

const pan = Gesture.Pan().onEnd(() => {
  'worklet';
  // Call JS function from UI thread
  scheduleOnRN(showAlert, 'Gesture completed!');
});
```

For Reanimated v3, use `runOnJS(showAlert)('Gesture completed!')` from `react-native-reanimated`. `runOnJS` remains available for v4 compatibility but is deprecated.

**Important:** Functions passed to `scheduleOnRN` must be defined in RN scope, not inside worklets:

```tsx
// WRONG - myFunc defined in worklet scope
const gesture = Gesture.Pan().onEnd(() => {
  const myFunc = () => console.log('hi');
  scheduleOnRN(myFunc); // ERROR
});

// CORRECT - myFunc defined in component scope
const myFunc = () => console.log('hi');
const gesture = Gesture.Pan().onEnd(() => {
  scheduleOnRN(myFunc); // Works
});
```

---

## Advanced Hooks

### useAnimatedReaction

React to shared value changes with custom logic:

```tsx
import { useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

useAnimatedReaction(
  () => scrollY.value, // "prepare" - returns value to watch
  (current, previous) => {
    // "react" - runs when value changes
    if (current > 200 && (previous === null || previous <= 200)) {
      scheduleOnRN(onScrolledPastHeader);
    }
  },
  [] // optional deps for react function
);
```

**Use cases:**
- Trigger side effects on threshold crossings
- Sync shared values conditionally
- Debug shared value changes

### useFrameCallback

Run code every frame (~60/120 fps):

```tsx
import { useFrameCallback } from 'react-native-reanimated';

useFrameCallback((frameInfo) => {
  // frameInfo: { timestamp, timeSincePreviousFrame, timeSinceFirstFrame }

  // Physics simulation
  position.value += velocity.value * frameInfo.timeSincePreviousFrame / 1000;
  velocity.value *= 0.98; // friction
}, true); // autostart = true
```

**Frame callback control:**

```tsx
const frameCallback = useFrameCallback((info) => {
  // animation logic
}, false); // don't autostart

// Control manually:
frameCallback.setActive(true);  // start
frameCallback.setActive(false); // stop
```

### useComposedEventHandler (v4)

Combine multiple event handlers for one component:

```tsx
import { useComposedEventHandler } from 'react-native-reanimated';

const scrollHandler1 = useAnimatedScrollHandler({
  onScroll: (e) => { headerOpacity.value = /* ... */; },
});

const scrollHandler2 = useAnimatedScrollHandler({
  onScroll: (e) => { parallaxOffset.value = /* ... */; },
});

const composedHandler = useComposedEventHandler([scrollHandler1, scrollHandler2]);

<Animated.ScrollView onScroll={composedHandler} />
```

### useEvent

Create custom event handlers for native events:

```tsx
import { useEvent } from 'react-native-reanimated';

const handler = useEvent(
  (event) => {
    'worklet';
    sharedValue.value = event.nativeEvent.someValue;
  },
  ['onCustomEvent'] // event names to listen
);

<CustomNativeComponent onCustomEvent={handler} />
```

### useHandler

Lower-level hook for custom event handler creation:

```tsx
import { useHandler } from 'react-native-reanimated';

const { doDependenciesDiffer } = useHandler(
  { onScroll: (e) => { /* ... */ } },
  ['onScroll']
);
```

---

## Advanced Utilities

### measure(animatedRef)

Get component measurements on UI thread:

```tsx
import { useAnimatedRef, measure } from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

const ref = useAnimatedRef<Animated.View>();

const getMeasurements = () => {
  'worklet';
  const measurements = measure(ref);
  // { x, y, width, height, pageX, pageY }
  console.log('Width:', measurements.width);
};

// Call from gesture or other worklet
scheduleOnUI(getMeasurements);
```

**Note:** `measure` must be called from UI thread (inside worklet).

### dispatchCommand

Send commands to native components:

```tsx
import { dispatchCommand, useAnimatedRef } from 'react-native-reanimated';

const scrollRef = useAnimatedRef<Animated.ScrollView>();

const scrollToTop = () => {
  'worklet';
  dispatchCommand(scrollRef, 'scrollTo', [0, 0, true]);
};
```

### setNativeProps

Directly set native props (escape hatch):

```tsx
import { setNativeProps, useAnimatedRef } from 'react-native-reanimated';

const ref = useAnimatedRef<Animated.View>();

const updateNative = () => {
  'worklet';
  setNativeProps(ref, { opacity: 0.5 });
};
```

**Warning:** Prefer `useAnimatedStyle` when possible. Use `setNativeProps` only when you can't use animated styles.

### makeMutable

Create a mutable value outside React (for advanced use cases):

```tsx
import { makeMutable } from 'react-native-reanimated';

// Outside component - persists across renders
const globalOffset = makeMutable(0);

function Component() {
  const pan = Gesture.Pan().onUpdate((e) => {
    globalOffset.value = e.translationX;
  });
}

// Cleanup when done
globalOffset.value = null; // or use cancelAnimation
```

---

## Performance & Debugging

### Logger Configuration

Configure Reanimated's console output:

```tsx
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn, // 'warn' | 'error' | 'log'
  strict: false, // strict mode warnings
});
```

### Accurate Call Stacks

Wrap the Metro configuration to collapse Reanimated internals and surface the relevant application frames:

```js
// metro.config.js
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const config = {
  // Existing Metro configuration.
};

module.exports = wrapWithReanimatedMetroConfig(config);
```

### Common Performance Tips

1. **Separate static and animated styles:**
```tsx
// GOOD
const staticStyle = { padding: 20, borderRadius: 8 };
const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
<Animated.View style={[staticStyle, animatedStyle]} />

// BAD - recreates static styles in worklet
const style = useAnimatedStyle(() => ({
  padding: 20,
  borderRadius: 8,
  opacity: opacity.value,
}));
```

2. **Avoid creating objects in worklets:**
```tsx
// BAD
const style = useAnimatedStyle(() => ({
  transform: [{ translateX: x.value }], // creates new array every frame
}));

// GOOD (Reanimated handles this, but be aware)
```

3. **Use `useDerivedValue` for computed values:**
```tsx
// Instead of computing in multiple places
const derived = useDerivedValue(() => offset.value * 2);
```

4. **Cancel animations when unmounting:**
```tsx
useEffect(() => {
  return () => {
    cancelAnimation(sharedValue);
  };
}, []);
```

---

## Web Compatibility

On web, there's no separate UI thread. Worklets run as regular JS functions, but the `'worklet'` directive is still required for the Babel plugin to capture dependencies correctly.
