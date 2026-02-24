
import React, { useState, useEffect } from 'react';

interface IOSGlassImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

export const IOSGlassImage: React.FC<IOSGlassImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
}) => {
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    // Detect Safari for specific backdrop fixes
    const userAgent = navigator.userAgent;
    const safari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    setIsSafari(safari);
  }, []);

  useEffect(() => {
    if (isError) {
      // iOS-specific image reload fix: try to reset error state after a delay
      const timer = setTimeout(() => {
        setIsError(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isError]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* iOS-optimized glass background layer */}
      <div className={`absolute inset-0 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/5 ${isSafari ? 'ios-backdrop' : ''}`} />
      
      {/* Image container with iOS-style shadow */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        {!isError ? (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setIsError(true);
              setIsLoaded(false);
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-emerald-900/40 flex flex-col items-center justify-center p-4 backdrop-blur-md">
            <div className="mb-2 p-3 rounded-full bg-white/5 border border-white/10 shadow-lg">
                <span className="material-symbols-outlined text-3xl text-white/70">auto_awesome</span>
            </div>
            <h3 className="text-white text-base font-bold text-center">Hidden Gem</h3>
            <p className="text-gray-300 text-[10px] text-center mt-1 max-w-[80%] leading-tight">
              {alt} is a secret location
            </p>
            <button 
              onClick={() => setIsError(false)}
              className="mt-3 px-3 py-1.5 bg-white/10 rounded-lg border border-white/10 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-white/20 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Retry
            </button>
          </div>
        )}
        
        {/* Shimmer Loading Skeleton */}
        {!isLoaded && !isError && (
          <div className="absolute inset-0 bg-[#1a1a1a]">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>
        )}
      </div>
      
      {/* iOS-style sleek border overlay (pointer-events-none) */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]" />
    </div>
  );
};
