import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, Church, ArrowRight, Loader2 } from 'lucide-react';
import { newsService, pickText, type NewsPost } from '@/services/news';
import { optimized } from '@/services/cloudinary';
import { PublicChrome } from '@/components/home/PublicChrome';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';

import { useFormatters } from '@/lib/formatters';
const NewsIndex: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatDate } = useFormatters();
  const { theme } = useTheme();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<'all' | 'global' | 'atbiya'>('all');

  useEffect(() => {
    newsService.listPublished({ max: 60 })
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => posts.filter((p) => {
    if (source !== 'all' && p.scope !== source) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [pickText(p.title, language), pickText(p.excerpt, language), p.atbiyaName?.en]
      .join(' ').toLowerCase().includes(q);
  }), [posts, search, source, language]);

  return (
    <PublicChrome>
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
            <Newspaper className="h-3 w-3" /> News
          </div>
          <h1 className={`text-5xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
            News &amp; Updates
          </h1>
          <p className="text-lg text-[#2E5E99] font-ethiopic max-w-2xl">
            Announcements from the head office and from congregations across the church.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-8">
          {([['all', 'All'], ['global', 'Head office'], ['atbiya', 'Parishes']] as const).map(([v, label]) => (
            <button key={v} onClick={() => setSource(v)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-colors ${
                source === v
                  ? 'bg-[#2E5E99] text-white border-[#2E5E99]'
                  : 'border-[#2E5E99]/20 text-[#2E5E99] hover:border-[#2E5E99]/50'}`}>
              {label}
            </button>
          ))}
          <Input placeholder="Search news…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-10 max-w-xs ml-auto rounded-xl" />
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-[#2E5E99]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-24">
            <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-bold">
              {posts.length === 0 ? 'No news published yet' : 'Nothing matches your search'}
            </p>
            <p className="text-muted-foreground">
              {posts.length === 0 ? 'Please check back soon.' : 'Try a different word or filter.'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((post, i) => (
              <motion.article key={post.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.06 }}
                onClick={() => navigate(`/news/${post.slug}`)}
                className={`group cursor-pointer rounded-[1.75rem] overflow-hidden shadow-lg border transition-all hover:-translate-y-1 hover:shadow-2xl ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/5'}`}>
                <div className="aspect-video overflow-hidden bg-[#2E5E99]/5">
                  {post.coverImageUrl ? (
                    <img src={optimized(post.coverImageUrl, 700)} alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Newspaper className="h-10 w-10 text-[#2E5E99]/20" />
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-black uppercase tracking-widest">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2E5E99]/10 text-[#2E5E99]">
                      <Church className="h-2.5 w-2.5" />
                      {post.scope === 'atbiya'
                        ? (post.atbiyaName?.[language === 'am' ? 'am' : 'en'] || post.atbiyaName?.en || 'Parish')
                        : 'Head Office'}
                    </span>
                    {post.publishedAt && (
                      <span className="inline-flex items-center gap-1.5 opacity-50">
                        <Calendar className="h-2.5 w-2.5" />
                        {formatDate(post.publishedAt)}
                      </span>
                    )}
                    {(post.images?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
                        📷 {post.images!.length}
                      </span>
                    )}
                  </div>
                  <h2 className={`text-xl font-bold font-ethiopic leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                    {pickText(post.title, language)}
                  </h2>
                  <p className={`text-sm font-ethiopic leading-relaxed line-clamp-3 ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/70'}`}>
                    {pickText(post.excerpt, language)}
                  </p>
                  <div className="flex items-center gap-2 text-[#2E5E99] font-bold text-sm pt-1">
                    Read more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </PublicChrome>
  );
};

export default NewsIndex;
