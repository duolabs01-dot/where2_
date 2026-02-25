
export const springs = {
  // Snappy, native-feeling — use for nav, buttons, modal open
  snappy: { type: "spring", stiffness: 500, damping: 35, mass: 0.8 },
  // Bouncy delight — use for success states, badges, confetti
  bouncy: { type: "spring", stiffness: 600, damping: 20, mass: 0.6 },
  // Smooth, weighty — use for bottom sheets, cards sliding in
  smooth: { type: "spring", stiffness: 280, damping: 32, mass: 1.0 },
  // Ultra-fast micro — use for icon fills, color changes
  micro: { type: "spring", stiffness: 800, damping: 40, mass: 0.4 },
  // Gentle float — use for ambient idle animations
  float: { type: "spring", stiffness: 80, damping: 18, mass: 1.2 },
};

// Page transition variants — cross-fade + slight Y shift
export const pageVariants = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  in: { opacity: 1, y: 0, scale: 1, transition: springs.smooth },
  out: { opacity: 0, y: -8, scale: 1.01, transition: { ...springs.micro, duration: 0.15 } },
};

// Card entrance — staggered from bottom
export const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { ...springs.snappy, delay: i * 0.05 },
  }),
};

// Sheet entrance — slides up from below
export const sheetVariants = {
  hidden: { y: "100%", opacity: 0.8 },
  visible: { y: 0, opacity: 1, transition: springs.smooth },
  exit: { y: "100%", opacity: 0, transition: { ...springs.micro, duration: 0.2 } },
};

export const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const triggerConfetti = () => {
    import('canvas-confetti').then(confetti => {
        confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#9F50FF', '#10B981', '#00F0FF']
        });
    });
};

export const useHaptic = () => ({
  trigger: () => window.navigator.vibrate?.(10),
  triggerSuccess: () => window.navigator.vibrate?.([10, 30, 10]),
});
