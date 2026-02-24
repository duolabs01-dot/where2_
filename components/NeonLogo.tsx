import React from 'react';
import { motion } from 'framer-motion';
import { MotionTokens } from '../utils/animations';

interface NeonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  sm: 'text-4xl',
  md: 'text-6xl',
  lg: 'text-7xl',
  xl: 'text-8xl'
};

// --- Independent Animation Loops ---

// Layer A: Core Pulse (Fast, Energetic)
const coreVariants = {
  animate: {
    opacity: MotionTokens.glowCoreOpacity,
    scale: [1, 1.06, 1],
    transition: {
      duration: MotionTokens.fast, // 1200ms
      ease: "easeInOut" as const,
      repeat: Infinity,
    }
  }
};

// Layer B: Aura Bloom (Slow, Deep Breathing)
const auraVariants = {
  animate: {
    opacity: MotionTokens.glowBloomOpacity,
    // We animate filter via standard style prop usually, but scale works well for performance
    scale: [1.1, 1.25, 1.1], 
    transition: {
      duration: MotionTokens.medium, // 2600ms
      ease: "easeOut" as const,
      repeat: Infinity,
    }
  }
};

// Memoized to prevent re-renders breaking the loop
export const NeonLogo = React.memo<NeonLogoProps>(({ size = 'lg', className = '' }) => {
  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      
      {/* Container ensures layers stack correctly */}
      <div className="relative z-10 flex items-center justify-center">
        
        {/* Layer B: Aura Bloom (Deep Background) */}
        {/* Uses a blurred duplicate of the text to create the bloom */}
        <motion.div 
          className={`absolute inset-0 flex items-center justify-center ${SIZES[size]} font-display font-bold text-primary blur-[22px] select-none pointer-events-none`}
          variants={auraVariants}
          animate="animate"
        >
          2
        </motion.div>

        {/* Layer A: Core Pulse (Tight Glow) */}
        <motion.div 
          className={`absolute inset-0 flex items-center justify-center ${SIZES[size]} font-display font-bold text-primary blur-[8px] select-none pointer-events-none`}
          variants={coreVariants}
          animate="animate"
        >
          2
        </motion.div>

        {/* Layer C: The Solid Anchor (Sharp) */}
        {/* Stays static to provide visual stability while glow breathes around it */}
        <span 
          className={`relative z-10 ${SIZES[size]} font-display font-bold select-none text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]`}
        >
          2
        </span>
      </div>

      {/* Layer D: Ground Reflection (Ambient) */}
      <motion.div
        className="absolute -bottom-2 w-[80%] h-3 rounded-[100%] bg-primary/20 blur-md pointer-events-none"
        animate={{
          opacity: [0.1, 0.2, 0.1],
          scaleX: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: MotionTokens.medium,
          repeat: Infinity,
          ease: "easeInOut" as const
        }}
      />
    </div>
  );
});