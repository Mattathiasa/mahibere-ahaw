import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, ArrowRight, Church, Calendar } from 'lucide-react';
import { newsService, pickText, type NewsPost } from '@/services/news';
import { optimized } from '@/services/cloudinary';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * The homepage news feed. Renders nothing at all when there are no published
 * posts, so the landing page never shows an empty section.
 */
export const NewsSection: React.FC<{ max?: number }> = ({ max = 3 }) => {
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

        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              onClick={() => navigate(`/news/${post.slug}`)}
              className={`group cursor-pointer rounded-[2rem] overflow-hidden shadow-xl border transition-all hover:-translate-y-1 hover:shadow-2xl ${
                theme === 'dark'
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-[#2E5E99]/5'}`}
            >
              <div className="aspect-video overflow-hidden bg-[#2E5E99]/5">
                {post.coverImageUrl ? (
                  <img
                    src={optimized(post.coverImageUrl, 800)}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper className="h-12 w-12 text-[#2E5E99]/20" />
                  </div>
                )}
              </div>

              <div className="p-7 space-y-3">
                <div className="flex items-center gap-3 flex-wrap text-[10px] font-black uppercase tracking-widest">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99]">
                    <Church className="h-2.5 w-2.5" />
                    {post.scope === 'atbiya'
                      ? (post.atbiyaName?.[language === 'am' ? 'am' : 'en'] || post.atbiyaName?.en || 'Parish')
                      : 'Head Office'}
                  </span>
                  {post.publishedAt && (
                    <span className="inline-flex items-center gap-1.5 text-[#0D2440]/40 dark:text-white/40">
                      <Calendar className="h-2.5 w-2.5" />
                      {new Date(post.publishedAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </span>
                  )}
                </div>

                <h3 className={`text-2xl font-bold font-ethiopic leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                  {pickText(post.title, language)}
                </h3>
                <p className={`font-ethiopic leading-relaxed line-clamp-3 ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/70'}`}>
                  {pickText(post.excerpt, language)}
                </p>
                <div className="flex items-center gap-2 text-[#2E5E99] font-bold pt-1">
                  Read more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
