import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Rows3,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { type GalleryImage } from '@/services/gallery';
import { optimized } from '@/services/cloudinary';

interface HomeGalleryProps {
  images: string[];
  galleryItems?: GalleryImage[];
  className?: string;
}

export const HomeGallery: React.FC<HomeGalleryProps> = ({
  images,
  galleryItems = [],
  className = '',
}) => {
  const { theme } = useTheme();

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'showcase' | 'grid'>('grid');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const isDark = theme === 'dark';

  const total = images.length;

  /** Returns the inline style needed to visually rotate a photo when not handled by Cloudinary. */
  function rotStyle(index: number): React.CSSProperties | undefined {
    const url = images[index];
    if (url && url.includes('/upload/')) return undefined;
    const deg = galleryItems[index]?.rotation ?? 0;
    if (!deg) return undefined;
    // For 90/270° we also shrink the image slightly so it stays within its
    // container when the axes are swapped.
    const scale = deg === 90 || deg === 270 ? 0.75 : 1;
    return { transform: `rotate(${deg}deg) scale(${scale})` };
  }

  const nextSlide = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance showcase slides every 5s when not hovered or in lightbox
  useEffect(() => {
    if (viewMode !== 'showcase' || total < 2 || isPaused || lightboxIndex !== null) {
      return;
    }
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [viewMode, total, isPaused, lightboxIndex, nextSlide]);

  // Keyboard navigation for showcase mode when lightbox is closed
  useEffect(() => {
    if (viewMode !== 'showcase' || total < 2 || lightboxIndex !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, total, lightboxIndex, nextSlide, prevSlide]);

  // Keyboard controls for the Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowRight') setLightboxIndex((i) => (i !== null ? (i + 1) % total : null));
      if (e.key === 'ArrowLeft') setLightboxIndex((i) => (i !== null ? (i - 1 + total) % total : null));
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxIndex, total]);

  if (total === 0) return null;

  const activeUrl = images[activeIndex];
  const lightboxUrl = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <section
      id="gallery"
      className={`py-10 sm:py-16 relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6">

        {/* ── View mode toggle: icon-only pill, top-right ── */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <div className={`flex items-center gap-1 p-1 rounded-xl border backdrop-blur-md ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white/70 border-black/8'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-[#2E5E99] text-white shadow-md'
                  : isDark ? 'text-white/50 hover:text-white/80' : 'text-black/40 hover:text-black/70'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              aria-label="Showcase view"
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'showcase'
                  ? 'bg-[#2E5E99] text-white shadow-md'
                  : isDark ? 'text-white/50 hover:text-white/80' : 'text-black/40 hover:text-black/70'
              }`}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── SHOWCASE MODE ── */}
        {viewMode === 'showcase' && (
          <div className="space-y-3">
            {/* Main stage */}
            <div
              className={`relative w-full rounded-3xl overflow-hidden shadow-xl border min-h-[400px] sm:min-h-[520px] lg:min-h-[620px] flex items-center justify-center ${
                isDark ? 'border-white/8 bg-black/40' : 'border-black/5 bg-slate-100/60'
              }`}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Blurred ambient background */}
              <AnimatePresence mode="sync">
                <motion.img
                  key={`bg-${activeUrl}`}
                  src={optimized(activeUrl, 300, galleryItems[activeIndex]?.rotation)}
                  alt=""
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isDark ? 0.4 : 0.3 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 w-full h-full object-cover blur-3xl scale-110 pointer-events-none"
                />
              </AnimatePresence>

              {/* Foreground photo — uncropped, natural aspect ratio */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`fg-${activeUrl}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 p-6 sm:p-10 flex items-center justify-center w-full h-full select-none"
                >
                  <img
                    src={optimized(activeUrl, 1600, galleryItems[activeIndex]?.rotation)}
                    alt=""
                    style={rotStyle(activeIndex)}
                    className="max-h-[360px] sm:max-h-[460px] lg:max-h-[540px] max-w-full w-auto h-auto object-contain rounded-2xl shadow-2xl select-none cursor-zoom-in ring-1 ring-black/10 dark:ring-white/10 transition-transform duration-300 hover:scale-[1.01]"
                    onClick={() => setLightboxIndex(activeIndex)}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dot navigation */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-1.5 py-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Go to photo ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? 'w-6 h-1.5 bg-[#2E5E99]'
                        : isDark
                          ? 'w-1.5 h-1.5 bg-white/25 hover:bg-white/50'
                          : 'w-1.5 h-1.5 bg-black/20 hover:bg-black/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MASONRY GRID MODE ── */}
        {viewMode === 'grid' && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4 [column-fill:_balance]">
            {images.map((url, i) => (
              <motion.button
                key={url}
                type="button"
                onClick={() => setLightboxIndex(i)}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 6) * 0.05 }}
                className="break-inside-avoid w-full block rounded-2xl overflow-hidden group relative cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E5E99]"
                aria-label={`Open photo ${i + 1}`}
              >
                <img
                  src={optimized(url, 900, galleryItems[i]?.rotation)}
                  alt=""
                  loading="lazy"
                  style={rotStyle(i)}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {/* Subtle dim on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 rounded-2xl" />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ── FULLSCREEN LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxUrl && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
              aria-label="Close"
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all hover:rotate-90 duration-200 shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Arrows */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i !== null ? (i - 1 + total) % total : null)); }}
                  aria-label="Previous"
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i !== null ? (i + 1) % total : null)); }}
                  aria-label="Next"
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7" />
                </button>
              </>
            )}

            {/* Photo */}
            <div
              className="relative max-w-[94vw] max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={`lb-${lightboxUrl}`}
                  src={optimized(lightboxUrl, 2000, lightboxIndex !== null ? galleryItems[lightboxIndex]?.rotation : undefined)}
                  alt=""
                  style={lightboxIndex !== null ? rotStyle(lightboxIndex) : undefined}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
                />
              </AnimatePresence>
            </div>

            {/* Dot strip */}
            {total > 1 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    aria-label={`Photo ${i + 1}`}
                    className={`rounded-full transition-all duration-300 ${
                      i === lightboxIndex
                        ? 'w-5 h-1.5 bg-white'
                        : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HomeGallery;
