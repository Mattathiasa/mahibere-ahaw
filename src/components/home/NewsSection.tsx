import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, ArrowRight, Church, Calendar } from 'lucide-react';
import { newsService, pickText, type NewsPost } from '@/services/news';
import { optimized } from '@/services/cloudinary';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * The homepage news feed: the newest post as a large lead story, the rest as a
 * compact list beside it.
 *
 * Renders nothing at all when there are no published posts, so the landing page
 * never shows an empty section. With exactly one post the lead runs full width
 * rather than leaving a gap where the list would be.
 */
export const NewsSection: React.FC<{ max?: number }> = ({ max = 4 }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    newsService.listPublished({ max })
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoaded(true));
  }, [max]);

  if (!loaded || posts.length === 0) return null;

  const [lead, ...rest] = posts;
  const cardBg = theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/5';
  const headingColor = theme === 'dark' ? 'text-white' : 'text-[#0D2440]';
  const bodyColor = theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/70';

  /** Parish or head-office attribution, shown on every card. */
  const source = (post: NewsPost) =>
    post.scope === 'atbiya'
      ? (post.atbiyaName?.[language === 'am' ? 'am' : 'en'] || post.atbiyaName?.en || 'Parish')
      : 'Head Office';

  const published = (post: NewsPost) =>
    post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric',
        })
      : null;

  return (
    <section id="news" className="py-24 sm:py-32 relative">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
              <Newspaper className="h-3 w-3" /> Latest
            </div>
            <h2 className={`text-4xl md:text-6xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
              News &amp; Updates
            </h2>
            <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">
              What is happening across the church and its parishes.
            </p>
          </div>
          <button onClick={() => navigate('/news')}
            className="flex items-center gap-2 text-[#2E5E99] font-bold hover:gap-3 transition-all shrink-0">
            See all news <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className={`grid gap-8 ${rest.length > 0 ? 'lg:grid-cols-3' : ''}`}>
          {/* ── Lead story ── */}
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => navigate(`/news/${lead.slug}`)}
            className={`group cursor-pointer rounded-[2rem] overflow-hidden shadow-xl border transition-all hover:-translate-y-1 hover:shadow-2xl ${cardBg} ${
              rest.length > 0 ? 'lg:col-span-2' : ''}`}
          >
            <div className={`overflow-hidden bg-[#2E5E99]/5 ${rest.length > 0 ? 'aspect-[16/9]' : 'aspect-[21/9]'}`}>
              {lead.coverImageUrl ? (
                <img
                  src={optimized(lead.coverImageUrl, 1400)}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Newspaper className="h-16 w-16 text-[#2E5E99]/20" />
                </div>
              )}
            </div>

            <div className="p-8 space-y-4">
              <div className="flex items-center gap-3 flex-wrap text-[10px] font-black uppercase tracking-widest">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99]">
                  <Church className="h-2.5 w-2.5" /> {source(lead)}
                </span>
                {published(lead) && (
                  <span className="inline-flex items-center gap-1.5 text-[#0D2440]/40 dark:text-white/40">
                    <Calendar className="h-2.5 w-2.5" /> {published(lead)}
                  </span>
                )}
              </div>

              <h3 className={`text-3xl md:text-4xl font-black font-ethiopic leading-tight ${headingColor}`}>
                {pickText(lead.title, language)}
              </h3>
              <p className={`text-lg font-ethiopic leading-relaxed line-clamp-3 ${bodyColor}`}>
                {pickText(lead.excerpt, language)}
              </p>
              <div className="flex items-center gap-2 text-[#2E5E99] font-bold pt-1">
                Read more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </motion.article>

          {/* ── The rest, as a compact list ── */}
          {rest.length > 0 && (
            <div className="flex flex-col gap-4">
              {rest.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i + 1) * 0.1 }}
                  viewport={{ once: true }}
                  onClick={() => navigate(`/news/${post.slug}`)}
                  className={`group cursor-pointer flex gap-4 p-4 rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${cardBg}`}
                >
                  <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#2E5E99]/5">
                    {post.coverImageUrl ? (
                      <img
                        src={optimized(post.coverImageUrl, 300)}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Newspaper className="h-6 w-6 text-[#2E5E99]/20" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap text-[9px] font-black uppercase tracking-widest">
                      <span className="inline-flex items-center gap-1 text-[#2E5E99]">
                        <Church className="h-2.5 w-2.5" /> {source(post)}
                      </span>
                      {published(post) && (
                        <span className="text-[#0D2440]/40 dark:text-white/40">{published(post)}</span>
                      )}
                    </div>
                    <h4 className={`font-bold font-ethiopic leading-snug line-clamp-3 ${headingColor}`}>
                      {pickText(post.title, language)}
                    </h4>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
