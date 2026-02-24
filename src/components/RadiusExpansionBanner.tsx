
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface RadiusExpansionBannerProps {
  expandedLabel: string | null;
  baseRadius: number;
  onReset?: () => void;
}

export const RadiusExpansionBanner: React.FC<RadiusExpansionBannerProps> = ({ 
  expandedLabel,
  baseRadius,
  onReset
}) => {
  const [visible, setVisible] = useState(false);
  const [historyLabel, setHistoryLabel] = useState<string | null>(null);

  useEffect(() => {
    if (expandedLabel) {
      setHistoryLabel(expandedLabel);
      setVisible(true);
      
      // Auto-hide after 2.5s
      const timer = setTimeout(() => {
        setVisible(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    } else {
        setVisible(false);
        setHistoryLabel(null);
    }
  }, [expandedLabel]);

  // If no expansion ever happened, show nothing
  if (!historyLabel && !visible) return null;

  return (
    <div className="relative z-20">
        <AnimatePresence mode="wait">
            {visible ? (
                <motion.div
                    key="banner"
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 overflow-hidden shadow-neon"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 animate-pulse">
                            <span className="material-symbols-outlined text-primary text-lg">radar</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-primary text-xs uppercase tracking-wide">
                                Searching...
                            </p>
                            <p className="text-white text-xs leading-snug">
                                {historyLabel === 'Nothing open nearby' 
                                    ? "Nothing open nearby — showing places opening soon."
                                    : <>Expanded search to <span className="font-bold text-white">{historyLabel}</span></>
                                }
                            </p>
                        </div>
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    </div>
  );
};
