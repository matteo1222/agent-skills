# Delightful UI Patterns

Code snippets for adding polish to apps across different frameworks.

---

## Swift / SwiftUI

### Page Transition (Slide with Bounce)

```swift
// Custom page transition with slide and bounce
struct SlideTransition: ViewModifier {
    let isActive: Bool

    func body(content: Content) -> some View {
        content
            .offset(x: isActive ? 0 : UIScreen.main.bounds.width)
            .animation(.spring(response: 0.4, dampingFraction: 0.75), value: isActive)
    }
}

// Usage in TabView or Navigation
struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tag(0)
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing),
                    removal: .move(edge: .leading)
                ))

            ProfileView()
                .tag(1)
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: selectedTab)
    }
}
```

### Modal Bounce

```swift
struct BouncySheet<Content: View>: View {
    @Binding var isPresented: Bool
    let content: Content

    @State private var offset: CGFloat = 1000

    var body: some View {
        ZStack {
            if isPresented {
                Color.black.opacity(0.3)
                    .ignoresSafeArea()
                    .onTapGesture { isPresented = false }

                VStack {
                    Spacer()
                    content
                        .background(Color(.systemBackground))
                        .cornerRadius(20)
                        .shadow(radius: 20)
                        .offset(y: offset)
                        .gesture(
                            DragGesture()
                                .onChanged { value in
                                    if value.translation.height > 0 {
                                        offset = value.translation.height
                                    }
                                }
                                .onEnded { value in
                                    if value.translation.height > 100 {
                                        isPresented = false
                                    } else {
                                        offset = 0
                                    }
                                }
                        )
                }
                .transition(.move(edge: .bottom))
                .animation(.spring(response: 0.4, dampingFraction: 0.75), value: offset)
            }
        }
        .animation(.spring(response: 0.35, dampingFraction: 0.8), value: isPresented)
        .onChange(of: isPresented) { newValue in
            offset = newValue ? 0 : 1000
        }
    }
}
```

### Haptic Feedback

```swift
import UIKit

enum HapticStyle {
    case light, medium, heavy, success, warning, error, selection
}

func haptic(_ style: HapticStyle) {
    switch style {
    case .light:
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    case .medium:
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
    case .heavy:
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
    case .success:
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    case .warning:
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
    case .error:
        UINotificationFeedbackGenerator().notificationOccurred(.error)
    case .selection:
        UISelectionFeedbackGenerator().selectionChanged()
    }
}

// Usage
Button("Save") {
    haptic(.success)
    saveData()
}
```

### Loading State with Shimmer

```swift
struct ShimmerView: View {
    @State private var phase: CGFloat = 0

    var body: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                Color.gray.opacity(0.3),
                Color.gray.opacity(0.1),
                Color.gray.opacity(0.3)
            ]),
            startPoint: .leading,
            endPoint: .trailing
        )
        .mask(Rectangle())
        .offset(x: phase)
        .onAppear {
            withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                phase = 200
            }
        }
    }
}

// Skeleton placeholder
struct SkeletonRow: View {
    var body: some View {
        HStack {
            Circle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 50, height: 50)
                .overlay(ShimmerView())

            VStack(alignment: .leading, spacing: 8) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 16)
                    .overlay(ShimmerView())

                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 100, height: 12)
                    .overlay(ShimmerView())
            }
        }
    }
}
```

### Button Press Animation

```swift
struct PressableButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .opacity(configuration.isPressed ? 0.9 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.6), value: configuration.isPressed)
    }
}

// Usage
Button("Tap Me") {
    haptic(.medium)
}
.buttonStyle(PressableButton())
```

### Staggered List Animation

```swift
struct StaggeredList<Item: Identifiable, Content: View>: View {
    let items: [Item]
    let content: (Item) -> Content

    @State private var appeared = Set<Item.ID>()

    var body: some View {
        LazyVStack(spacing: 12) {
            ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                content(item)
                    .opacity(appeared.contains(item.id) ? 1 : 0)
                    .offset(y: appeared.contains(item.id) ? 0 : 20)
                    .onAppear {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8).delay(Double(index) * 0.05)) {
                            appeared.insert(item.id)
                        }
                    }
            }
        }
    }
}
```

---

## React / Web

### Page Transition (Framer Motion)

```tsx
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
};

function PageWrapper({ children, key }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Modal Bounce

```tsx
import { motion, AnimatePresence } from 'framer-motion';

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 bottom-4 bg-white rounded-2xl p-6 z-50 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Loading State with Shimmer

```tsx
// CSS
const shimmerStyles = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}
`;

