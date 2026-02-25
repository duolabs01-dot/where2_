
import React, { useState, useEffect, useRef } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { PrimaryButton } from './Layouts';
import { NeonLogo } from './NeonLogo';
import { VibeQuickPickSheet } from './VibeQuickPickSheet';
import { SearchIntent } from '../types';
import { setIntentNow } from '../lib/intentEngine';

interface WelcomeScreenProps {
  onComplete: (intent: SearchIntent) => void;
  onSignIn?: () => void;
  autoAdvanceMs?: number;
  onPrefetchReady?: (venues: any[]) => void;
  source?: 'onboarding' | 'profile';
}

const REASSURANCE_MESSAGES = [
  "We’ll handle the search.",
  "Finding the perfect vibe for right now.",
  "No planning required.",
  "Just follow the neon."
];

// --- Idle Motion Variants ---

// 1. Ambient Light Drift (Background)
const ambientDrift: Variants = {
  animate: {
    backgroundPosition: ['0% 0%', '100% 100%'],
    opacity: [0.3, 0.5, 0.3],
    scale: [1, 1.1, 1],
    transition: {
      duration: 15,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }
  }
};

// 2. Parallax Float - Logo (Slowest, deepest layer)
const floatLogo: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut" }
  },
  idle: {
    y: [-5, 5, -5],
    rotate: [0, 1, 0, -1, 0], // Very subtle rotation
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// 3. Parallax Float - Text (Mid layer, slightly faster)
const floatText: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: "easeOut", delay: 0.2 }
  },
  idle: {
    y: [-3, 3, -3],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 0.5 // Offset phase
    }
  }
};

