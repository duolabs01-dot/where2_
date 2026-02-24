
import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { pageVariants, pageTransition, tapAnimation, MotionTokens } from '../utils/animations';

// --- Typography Components ---
interface TextProps {
  children: React.ReactNode;
  className?: string;
}

export const H1: React.FC<TextProps> = ({ children, className = '' }) => (
  <h1 className={`font-display font-bold text-3xl tracking-tight text-white ${className}`}>
    {children}
  </h1>
);

export const H2: React.FC<TextProps> = ({ children, className = '' }) => (
  <h2 className={`font-display font-bold text-xl tracking-tight text-white ${className}`}>
    {children}
  </h2>
);

export const H3: React.FC<TextProps> = ({ children, className = '' }) => (
  <h3 className={`font-display font-bold text-lg leading-snug text-white ${className}`}>
    {children}
  </h3>
);

export const Body: React.FC<TextProps> = ({ children, className = '' }) => (
  <p className={`font-body text-sm text-white/80 leading-relaxed ${className}`}>
    {children}
  </p>
);

export const Caption: React.FC<TextProps> = ({ children, className = '' }) => (
  <p className={`font-body text-xs text-white/50 font-medium ${className}`}>
    {children}
  </p>
);

// --- Page Wrapper for Transitions ---
export const PageWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div
    initial="initial"
    animate="in"
    exit="out"
    variants={pageVariants}
    transition={pageTransition}
    className={`h-full w-full ${className}`}
  >
    {children}
  </motion.div>
);


// --- Gesture Hooks ---

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useSwipe = (handlers: SwipeHandlers, threshold = 50) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    touchEnd.current = null; 
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const onTouchMove = (e: TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontal) {
      if (Math.abs(distanceX) > threshold) {
        if (distanceX > 0) handlers.onSwipeLeft && handlers.onSwipeLeft();
        else handlers.onSwipeRight && handlers.onSwipeRight();
      }
    } else {
      if (Math.abs(distanceY) > threshold) {
        if (distanceY > 0) handlers.onSwipeUp && handlers.onSwipeUp();
        else handlers.onSwipeDown && handlers.onSwipeDown();
      }
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
};

