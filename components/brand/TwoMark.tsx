
import React from 'react';
import { motion, Variants } from 'framer-motion';
import { prefersReducedMotion } from '../../utils/animations';

// Single source of truth for the Where2 brand mark. Do not restyle per-screen.

interface TwoMarkProps {
  size?: number; // Font size in px
  className?: string;
  intensity?: number; // Opacity multiplier (0-1)
}

// --- Independent Animation Loops (Copied from NeonLogo source) ---

// Layer A: Core Pulse (Fast, Energetic)
const coreVariants: Variants = {
  animate: {
    opacity: [0.8, 1, 0.8], // Slightly boosted min opacity for better visibility
    scale: [1, 1.08, 1],    // Slightly increased pulse magnitude
    textShadow: [
      "0 0 4px rgba(159,80,255,0.6)",
      "0 0 8px rgba(159,80,255,0.9)",
      "0 0 4px rgba(159,80,255,0.6)"
    ],
    transition: {
      duration: 2.0,
      ease: "easeInOut",
      repeat: Infinity,
    }
  }
};

// Layer B: Aura Bloom (Slow, Deep Breathing)
const auraVariants: Variants = {
  animate: {
    opacity: [0.4, 0.6, 0.4],
    scale: [1.1, 1.25, 1.1], 
    transition: {
      duration: 4.0,
      ease: "easeOut",
      repeat: Infinity,
    }
  }
};

export const TwoMark = React.memo<TwoMarkProps>(({ size = 18, className = '', intensity = 1 }) => {
  // Dynamic blur based on size to ensure visibility at small scales
  const auraBlur = Math.max(2, size / 3.5);
  const coreBlur = Math.max(0.5, size / 12);

  return (
    <div 
        className={`relative inline-flex items-center justify-center select-none ${className}`}
        style={{ width: size, height: size }}
        aria-label="Where2 Brand Mark"
    >
      
      {/* Layer B: Aura Bloom (Deep Background) */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center font-display font-bold text-primary pointer-events-none"
        style={{ 
            fontSize: size, 
            filter: `blur(${auraBlur}px)`,
            opacity: intensity 
        }}
        variants={prefersReducedMotion ? undefined : auraVariants}
        animate={prefersReducedMotion ? undefined : "animate"}
      >
        2
      </motion.div>

      {/* Layer A: Core Pulse (Tight Glow) */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center font-display font-bold text-primary pointer-events-none"
        style={{ 
            fontSize: size, 
            filter: `blur(${coreBlur}px)`,
            opacity: intensity 
        }}
        variants={prefersReducedMotion ? undefined : coreVariants}
        animate={prefersReducedMotion ? undefined : "animate"}
      >
        2
      </motion.div>

      {/* Layer C: The Solid Anchor (Sharp) */}
      {/* Increased drop-shadow intensity for premium pop */}
      <span 
        className="relative z-10 font-display font-bold text-white drop-shadow-[0_0_3px_rgba(159,80,255,0.8)]"
        style={{ fontSize: size }}
      >
        2
      </span>
    </div>
  );
});
