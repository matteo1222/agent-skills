# App Polish Patterns

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

### Holographic Sticker Effect

```swift
import SwiftUI

struct HolographicSticker: View {
    let image: String
    @State private var offset: CGSize = .zero

    var body: some View {
        GeometryReader { geometry in
            Image(image)
                .resizable()
                .aspectRatio(contentMode: .fit)
                .overlay(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            .clear,
                            Color.white.opacity(0.3),
                            .clear,
                            Color.purple.opacity(0.2),
                            .clear
                        ]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    .blendMode(.overlay)
                    .offset(x: offset.width / 10, y: offset.height / 10)
                )
                .overlay(
                    RainbowSheen(offset: offset)
                        .blendMode(.overlay)
                        .opacity(0.5)
                )
                .shadow(color: .purple.opacity(0.3), radius: 20, x: offset.width / 20, y: offset.height / 20)
                .gesture(
                    DragGesture(minimumDistance: 0)
                        .onChanged { value in
                            offset = CGSize(
                                width: value.location.x - geometry.size.width / 2,
                                height: value.location.y - geometry.size.height / 2
                            )
                        }
                        .onEnded { _ in
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                                offset = .zero
                            }
                        }
                )
        }
    }
}

struct RainbowSheen: View {
    let offset: CGSize

    var body: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                .red, .orange, .yellow, .green, .blue, .purple
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .hueRotation(.degrees(Double(offset.width + offset.height) / 2))
        .opacity(0.3)
    }
}

// Usage
HolographicSticker(image: "badge_cat_1")
    .frame(width: 200, height: 200)
```

### Icon Morphing Animation

```swift
struct MorphingIcon: View {
    @Binding var isSend: Bool

    var body: some View {
        ZStack {
            // Send icon
            Image(systemName: "paperplane.fill")
                .rotationEffect(.degrees(isSend ? 0 : 180))
                .opacity(isSend ? 1 : 0)
                .scaleEffect(isSend ? 1 : 0.5)

            // Checkmark icon
            Image(systemName: "checkmark")
                .rotationEffect(.degrees(isSend ? -180 : 0))
                .opacity(isSend ? 0 : 1)
                .scaleEffect(isSend ? 0.5 : 1)
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSend)
    }
}

// Usage
Button {
    isSend.toggle()
    haptic(.medium)
} label: {
    MorphingIcon(isSend: $isSend)
        .font(.title2)
}
```

### Background Expansion Animation

```swift
struct ExpandingBackground: View {
    @Binding var isExpanded: Bool
    let sourceFrame: CGRect

    var body: some View {
        GeometryReader { geometry in
            Circle()
                .fill(Color.black)
                .frame(
                    width: isExpanded ? geometry.size.width * 3 : 44,
                    height: isExpanded ? geometry.size.width * 3 : 44
                )
                .position(
                    x: sourceFrame.midX,
                    y: sourceFrame.midY
                )
                .animation(.spring(response: 0.6, dampingFraction: 0.8), value: isExpanded)
        }
        .ignoresSafeArea()
    }
}

// Usage for microphone dictation
struct DictationView: View {
    @State private var isRecording = false
    @State private var micFrame: CGRect = .zero

    var body: some View {
        ZStack {
            if isRecording {
                ExpandingBackground(isExpanded: $isRecording, sourceFrame: micFrame)
            }

            VStack {
                Spacer()

                Button {
                    haptic(.heavy)
                    isRecording.toggle()
                } label: {
                    Image(systemName: "mic.fill")
                        .font(.title)
                        .foregroundColor(isRecording ? .white : .blue)
                        .background(
                            GeometryReader { geo in
                                Color.clear.onAppear {
                                    micFrame = geo.frame(in: .global)
                                }
                            }
                        )
                }
            }
        }
    }
}
```

### Streak Badge Gamification

```swift
struct StreakBadge: View {
    let currentStreak: Int
    let badge: BadgeLevel
    @State private var showCelebration = false

    var body: some View {
        VStack(spacing: 16) {
            // Streak counter with flame
            HStack(spacing: 8) {
                Text("\(currentStreak)")
                    .font(.system(size: 48, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.orange, .red],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                Image(systemName: "flame.fill")
                    .font(.largeTitle)
                    .foregroundColor(.orange)
                    .symbolEffect(.bounce, value: currentStreak)
            }

            // Unlockable badge
            if badge.isUnlocked {
                HolographicSticker(image: badge.imageName)
                    .frame(width: 120, height: 120)
                    .onTapGesture {
                        haptic(.success)
                        showCelebration = true
                    }
            } else {
                // Locked badge
                ZStack {
                    Image(badge.imageName)
                        .resizable()
                        .frame(width: 120, height: 120)
                        .grayscale(1.0)
                        .opacity(0.3)

                    Image(systemName: "lock.fill")
                        .font(.title)
                        .foregroundColor(.gray)
                }
            }

            Text("\(badge.requiredDays) Day Badge")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct BadgeLevel {
    let requiredDays: Int
    let imageName: String
    let isUnlocked: Bool
}
```

