import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { teachingService, resolveTeachingField } from '@/services/teachings';
import { optimized } from '@/services/cloudinary';
import { PublicChrome } from '@/components/home/PublicChrome';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLandingContent } from '@/hooks/useLandingContent';
import { Input } from '@/components/ui/input';
import { useFormatters } from '@/lib/formatters';

/** Public archive of published teachings. Mirrors NewsIndex; the header text
 *  comes from the same landing-content `teachings` block as the homepage. */
const TeachingsPublic: React.FC = () => {
  const navigate = useNavigate();
  const { t: tree, language } = useLanguage();
  const pg = tree.pages;
  const { formatDate } = useFormatters();
  const { theme } = useTheme();
  const { content } = useLandingContent();
  const cfg = content.teachings;

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    teachingService.listPublished({ max: 60 })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => items.filter((it) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [
      resolveTeachingField(it, 'title', language),
      resolveTeachingField(it, 'shortDescription', language),
      it.speaker,
    ].join(' ').toLowerCase().includes(q);
  }), [items, search, language]);

  return (
    <PublicChrome>
      <div className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
            <BookOpen className="h-3 w-3" /> {cfg.badge}
          </div>
          <h1 className={`text-5xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
            {cfg.sectionTitle}
          </h1>
          <p className="text-lg text-[#2E5E99] font-ethiopic max-w-2xl">
            {cfg.sectionDescription}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-8">
          <Input placeholder={tree.nav.teachings} value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-10 max-w-xs ml-auto rounded-xl" />
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-[#2E5E99]" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-24">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-bold">{cfg.emptyTitle}</p>
            <p className="text-muted-foreground">{cfg.emptyDescription}</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((it, i) => (
              <motion.article key={it.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.06 }}
                onClick={() => navigate(`/teachings/view/${it.id}`)}
                className={`group cursor-pointer rounded-[1.75rem] overflow-hidden shadow-lg border transition-all hover:-translate-y-1 hover:shadow-2xl ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/5'}`}>
                <div className="aspect-video overflow-hidden bg-[#2E5E99]/5">
                  {it.featuredImage ? (
                    <img src={optimized(it.featuredImage, 700)} alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-[#2E5E99]/20" />
                    </div>
                  )}
                </div>
                <div className="p-6 space-y-2.5">
                  <div className="flex items-center gap-2 flex-wrap text-[10px] font-black uppercase tracking-widest">
                    {it.speaker && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2E5E99]/10 text-[#2E5E99]">
                        <User className="h-2.5 w-2.5" /> {it.speaker}
                      </span>
                    )}
                    {it.dateDelivered && (
                      <span className="inline-flex items-center gap-1.5 opacity-50">
                        <Calendar className="h-2.5 w-2.5" /> {formatDate(it.dateDelivered)}
                      </span>
                    )}
                  </div>
                  <h2 className={`text-xl font-bold font-ethiopic leading-tight ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                    {resolveTeachingField(it, 'title', language)}
                  </h2>
                  <p className={`text-sm font-ethiopic leading-relaxed line-clamp-3 ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/70'}`}>
                    {resolveTeachingField(it, 'shortDescription', language)}
                  </p>
                  <div className="flex items-center gap-2 text-[#2E5E99] font-bold text-sm pt-1">
                    {cfg.readMoreLabel} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1.5" />
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

export default TeachingsPublic;