// 4. Breathing Glow - CTA (Nearest layer, focuses attention)
const ctaBreathing: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut", delay: 0.4 }
  },
  idle: {
    y: [-4, 4, -4],
    boxShadow: [
      "0 0 30px rgba(159,80,255,0.2)",
      "0 0 50px rgba(159,80,255,0.5)",
      "0 0 30px rgba(159,80,255,0.2)"
    ],
    transition: {
      y: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1
      },
      boxShadow: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete, onSignIn, autoAdvanceMs }) => {
  const [showVibeSheet, setShowVibeSheet] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [reassuranceIndex, setReassuranceIndex] = useState(0);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rotate reassurance messages
  useEffect(() => {
    const timer = setInterval(() => {
      setReassuranceIndex((prev) => (prev + 1) % REASSURANCE_MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoAdvanceMs) return;
    autoTimerRef.current = setTimeout(() => {
      handleFindNow();
    }, autoAdvanceMs);
    return () => {
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, [autoAdvanceMs]);

  const handleFindNow = () => {
    // Frictionless Handoff: Immediate trigger
    setIsLocating(true);
    setIntentNow('onboarding_cta');
    
    if (navigator.vibrate) navigator.vibrate(10);

    // Pass context silently: Open Now, Smart Auto Radius, Solo Context
    onComplete({
        mode: 'smart_auto',
        timeMode: 'open_now',
        categories: ['All'],
        groupContext: 'solo',
        initialRadius: 600,
        autoExpand: true
    });
  };

  const handleCustomApply = (intent: SearchIntent) => {
    setShowVibeSheet(false);
    onComplete(intent);
  };

  return (
    <motion.div 
      exit={{ 
        opacity: 0, 
        scale: 1.1, 
        filter: "blur(10px)",
        transition: { duration: 0.6, ease: [0.32, 0, 0.67, 0] } 
      }}
      className="fixed inset-0 z-[1000] bg-[#000000] flex flex-col items-center justify-center p-6 text-center overflow-hidden"
    >
      
      {/* 1. Ambient Background Layer (Motion) */}
      <motion.div 
        variants={ambientDrift}
        animate="animate"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(159,80,255,0.1) 0%, rgba(0,0,0,0) 70%)',
          backgroundSize: '150% 150%'
        }}
      />
      
      {/* Secondary Ambient Light (Offset drift for depth) */}
      <motion.div 
        animate={{ 
            x: [-20, 20, -20],
            y: [-20, 20, -20],
            opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-1/4 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] pointer-events-none z-0"
      />

      {/* 2. Grain/Noise Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} 
      />

      <div className="relative z-10 max-w-md w-full flex flex-col items-center">
        
        {/* Layer 1: Logo (Deep Parallax) */}
        <motion.div 
            initial="hidden"
            animate={["visible", "idle"]}
            variants={floatLogo}
            className="mb-12 relative"
        >
            <div className="flex items-center justify-center gap-2 relative z-10">
                <span className="text-6xl font-display font-bold text-white tracking-tighter drop-shadow-2xl">Where</span>
                <NeonLogo size="lg" />
                <span className="text-6xl font-display font-bold text-white drop-shadow-2xl">?</span>
            </div>
            {/* Subtle anchored accent line */}
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mt-6 pointer-events-none" />
        </motion.div>
        
        {/* Layer 2: Text (Mid Parallax) */}
        <motion.div 
            initial="hidden"
            animate={["visible", "idle"]}
            variants={floatText}
            className="mb-10"
        >
            <h2 className="text-3xl font-display font-bold text-white mb-3 leading-tight tracking-tight drop-shadow-lg">
                Let's find your spot.
            </h2>
            <div className="space-y-2">
                <p className="text-gray-400 text-xs font-medium leading-relaxed">
                   Fast results. We’ll expand distance automatically if needed.
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest opacity-60">
                   Open now • Smart distance • Zero friction
                </p>
            </div>
        </motion.div>
            
        {/* Layer 3: CTA (Near Parallax + Breathing) */}
        <motion.div 
            initial="hidden"
            animate={["visible", "idle"]}
            variants={ctaBreathing}
            className="relative z-20 mt-4 mb-2 w-full max-w-[280px] rounded-2xl"
        >
          <PrimaryButton 
              onClick={handleFindNow}
              disabled={isLocating}
              className="!py-4 !text-base !rounded-2xl !bg-white !text-black !border-none hover:!scale-[1.02] active:!scale-95 transition-transform relative overflow-hidden w-full"
          >
              {isLocating ? (
                 <span className="flex items-center justify-center gap-2">
                    <span className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                    Locating...
                 </span>
              ) : (
                 <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined filled-icon">near_me</span>
                    Find My Vibe →
                 </span>
              )}
          </PrimaryButton>
          {onSignIn && (
            <button
              onClick={onSignIn}
              className="mt-3 w-full text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              Sign In
            </button>
          )}
      </motion.div>

        {/* Reassurance Micro-copy (Rotating) */}
        <div className="h-6 relative w-full flex items-center justify-center mb-6 overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.p
                    key={reassuranceIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.6, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-xs font-medium text-white absolute"
                >
                    {REASSURANCE_MESSAGES[reassuranceIndex]}
                </motion.p>
            </AnimatePresence>
        </div>

        {/* Secondary Link - Stable */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
        >
            <button 
                onClick={() => setShowVibeSheet(true)}
                className="text-sm font-bold text-gray-500 hover:text-white transition-colors py-3 px-6 rounded-full hover:bg-white/5 active:bg-white/10"
            >
                Or customise vibe first
            </button>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 2 }}
        className="absolute bottom-8 text-[10px] text-gray-800 font-mono pointer-events-none mix-blend-difference"
      >
         v2.2 • Premium
      </motion.div>

      <AnimatePresence>
        {showVibeSheet && (
           <VibeQuickPickSheet 
             onApply={handleCustomApply}
             onClose={() => setShowVibeSheet(false)}
           />
        )}
      </AnimatePresence>

      {autoAdvanceMs && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: autoAdvanceMs / 1000, ease: 'linear' }}
          className="absolute left-0 right-0 bottom-6 h-0.5 origin-left bg-primary shadow-[0_0_12px_rgba(159,80,255,0.8)]"
        />
      )}
    </motion.div>
  );
};
