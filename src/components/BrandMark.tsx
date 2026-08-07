import React from 'react';
import logo from '@/assets/logo.png';

/**
 * The Mahibere Ahaw seal, framed so its detail survives.
 *
 * The logo is a dense circular seal — Amharic and English rim text, the cross,
 * the dove, the open Bible, the hands — none of which reads below roughly 48px.
 * It also has a light interior, so on a light page the seal's own black rim is
 * the only thing separating it from the background.
 *
 * So every instance gets the same treatment: a white disc backing, a thin gold
 * ring picked from the cross in the artwork, and a soft halo behind it. That
 * holds up on both the light (#E7F0FA) and dark (#0D2440) page backgrounds
 * without needing a per-theme variant.
 */

export type BrandMarkSize = 'sm' | 'md' | 'lg' | 'xl';

/** Box sizes are deliberately generous — see the note above about legibility. */
const SIZES: Record<BrandMarkSize, { box: string; pad: string; ring: string; halo: string }> = {
  sm: { box: 'h-10 w-10', pad: 'p-[3px]', ring: 'ring-1', halo: '-inset-1.5 blur-md' },
  md: { box: 'h-14 w-14 sm:h-16 sm:w-16', pad: 'p-1', ring: 'ring-2', halo: '-inset-2 blur-lg' },
  lg: { box: 'h-16 w-16', pad: 'p-1', ring: 'ring-2', halo: '-inset-2 blur-lg' },
  xl: { box: 'h-24 w-24 sm:h-32 sm:w-32', pad: 'p-1.5', ring: 'ring-2', halo: '-inset-4 blur-2xl' },
};

const WORDMARK_SIZES: Record<BrandMarkSize, { name: string; tagline: string }> = {
  sm: { name: 'text-base', tagline: 'text-[8px]' },
  md: { name: 'text-base sm:text-2xl', tagline: 'text-[8px] sm:text-[10px]' },
  lg: { name: 'text-2xl', tagline: 'text-[10px]' },
  xl: { name: 'text-3xl sm:text-4xl', tagline: 'text-[10px] sm:text-xs' },
};

interface BrandMarkProps {
  size?: BrandMarkSize;
  /** Render "MAHIBERE AHAW" beside the seal. */
  showWordmark?: boolean;
  /** The eyebrow under the wordmark. Pass `null` to drop it. */
  tagline?: string | null;
  /** Brightens the halo on hover — used where the mark sits in a hover group. */
  interactive?: boolean;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'md',
  showWordmark = false,
  tagline = 'Digital Ministry',
  interactive = false,
  className = '',
}) => {
  const s = SIZES[size];
  const w = WORDMARK_SIZES[size];

  const seal = (
    <span className="relative inline-flex shrink-0">
      <span
        aria-hidden
        className={`absolute ${s.halo} rounded-full bg-[#FABB2A]/30 ${
          interactive ? 'opacity-60 group-hover:opacity-100 transition-opacity duration-300' : 'opacity-60'
        }`}
      />
      <span
        className={`relative ${s.box} ${s.pad} rounded-full bg-white ${s.ring} ring-[#FABB2A]/60
          shadow-lg shadow-[#0D2440]/15`}
      >
        <img
          src={logo}
          alt="Mahibere Ahaw"
          className="h-full w-full rounded-full object-contain"
        />
      </span>
    </span>
  );

  if (!showWordmark) {
    return <span className={`inline-flex ${className}`}>{seal}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-3 sm:gap-4 ${className}`}>
      {seal}
      <span className="flex flex-col">
        <span
          className={`${w.name} font-black tracking-tighter leading-none bg-gradient-to-r
            from-[#2E5E99] to-[#7BA4D0] bg-clip-text text-transparent`}
        >
          MAHIBERE AHAW
        </span>
        {tagline && (
          <span
            className={`${w.tagline} uppercase font-bold tracking-[0.25em] mt-1
              text-[#2E5E99]/70 dark:text-[#7BA4D0]/80`}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
};

export default BrandMark;
