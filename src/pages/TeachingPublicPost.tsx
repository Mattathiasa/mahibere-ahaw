import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Loader2, ArrowLeft, User as UserIcon, Mic2 } from 'lucide-react';
import { teachingService } from '@/services/teachings';
import { optimized } from '@/services/cloudinary';
import { PublicChrome } from '@/components/home/PublicChrome';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { useFormatters } from '@/lib/formatters';

/** Public read page for a single published teaching. Mirrors NewsPost. */
const TeachingPublicPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tree } = useLanguage();
  const pg = tree.pages;
  const { formatDateLong } = useFormatters();
  const { theme } = useTheme();

  const [teaching, setTeaching] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    teachingService.getTeachingById(id)
      .then(setTeaching)
      .catch(() => setTeaching(null))
      .finally(() => setLoading(false));
  }, [id]);

  const body: string = teaching?.fullContent || teaching?.transcript || teaching?.shortDescription || '';

  return (
    <PublicChrome backTo="/teachings/browse">
      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-7 w-7 animate-spin text-[#2E5E99]" />
        </div>
      ) : !teaching || teaching.status !== 'Published' ? (
        <div className="container mx-auto px-6 py-32 text-center space-y-4">
          <h1 className="text-3xl font-black">{pg.noTeachings}</h1>
          <p className="text-muted-foreground">{pg.noTeachingsHint}</p>
          <Button onClick={() => navigate('/teachings/browse')} className="bg-[#2E5E99] hover:bg-[#204a7c]">
            <ArrowLeft className="h-4 w-4 mr-2" /> {tree.nav.teachings}
          </Button>
        </div>
      ) : (
        <article className="container mx-auto px-6 py-12 sm:py-16 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-center gap-3 flex-wrap text-[10px] font-black uppercase tracking-widest">
              {teaching.speaker && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99]">
                  <UserIcon className="h-2.5 w-2.5" /> {teaching.speaker}
                </span>
              )}
              {teaching.serviceType && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99]">
                  <Mic2 className="h-2.5 w-2.5" /> {teaching.serviceType}
                </span>
              )}
              {teaching.dateDelivered && (
                <span className="inline-flex items-center gap-1.5 opacity-50">
                  <Calendar className="h-2.5 w-2.5" /> {formatDateLong(teaching.dateDelivered)}
                </span>
              )}
            </div>

            <h1 className={`text-4xl sm:text-5xl font-black font-ethiopic leading-tight ${
              theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
              {teaching.title}
            </h1>

            {teaching.shortDescription && (
              <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">
                {teaching.shortDescription}
              </p>
            )}

            {teaching.featuredImage && (
              <div className="rounded-[1.75rem] overflow-hidden shadow-2xl">
                <img src={optimized(teaching.featuredImage, 1400)} alt=""
                  className="w-full aspect-video object-cover" />
              </div>
            )}

            <div className={`space-y-5 text-lg font-ethiopic leading-relaxed ${
              theme === 'dark' ? 'text-white/80' : 'text-[#0D2440]/80'}`}>
              {body
                ? body.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="whitespace-pre-line">{para}</p>
                  ))
                : <p className="italic opacity-60">{pg.noTeachingsHint}</p>}
            </div>

            <div className="pt-8 border-t border-[#2E5E99]/10">
              <Button variant="outline" onClick={() => navigate('/teachings/browse')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> {tree.nav.teachings}
              </Button>
            </div>
          </motion.div>
        </article>
      )}
    </PublicChrome>
  );
};

export default TeachingPublicPost;