function SkeletonCard() {
  return (
    <div className="flex gap-4 p-4">
      <div className="skeleton w-12 h-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
      </div>
    </div>
  );
}
```

### Button Press Animation

```tsx
import { motion } from 'framer-motion';

function PressableButton({ children, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium"
    >
      {children}
    </motion.button>
  );
}
```

### Staggered List Animation

```tsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

function StaggeredList({ items }) {
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="show"
    >
      {items.map((data) => (
        <motion.li key={data.id} variants={item}>
          {data.content}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

### Success Celebration

```tsx
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

function SuccessCheck({ show }) {
  if (show) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="w-8 h-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <motion.path d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## React Native

### Haptic Feedback

```tsx
import * as Haptics from 'expo-haptics';

// Light tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Selection change
Haptics.selectionAsync();

// Usage in component
function HapticButton({ onPress, children }) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress}>
      {children}
    </Pressable>
  );
}
```

### Animated Modal (Reanimated)

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

function BottomSheet({ isVisible, onClose, children }) {
  const translateY = useSharedValue(500);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withSpring(500);
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {children}
      </Animated.View>
    </>
  );
}
```

### Press Animation

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

function AnimatedPressable({ onPress, children, style }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
```

---

## Flutter

### Page Transition

```dart
// Custom page route with slide transition
class SlidePageRoute<T> extends PageRouteBuilder<T> {
  final Widget page;

  SlidePageRoute({required this.page})
      : super(
          pageBuilder: (context, animation, secondaryAnimation) => page,
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            final curvedAnimation = CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutCubic,
            );

            return SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(1.0, 0.0),
                end: Offset.zero,
              ).animate(curvedAnimation),
              child: child,
            );
          },
          transitionDuration: const Duration(milliseconds: 300),
        );
}

// Usage
Navigator.push(context, SlidePageRoute(page: DetailScreen()));
```

### Bouncy Modal

```dart
Future<void> showBouncyBottomSheet(BuildContext context, Widget child) {
  return showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (context) => TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 400),
      curve: Curves.elasticOut,
      builder: (context, value, child) => Transform.scale(
        scale: value,
        alignment: Alignment.bottomCenter,
        child: child,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: child,
      ),
    ),
  );
}
```

### Haptic Feedback

```dart
import 'package:flutter/services.dart';

// Light
HapticFeedback.lightImpact();

// Medium
HapticFeedback.mediumImpact();

// Heavy
HapticFeedback.heavyImpact();

// Selection
HapticFeedback.selectionClick();

// Vibrate
HapticFeedback.vibrate();

// Usage in button
ElevatedButton(
  onPressed: () {
    HapticFeedback.mediumImpact();
    // action
  },
  child: Text('Tap'),
)
```

### Shimmer Loading

```dart
class ShimmerLoading extends StatefulWidget {
  final Widget child;

  const ShimmerLoading({required this.child});

  @override
  State<ShimmerLoading> createState() => _ShimmerLoadingState();
}

class _ShimmerLoadingState extends State<ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => ShaderMask(
        shaderCallback: (bounds) => LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [
            Colors.grey[300]!,
            Colors.grey[100]!,
            Colors.grey[300]!,
          ],
          stops: [
            _controller.value - 0.3,
            _controller.value,
            _controller.value + 0.3,
          ],
        ).createShader(bounds),
        child: widget.child,
      ),
    );
  }
}
```

### Staggered List

```dart
class StaggeredListView extends StatelessWidget {
  final List<Widget> children;

  const StaggeredListView({required this.children});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: children.length,
      itemBuilder: (context, index) => TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.0, end: 1.0),
        duration: Duration(milliseconds: 300 + (index * 50)),
        curve: Curves.easeOutCubic,
        builder: (context, value, child) => Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: child,
          ),
        ),
        child: children[index],
      ),
    );
  }
}
```

---

## CSS-Only Animations (No JS Required)

### Button Press

```css
.btn {
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.btn:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### Skeleton Shimmer

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e8e8e8 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Modal Entrance

```css
.modal-backdrop {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.modal-backdrop.open {
  opacity: 1;
}

.modal-content {
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.2s ease;
}

.modal-content.open {
  transform: translateY(0) scale(1);
  opacity: 1;
}
```

### Staggered Fade-In

```css
.list-item {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.4s ease forwards;
}

.list-item:nth-child(1) { animation-delay: 0.0s; }
.list-item:nth-child(2) { animation-delay: 0.05s; }
.list-item:nth-child(3) { animation-delay: 0.1s; }
.list-item:nth-child(4) { animation-delay: 0.15s; }
.list-item:nth-child(5) { animation-delay: 0.2s; }

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```
