
export const MotionTokens = {
  // Duration in seconds. Increased values = slower pulsating rate.
  fast: 2.0,    // Core pulse: from 0.2s to 2.0s
  medium: 4.0,  // Aura bloom: from 0.4s to 4.0s
  slow: 8.0,    // Ambient drift: from 0.8s to 8.0s
  
  spring: { type: "spring", stiffness: 300, damping: 30 },
  pressScale: 0.95,
  glowCoreOpacity: [0.6, 1, 0.6],
  glowBloomOpacity: [0.3, 0.6, 0.3],
};

export const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 },
};

export const pageTransition = { type: "tween", ease: "anticipate", duration: 0.5 };

export const tapAnimation = { scale: 0.98 };

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