// --- Pull To Refresh Component ---

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className = '', onScroll }) => {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (contentRef.current?.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0) {
        // Resistance effect
        setPullDistance(Math.min(diff * 0.5, 120)); 
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true);
      setPullDistance(60); // Snap to loading position
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    setStartY(0);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onScroll) onScroll(e.currentTarget.scrollTop);
  };

  return (
    <div 
      className={`relative h-full overflow-hidden flex flex-col ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Indicator */}
      <div 
        className="absolute top-0 left-0 w-full flex justify-center items-center pointer-events-none z-10"
        style={{ 
          height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
          transition: isRefreshing ? 'height 0.2s ease' : 'height 0s' 
        }}
      >
        <div className={`size-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg transition-transform duration-200 ${pullDistance > 10 ? 'scale-100' : 'scale-0'}`}>
           <span className={`material-symbols-outlined text-primary text-xl ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 2}deg)` }}>
             refresh
           </span>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={contentRef}
        onScroll={handleScroll}
        data-scroll-host="main"
        className="flex-1 overflow-y-auto no-scrollbar relative"
        style={{ 
          transform: `translateY(${Math.max(pullDistance, isRefreshing ? 60 : 0)}px)`,
          transition: isRefreshing ? 'transform 0.2s cubic-bezier(0,0,0.2,1)' : 'transform 0.1s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};


// --- Glass Sheet (Bottom Sheets) ---
// UPDATED: Removed hardcoded hex, now uses `bg-surface` which respects theme vars
export const GlassSheet: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <motion.div 
    initial={{ y: "100%" }}
    animate={{ y: 0 }}
    exit={{ y: "100%" }}
    transition={{ type: "spring", damping: 25, stiffness: 300 }}
    className={`bg-surface/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] rounded-t-[32px] ${className}`}
  >
    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />
    {children}
  </motion.div>
);


// --- Unified Glass Card (True iOS 15+ Design) ---

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'display' | 'interactive' | 'flat';
}

export const GlassCard = React.memo<GlassCardProps>(({ 
  children, 
  className = '', 
  onClick, 
  variant = 'display' 
}) => {
  const Component = variant === 'interactive' ? motion.div : 'div';
  const motionProps = variant === 'interactive' ? {
    whileTap: { scale: 0.98 },
    onClick: onClick
  } : { onClick: onClick };

  return (
    // @ts-ignore
    <Component 
      className={`relative rounded-2xl overflow-hidden group ${className}`}
      {...motionProps}
    >
      {/* iOS Glass Background Layer */}
      <div 
        className={`absolute inset-0 z-0
        ${variant === 'flat' ? 'bg-black/40' : 'bg-black/20'}
        backdrop-blur-xl border border-white/5 rounded-2xl
        transition-colors duration-300
        ${variant === 'interactive' ? 'group-hover:bg-black/30' : ''}
        `} 
      />
      
      {/* Content Layer */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
      
      {/* iOS Border/Highlight Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl border border-white/5 shadow-[inset_0_0_15px_rgba(255,255,255,0.03)]" />
    </Component>
  );
});

// --- iOS 15+ Header Component ---
export const IOSHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`relative mb-8 w-full ${className}`}>
    {/* iOS Glass Header */}
    <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-2xl p-6 mb-4 shadow-glass">
      <div className="text-center">
        {children}
      </div>
    </div>
    
    {/* iOS-style divider */}
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </div>
);

// --- iOS 15+ FAB Component ---
export const IOSFAB: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string }> = ({ onClick, children, className = '' }) => (
  <div className={`relative z-50 ${className}`}>
    <motion.button 
      onClick={onClick}
      whileTap={{ scale: MotionTokens.pressScale }}
      transition={MotionTokens.spring}
      className="relative w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full shadow-xl shadow-purple-500/30 flex items-center justify-center text-white text-xl font-bold overflow-hidden border border-white/10"
    >
      {/* Aura Bloom Idle Animation */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: MotionTokens.medium, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-black/20 rounded-full pointer-events-none" 
      />
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </motion.button>
  </div>
);

// --- Optimized Image Component ---
// Handles lazy loading, layout shift prevention, and reduced motion

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className = '', priority = false }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : '');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    if (!priority) {
      setCurrentSrc(src);
    }
  }, [src, priority]);

  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      {/* Placeholder / Skeleton underneath */}
      <div className={`absolute inset-0 bg-white/5 ${isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-700`} />
      
      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover ${
          reduceMotion 
            ? (isLoaded ? 'opacity-100' : 'opacity-0') // Instant fade for reduced motion
            : `transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-sm'}`
        }`}
      />
    </div>
  );
};


// --- Primary Button ---
// Neon aesthetic with tactile feedback & min touch target

interface ButtonProps extends HTMLMotionProps<"button"> {
  children?: React.ReactNode;
  fullWidth?: boolean;
  // Explicitly add common attributes to avoid TS resolution issues with React.FC deconstruction
  className?: string;
  onClick?: any;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const PrimaryButton = ({ 
  children, 
  className = '', 
  fullWidth = true, 
  ...props 
}: ButtonProps) => (
  <motion.button 
    whileTap={tapAnimation}
    transition={MotionTokens.spring}
    className={`
      ${fullWidth ? 'w-full' : ''}
      min-h-[48px] 
      bg-primary text-white font-display font-bold text-sm tracking-wide
      py-3.5 px-6 rounded-2xl
      shadow-neon border border-white/10
      hover:bg-primary-dark hover:shadow-[0_0_30px_rgba(159,80,255,0.6)]
      disabled:opacity-50 disabled:cursor-not-allowed
      transition-colors duration-200
      flex items-center justify-center gap-2
      group
      ${className}
    `}
    {...props}
  >
    {children}
    {/* Release Micro Glow Spike */}
    <motion.div 
        className="absolute inset-0 rounded-2xl bg-white opacity-0 pointer-events-none"
        whileTap={{ opacity: 0.1 }}
        transition={{ duration: 0.1 }}
    />
  </motion.button>
);


// --- Loading Skeleton ---

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  // Enhanced shimmer effect using CSS linear-gradient
  <div 
    className={`bg-[#1a1a1a] rounded-xl overflow-hidden relative ${className}`}
  >
     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '1000px 100%' }} />
  </div>
);

export const CardSkeleton: React.FC = () => (
  <GlassCard className="h-72 w-full p-0 border-white/5">
    <div className="h-40 w-full bg-[#1a1a1a] relative overflow-hidden">
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '1000px 100%' }} />
    </div>
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between mt-4">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  </GlassCard>
);
