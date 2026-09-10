import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Images,
  LayoutGrid,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  Church,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { captionFor, type GalleryImage } from '@/services/gallery';
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
  const { language, t } = useLanguage();

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'showcase' | 'grid'>('showcase');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const total = images.length;

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
  const activeGalleryItem = galleryItems[activeIndex];
  const activeCaption = activeGalleryItem ? captionFor(activeGalleryItem, language) : null;

  const lightboxUrl = lightboxIndex !== null ? images[lightboxIndex] : null;
  const lightboxItem = lightboxIndex !== null ? galleryItems[lightboxIndex] : null;
  const lightboxCaption = lightboxItem ? captionFor(lightboxItem, language) : null;

  const isDark = theme === 'dark';

  return (
    <section
      id="gallery"
      className={`py-16 sm:py-24 relative overflow-hidden scroll-mt-24 sm:scroll-mt-28 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        {/* ── Section Header & View Mode Switcher ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-14 gap-6">
          <div className="space-y-4 max-w-2xl min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20"
            >
              <Church className="h-3 w-3 shrink-0" />
              {t.home.galleryBadge}
            </motion.div>
            <h2
              className={`text-3xl sm:text-4xl md:text-5xl font-black font-ethiopic break-words ${
                isDark ? 'text-white' : 'text-[#0D2440]'
              }`}
            >
              {t.home.galleryTitle}
            </h2>
            <p className="text-base sm:text-lg text-[#2E5E99] dark:text-[#7BA4D0] font-ethiopic leading-relaxed">
              {t.home.galleryDescription}
            </p>
          </div>

          {/* View Mode Toggle Pill */}
          <div className="flex items-center p-1 rounded-2xl bg-white/60 dark:bg-white/10 border border-[#2E5E99]/15 backdrop-blur-md shrink-0 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'showcase'
                  ? 'bg-[#2E5E99] text-white shadow-md'
                  : 'text-[#0D2440]/70 dark:text-white/70 hover:text-[#2E5E99]'
              }`}
              aria-label={t.home.galleryShowcase}
            >
              <Images className="h-3.5 w-3.5" />
              <span>{t.home.galleryShowcase}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#2E5E99] text-white shadow-md'
                  : 'text-[#0D2440]/70 dark:text-white/70 hover:text-[#2E5E99]'
              }`}
              aria-label={t.home.galleryGrid}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>{t.home.galleryGrid}</span>
            </button>
          </div>
        </div>

        {/* ── SHOWCASE MODE (Dual-Layer Ambient Stage) ── */}
        {viewMode === 'showcase' && (
          <div className="space-y-6">
            <div
              className="relative w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#2E5E99]/10 bg-slate-900/10 dark:bg-black/40 min-h-[460px] sm:min-h-[580px] lg:min-h-[660px] flex items-center justify-center"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Background Layer: Soft ambient glow using blurred image colors */}
              <AnimatePresence mode="sync">
                <motion.img
                  key={`bg-${activeUrl}`}
                  src={optimized(activeUrl, 400)}
                  alt=""
                  aria-hidden
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isDark ? 0.35 : 0.25 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full object-cover blur-3xl scale-125 pointer-events-none"
                />
              </AnimatePresence>

              {/* Foreground Layer: Uncropped photo (portrait or landscape) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`fg-${activeUrl}`}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 p-4 sm:p-8 flex items-center justify-center w-full h-full"
                >
                  <img
                    src={optimized(activeUrl, 1600)}
                    alt={activeCaption || `Gallery slide ${activeIndex + 1}`}
                    className="max-h-[380px] sm:max-h-[500px] lg:max-h-[580px] max-w-[92%] w-auto h-auto object-contain rounded-2xl shadow-2xl select-none cursor-pointer ring-1 ring-black/10 dark:ring-white/10"
                    onClick={() => setLightboxIndex(activeIndex)}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Floating Fullscreen Button */}
              <button
                type="button"
                onClick={() => setLightboxIndex(activeIndex)}
                aria-label={t.home.galleryOpenFullscreen}
                className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all shadow-lg hover:scale-105"
              >
                <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {/* Prev / Next Navigation Arrows */}
              {total > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label={t.home.galleryPrevious}
                    className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-white/80 dark:bg-black/50 text-[#0D2440] dark:text-white backdrop-blur-md shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label={t.home.galleryNext}
                    className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-white/80 dark:bg-black/50 text-[#0D2440] dark:text-white backdrop-blur-md shadow-xl hover:scale-110 active:scale-95 transition-all"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </>
              )}

              {/* Bottom Scrim & Caption */}
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pointer-events-none">
                <div className="max-w-2xl min-w-0">
                  {activeCaption ? (
                    <p className="text-white text-base sm:text-lg font-ethiopic drop-shadow-md">
                      {activeCaption}
                    </p>
                  ) : (
                    <p className="text-white/80 text-sm font-ethiopic">
                      {t.home.title}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <span className="px-3 py-1 rounded-full bg-black/40 text-white/90 border border-white/20 text-xs font-mono font-semibold backdrop-blur-md">
                    {activeIndex + 1} / {total}
                  </span>
                </div>
              </div>
            </div>

            {/* Thumbnail Navigation Strip */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-3 px-2 overflow-x-auto py-2">
                {images.map((url, i) => {
                  const isSelected = i === activeIndex;
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setActiveIndex(i)}
                      aria-label={`${t.home.gallerySlideCounter} ${i + 1}`}
                      className={`relative h-14 w-16 sm:h-16 sm:w-24 rounded-2xl overflow-hidden shrink-0 transition-all duration-300 border ${
                        isSelected
                          ? 'ring-2 ring-[#FABB2A] border-[#FABB2A] scale-105 shadow-xl opacity-100'
                          : 'opacity-50 hover:opacity-90 border-transparent hover:scale-102'
                      }`}
                    >
                      <img
                        src={optimized(url, 200)}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MOSAIC / MASONRY GRID MODE ── */}
        {viewMode === 'grid' && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 [column-fill:_balance]">
            {images.map((url, i) => {
              const item = galleryItems[i];
              const caption = item ? captionFor(item, language) : null;
              return (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 6) * 0.06 }}
                  onClick={() => setLightboxIndex(i)}
                  className="break-inside-avoid rounded-3xl overflow-hidden shadow-xl border border-[#2E5E99]/10 bg-white dark:bg-card/40 group relative cursor-pointer hover:shadow-2xl transition-all duration-500"
                >
                  <img
                    src={optimized(url, 900)}
                    alt={caption || `Gallery photo ${i + 1}`}
                    loading="lazy"
                    className="w-full h-auto object-cover rounded-3xl transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  {/* Subtle hover overlay with caption & expand icon */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D2440]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                    <div className="flex items-center justify-between w-full text-white gap-3">
                      <span className="text-sm font-ethiopic line-clamp-2">
                        {caption || `${t.home.gallerySlideCounter} ${i + 1}`}
                      </span>
                      <span className="p-2 rounded-full bg-white/20 backdrop-blur-md shrink-0">
                        <Maximize2 className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── IMMERSIVE FULLSCREEN LIGHTBOX MODAL ── */}
      <AnimatePresence>
        {lightboxIndex !== null && lightboxUrl && (
          <motion.div
            key="lightbox-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[300] bg-black/92 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 select-none"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Top Bar: Slide Counter & Close Button */}
            <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30 pointer-events-none">
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/20 text-xs font-mono font-medium backdrop-blur-md pointer-events-auto">
                {lightboxIndex + 1} / {total}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(null);
                }}
                aria-label={t.home.galleryClose}
                className="p-3 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all shadow-lg pointer-events-auto hover:rotate-90 duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Arrows */}
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i !== null ? (i - 1 + total) % total : null));
                  }}
                  aria-label={t.home.galleryPrevious}
                  className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md shadow-2xl transition-transform hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((i) => (i !== null ? (i + 1) % total : null));
                  }}
                  aria-label={t.home.galleryNext}
                  className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 p-3 sm:p-4 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md shadow-2xl transition-transform hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
              </>
            )}

            {/* Active Image (Uncropped, Full Aspect Ratio) */}
            <div
              className="relative max-w-[94vw] max-h-[82vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={`lightbox-img-${lightboxUrl}`}
                src={optimized(lightboxUrl, 2000)}
                alt={lightboxCaption || `Fullscreen photo ${lightboxIndex + 1}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3 }}
                className="max-w-[92vw] max-h-[78vh] w-auto h-auto object-contain rounded-2xl shadow-2xl ring-1 ring-white/15"
              />
            </div>

            {/* Bottom Caption in Lightbox */}
            {lightboxCaption && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 sm:bottom-8 max-w-2xl px-6 text-center z-30 pointer-events-none"
              >
                <p className="text-white/90 text-sm sm:text-base font-ethiopic drop-shadow-lg">
                  {lightboxCaption}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HomeGallery;
