import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import logo from '@/assets/logo.png';

/**
 * A minimalist, natural welcome screen featuring the Mahibere Ahaw emblem.
 *
 * Two variants:
 *   'brand' — the public site welcome screen, matching the #0D2440 / #E7F0FA
 *             palettes so the hand-off to the page is completely seamless.
 *   'app'   — the dashboard and admin route transitions, quiet and unobtrusive
 *             on shadcn theme tokens.
 *
 * Designed with natural breathing ambient lighting rather than artificial spinners.
 * Respects `motion-reduce:animate-none`.
 */

interface BrandedLoaderProps {
  variant?: 'brand' | 'app';
  /** Replaces the default welcome / status line. */
  message?: string;
}

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  variant = 'brand',
  message,
}) => {
  const { theme } = useTheme();
  const isBrand = variant === 'brand';

  if (!isBrand) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 bg-background text-foreground select-none"
      >
        <div className="relative flex items-center justify-center">
          <div
            aria-hidden
            className="absolute -inset-2 rounded-full bg-[#FABB2A]/20 blur-md animate-pulse"
          />
          <div className="relative h-12 w-12 rounded-full bg-white dark:bg-card p-1 ring-1 ring-[#FABB2A]/30 shadow-md">
            <img
              src={logo}
              alt="Mahibere Ahaw"
              className="h-full w-full rounded-full object-contain pointer-events-none"
            />
          </div>
        </div>
        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase font-ethiopic">
          {message ?? 'Loading…'}
        </span>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const bgStyle = isDark
    ? 'bg-[#0D2440] text-white'
    : 'bg-[#E7F0FA] text-[#0D2440]';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 px-6 select-none transition-colors duration-500 ${bgStyle}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Soft, natural breathing ambient aura */}
        <motion.div
          aria-hidden
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.3, 0.65, 0.3],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -inset-6 sm:-inset-8 rounded-full bg-[#FABB2A]/25 blur-2xl motion-reduce:hidden"
        />

        {/* Pristine circular emblem disc */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full bg-white p-2 sm:p-2.5 ring-1 ring-[#FABB2A]/40 shadow-2xl shadow-[#0D2440]/10 dark:shadow-black/50"
        >
          <img
            src={logo}
            alt="Mahibere Ahaw"
            className="h-full w-full rounded-full object-contain pointer-events-none"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-1.5 text-center max-w-sm"
      >
        <span className="text-base sm:text-lg font-bold tracking-[0.2em] uppercase text-[#2E5E99] dark:text-[#7BA4D0]">
          MAHIBERE AHAW
        </span>
        <span className="text-xs sm:text-sm font-medium font-ethiopic text-[#2E5E99]/70 dark:text-[#7BA4D0]/80">
          {message ?? 'እንኳን ደህና መጡ • Welcome'}
        </span>
      </motion.div>
    </div>
  );
};

/**
 * The in-page counterpart, for a section that is still filling in while the
 * rest of the page is already usable.
 */
export const InlineLoader: React.FC<{ label?: string; className?: string }> = ({
  label,
  className = '',
}) => (
  <div
    role="status"
    aria-live="polite"
    className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}
  >
    <Loader2 className="h-7 w-7 animate-spin motion-reduce:animate-none text-[#2E5E99]" />
    <span className={label ? 'text-sm font-ethiopic text-[#2E5E99]/70' : 'sr-only'}>
      {label ?? 'Loading'}
    </span>
  </div>
);

export default BrandedLoader;