### Voice UI with Contextual Chips

```swift
struct VoiceUIView: View {
    @State private var selectedPrompt: String?

    let contextualPrompts = [
        "What's next?",
        "Plan my day",
        "Quick update",
        "Morning briefing"
    ]

    var body: some View {
        VStack(spacing: 24) {
            // Mascot with subtle bounce
            MascotView()
                .frame(width: 200, height: 200)

            // Contextual prompt chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(contextualPrompts, id: \.self) { prompt in
                        PromptChip(
                            text: prompt,
                            isSelected: selectedPrompt == prompt
                        ) {
                            haptic(.selection)
                            withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                                selectedPrompt = prompt
                            }
                        }
                    }
                }
                .padding(.horizontal)
            }

            Spacer()
        }
    }
}

struct PromptChip: View {
    let text: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.subheadline.weight(.medium))
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    Capsule()
                        .fill(isSelected ? Color.blue : Color.gray.opacity(0.1))
                )
                .foregroundColor(isSelected ? .white : .primary)
        }
        .buttonStyle(PressableButton())
    }
}

struct MascotView: View {
    @State private var bounce = false

    var body: some View {
        Image("mascot_character")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .offset(y: bounce ? -10 : 0)
            .onAppear {
                withAnimation(
                    .easeInOut(duration: 1.5)
                    .repeatForever(autoreverses: true)
                ) {
                    bounce = true
                }
            }
    }
}
```

### AI Loading States

```swift
struct AILoadingState: View {
    @State private var isAnimating = false
    let state: LoadingState

    var body: some View {
        HStack(spacing: 12) {
            // Animated gradient bar
            RoundedRectangle(cornerRadius: 8)
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color.blue.opacity(0.3),
                            Color.purple.opacity(0.3),
                            Color.blue.opacity(0.3)
                        ]),
                        startPoint: isAnimating ? .leading : .trailing,
                        endPoint: isAnimating ? .trailing : .leading
                    )
                )
                .frame(width: 4)
                .onAppear {
                    withAnimation(
                        .linear(duration: 1.5)
                        .repeatForever(autoreverses: true)
                    ) {
                        isAnimating = true
                    }
                }

            VStack(alignment: .leading, spacing: 4) {
                Text(state.title)
                    .font(.subheadline.weight(.medium))

                // Source results (for "Searching" state)
                if let sources = state.sources {
                    ForEach(Array(sources.enumerated()), id: \.offset) { index, source in
                        HStack(spacing: 6) {
                            Image(systemName: "doc.text.fill")
                                .font(.caption2)
                                .foregroundColor(.secondary)

                            Text(source)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        .transition(.asymmetric(
                            insertion: .move(edge: .top).combined(with: .opacity),
                            removal: .opacity
                        ))
                        .animation(
                            .spring(response: 0.4, dampingFraction: 0.8)
                            .delay(Double(index) * 0.1),
                            value: state.sources
                        )
                    }
                }
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
    }
}

struct LoadingState {
    let title: String
    let sources: [String]?

    static let searching = LoadingState(
        title: "Searching",
        sources: ["USDA Database", "Nutrition API", "MyFitnessPal"]
    )

    static let calculating = LoadingState(
        title: "Calculating",
        sources: nil
    )
}

// Usage
AILoadingState(state: .searching)
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

### Holographic Sticker Effect

```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

function HolographicSticker({ src, alt }: { src: string; alt: string }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setOffset({ x, y });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.div
      className="relative w-48 h-48 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        filter: `drop-shadow(${offset.x / 20}px ${offset.y / 20}px 20px rgba(147, 51, 234, 0.3))`,
      }}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" />

      {/* Rainbow sheen overlay */}
      <motion.div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: `linear-gradient(${offset.x + offset.y}deg,
            red, orange, yellow, green, blue, purple)`,
          mixBlendMode: 'overlay',
        }}
        animate={{ rotate: (offset.x + offset.y) / 2 }}
      />

      {/* Holographic gradient */}
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `linear-gradient(135deg,
            transparent 0%,
            rgba(255,255,255,0.3) 25%,
            transparent 50%,
            rgba(147, 51, 234, 0.2) 75%,
            transparent 100%)`,
          mixBlendMode: 'overlay',
        }}
        animate={{
          x: offset.x / 10,
          y: offset.y / 10,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      />
    </motion.div>
  );
}
```

### Icon Morphing Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion';

function MorphingIcon({ isSend }: { isSend: boolean }) {
  return (
    <div className="relative w-6 h-6">
      <AnimatePresence mode="wait">
        {isSend ? (
          <motion.div
            key="send"
            initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 180, scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="check"
            initial={{ rotate: -180, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 180, scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute inset-0"
          >
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Background Expansion Animation

```tsx
import { motion, AnimatePresence } from 'framer-motion';

