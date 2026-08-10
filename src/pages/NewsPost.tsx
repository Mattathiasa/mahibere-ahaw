import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Church, Loader2, ArrowLeft, User as UserIcon, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { newsService, pickText, type NewsPost as Post } from '@/services/news';
import { optimized } from '@/services/cloudinary';
import { PublicChrome } from '@/components/home/PublicChrome';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

import { useFormatters } from '@/lib/formatters';
const NewsPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatDateLong } = useFormatters();
  const { theme } = useTheme();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    newsService.getBySlug(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const body = pickText(post?.body, language);

  // Combine cover image and images array into a unique list of photos
  const allPhotos: string[] = Array.from(
    new Set([
      ...(post?.coverImageUrl ? [post.coverImageUrl] : []),
      ...(post?.images ?? []),
    ].filter(Boolean))
  );

  const galleryPhotos = post?.images?.filter((url) => url !== post.coverImageUrl) ?? [];

  return (
    <PublicChrome backTo="/news">
      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-7 w-7 animate-spin text-[#2E5E99]" />
        </div>
      ) : !post || post.status !== 'published' ? (
        <div className="container mx-auto px-6 py-32 text-center space-y-4">
          <h1 className="text-3xl font-black">Post not found</h1>
          <p className="text-muted-foreground">
            This article may have been removed, or is not published yet.
          </p>
          <Button onClick={() => navigate('/news')} className="bg-[#2E5E99] hover:bg-[#204a7c]">
            <ArrowLeft className="h-4 w-4 mr-2" /> All news
          </Button>
        </div>
      ) : (
        <article className="container mx-auto px-6 py-12 sm:py-16 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center gap-3 flex-wrap text-[10px] font-black uppercase tracking-widest">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99]">
                <Church className="h-2.5 w-2.5" />
                {post.scope === 'atbiya'
                  ? (post.atbiyaName?.[language === 'am' ? 'am' : 'en'] || post.atbiyaName?.en || 'Parish')
                  : 'Head Office'}
              </span>
              {post.publishedAt && (
                <span className="inline-flex items-center gap-1.5 opacity-50">
                  <Calendar className="h-2.5 w-2.5" />
                  {formatDateLong(post.publishedAt)}
                </span>
              )}
              {post.authorName && (
                <span className="inline-flex items-center gap-1.5 opacity-50">
                  <UserIcon className="h-2.5 w-2.5" /> {post.authorName}
                </span>
              )}
              {allPhotos.length > 1 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                  <ImageIcon className="h-2.5 w-2.5" /> {allPhotos.length} Photos
                </span>
              )}
            </div>

            <h1 className={`text-4xl sm:text-5xl font-black font-ethiopic leading-tight ${
              theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
              {pickText(post.title, language)}
            </h1>

            {pickText(post.excerpt, language) && (
              <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">
                {pickText(post.excerpt, language)}
              </p>
            )}

            {/* Main Cover Image */}
            {post.coverImageUrl && (
              <div 
                className="relative cursor-pointer group rounded-[1.75rem] overflow-hidden shadow-2xl"
                onClick={() => {
                  const idx = allPhotos.indexOf(post.coverImageUrl!);
                  setActiveImageIndex(idx !== -1 ? idx : 0);
                }}
              >
                <img
                  src={optimized(post.coverImageUrl, 1400)}
                  alt=""
                  className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-md">
                    Click to view full image
                  </span>
                </div>
              </div>
            )}

            {/* Article Text Content */}
            <div className={`space-y-5 text-lg font-ethiopic leading-relaxed ${
              theme === 'dark' ? 'text-white/80' : 'text-[#0D2440]/80'}`}>
              {body
                ? body.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="whitespace-pre-line">{para}</p>
                  ))
                : <p className="italic opacity-60">This post has no content in the selected language.</p>}
            </div>

            {/* Article Photo Gallery */}
            {galleryPhotos.length > 0 && (
              <div className="pt-8 border-t border-[#2E5E99]/10 space-y-4">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-[#2E5E99]" />
                  <h3 className={`text-xl font-bold font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                    Photo Gallery ({galleryPhotos.length + (post.coverImageUrl ? 1 : 0)})
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {allPhotos.map((url, i) => (
                    <motion.div
                      key={url}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveImageIndex(i)}
                      className="cursor-pointer aspect-square rounded-2xl overflow-hidden shadow-md border border-[#2E5E99]/10 relative group"
                    >
                      <img
                        src={optimized(url, 500)}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-[#0D2440]/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white">
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-[#2E5E99]/10">
              <Button variant="outline" onClick={() => navigate('/news')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> All news
              </Button>
            </div>
          </motion.div>

          {/* Image Lightbox Modal */}
          <AnimatePresence>
            {activeImageIndex !== null && allPhotos[activeImageIndex] && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                onClick={() => setActiveImageIndex(null)}
              >
                <button
                  onClick={() => setActiveImageIndex(null)}
                  className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>

                {allPhotos.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev! === 0 ? allPhotos.length - 1 : prev! - 1));
                      }}
                      className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIndex((prev) => (prev! === allPhotos.length - 1 ? 0 : prev! + 1));
                      }}
                      className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={optimized(allPhotos[activeImageIndex], 1600)}
                    alt=""
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                    {activeImageIndex + 1} / {allPhotos.length}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </article>
      )}
    </PublicChrome>
  );
};

export default NewsPostPage;

