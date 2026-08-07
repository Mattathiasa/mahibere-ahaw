import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { BrandMark } from '@/components/BrandMark';

/**
 * The loading screen shown while a route chunk or the Firestore-backed page
 * content resolves.
 *
 * Two variants, because the app has two visual worlds:
 *   'brand' — the public site, on the same #0D2440 / #E7F0FA backgrounds the
 *             landing page uses, so the hand-off to the real page is seamless.
 *   'app'   — the dashboard and admin routes, on the shadcn theme tokens.
 *
 * Every animation carries `motion-reduce:animate-none`; with reduced motion the
 * screen still shows the seal and the message, just still.
 */

interface BrandedLoaderProps {
  variant?: 'brand' | 'app';
  /** Replaces the default "Loading" line. */
  message?: string;
}

export const BrandedLoader: React.FC<BrandedLoaderProps> = ({
  variant = 'brand',
  message,
}) => {
  const { theme } = useTheme();
  const isBrand = variant === 'brand';

  /**
   * 'brand' owns the viewport — it stands in for a whole public page, and the
   * landing page paints a WebGL backdrop that has to be covered.
   *
   * 'app' deliberately does not: most of its uses are a suspended route inside
   * DashboardLayout, where a fixed overlay would black out the sidebar and
   * header on every navigation. It fills the content area instead.
   */
  const frame = isBrand
    ? `fixed inset-0 z-[200] ${theme === 'dark' ? 'bg-[#0D2440]' : 'bg-[#E7F0FA]'}`
    : 'w-full min-h-[70vh] bg-background';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-8 px-6 ${frame}`}
    >
      {/* Seal, inside a gold arc that sweeps around it. The arc is a conic
          gradient masked down to a ring so it reads as an orbit, not a disc. */}
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className="absolute -inset-5 sm:-inset-6 rounded-full animate-spin [animation-duration:2.8s] motion-reduce:animate-none"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 0deg, transparent 200deg, rgba(250,187,42,0.35) 290deg, #FABB2A 355deg, transparent 360deg)',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
          }}
        />
        <BrandMark size="xl" />
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-2xl sm:text-3xl font-black tracking-tighter leading-none bg-gradient-to-r from-[#2E5E99] to-[#7BA4D0] bg-clip-text text-transparent">
          MAHIBERE AHAW
        </span>
        <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#2E5E99]/70 dark:text-[#7BA4D0]/80">
          Digital Ministry
        </span>
      </div>

      {/* Indeterminate bar — there is no real progress figure to show. */}
      <div className="w-44 sm:w-56 h-1 rounded-full overflow-hidden bg-[#2E5E99]/10">
        <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#2E5E99] via-[#FABB2A] to-[#7BA4D0] animate-loader-sweep motion-reduce:animate-none motion-reduce:w-full" />
      </div>

      <span className="sr-only">{message ?? 'Loading'}</span>
      {message && (
        <p className="text-sm font-ethiopic text-[#2E5E99]/70 dark:text-[#7BA4D0]/70 -mt-4">
          {message}
        </p>
      )}
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