function ExpandingBackground({
  isExpanded,
  sourcePosition
}: {
  isExpanded: boolean;
  sourcePosition: { x: number; y: number };
}) {
  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          className="fixed inset-0 bg-black z-40"
          initial={{
            clipPath: `circle(22px at ${sourcePosition.x}px ${sourcePosition.y}px)`,
          }}
          animate={{
            clipPath: `circle(${Math.max(window.innerWidth, window.innerHeight) * 1.5}px at ${sourcePosition.x}px ${sourcePosition.y}px)`,
          }}
          exit={{
            clipPath: `circle(22px at ${sourcePosition.x}px ${sourcePosition.y}px)`,
          }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      )}
    </AnimatePresence>
  );
}

// Usage for microphone dictation
function DictationView() {
  const [isRecording, setIsRecording] = useState(false);
  const [micPosition, setMicPosition] = useState({ x: 0, y: 0 });
  const micRef = useRef<HTMLButtonElement>(null);

  const handleMicClick = () => {
    if (micRef.current) {
      const rect = micRef.current.getBoundingClientRect();
      setMicPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
    setIsRecording(!isRecording);
  };

  return (
    <>
      <ExpandingBackground isExpanded={isRecording} sourcePosition={micPosition} />

      <button
        ref={micRef}
        onClick={handleMicClick}
        className="fixed bottom-8 right-8 w-11 h-11 rounded-full flex items-center justify-center z-50"
        style={{ color: isRecording ? 'white' : '#3b82f6' }}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
        </svg>
      </button>
    </>
  );
}
```

### Streak Badge Gamification

```tsx
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

function StreakBadge({
  currentStreak,
  badge
}: {
  currentStreak: number;
  badge: { requiredDays: number; imageSrc: string; isUnlocked: boolean };
}) {
  const handleBadgeClick = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Streak counter */}
      <div className="flex items-center gap-2">
        <motion.span
          className="text-5xl font-bold bg-gradient-to-br from-orange-500 to-red-500 bg-clip-text text-transparent"
          key={currentStreak}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          {currentStreak}
        </motion.span>

        <motion.span
          className="text-4xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          🔥
        </motion.span>
      </div>

      {/* Badge */}
      <div className="relative">
        {badge.isUnlocked ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBadgeClick}
            className="cursor-pointer"
          >
            <HolographicSticker src={badge.imageSrc} alt="Badge" />
          </motion.div>
        ) : (
          <div className="relative w-32 h-32">
            <img
              src={badge.imageSrc}
              alt="Locked badge"
              className="w-full h-full grayscale opacity-30"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">Day {badge.requiredDays} Badge</p>
    </div>
  );
}
```

### Voice UI with Contextual Chips

```tsx
import { motion } from 'framer-motion';
import { useState } from 'react';

function VoiceUIView() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

  const contextualPrompts = [
    "What's next?",
    "Plan my day",
    "Quick update",
    "Morning briefing"
  ];

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* Mascot with subtle bounce */}
      <motion.div
        animate={{ y: [-10, 0, -10] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="w-48 h-48"
      >
        <img src="/mascot.png" alt="Mascot" className="w-full h-full object-contain" />
      </motion.div>

      {/* Contextual prompt chips */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {contextualPrompts.map((prompt) => (
          <PromptChip
            key={prompt}
            text={prompt}
            isSelected={selectedPrompt === prompt}
            onClick={() => setSelectedPrompt(prompt)}
          />
        ))}
      </div>
    </div>
  );
}

function PromptChip({
  text,
  isSelected,
  onClick
}: {
  text: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap
        transition-colors duration-200
        ${isSelected
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }
      `}
    >
      {text}
    </motion.button>
  );
}
```

### AI Loading States

```tsx
import { motion } from 'framer-motion';

type LoadingState = {
  title: string;
  sources?: string[];
};

function AILoadingState({ state }: { state: LoadingState }) {
  return (
    <div className="flex gap-3 p-4 bg-white rounded-xl shadow-sm">
      {/* Animated gradient bar */}
      <motion.div
        className="w-1 rounded-full"
        style={{
          background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3), rgba(59, 130, 246, 0.3))',
          backgroundSize: '100% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '0% 100%', '0% 0%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="flex-1">
        <p className="font-medium text-sm mb-2">{state.title}</p>

        {/* Source results with stagger */}
        {state.sources && (
          <div className="space-y-1">
            {state.sources.map((source, index) => (
              <motion.div
                key={source}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 24,
                  delay: index * 0.1
                }}
                className="flex items-center gap-2 text-xs text-gray-500"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" />
                </svg>
                <span>{source}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Usage
const searchingState: LoadingState = {
  title: "Searching",
  sources: ["USDA Database", "Nutrition API", "MyFitnessPal"]
};

const calculatingState: LoadingState = {
  title: "Calculating",
};
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
