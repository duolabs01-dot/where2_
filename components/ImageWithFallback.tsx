import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ 
  src, 
  alt, 
  className = '', 
  fill = false 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset states when source changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-gray-900 ${className} ${fill ? 'absolute inset-0 w-full h-full' : 'w-full h-full'}`}>
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className={`transition-all duration-700 ease-in-out ${fill ? 'w-full h-full object-cover' : ''} ${
            isLoading ? 'opacity-0 scale-105 blur-sm' : 'opacity-100 scale-100 blur-0'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
              setHasError(true);
              setIsLoading(false);
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 text-gray-500 p-4 text-center">
           <span className="material-symbols-outlined text-3xl opacity-50 mb-2">broken_image</span>
           <span className="text-[10px] opacity-40">Image unavailable</span>
        </div>
      )}
      
      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};
