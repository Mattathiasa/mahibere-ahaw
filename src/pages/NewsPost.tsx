import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Church, Loader2, ArrowLeft, User as UserIcon } from 'lucide-react';
import { newsService, pickText, type NewsPost as Post } from '@/services/news';
import { optimized } from '@/services/cloudinary';
import { PublicChrome } from '@/components/home/PublicChrome';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

const NewsPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { theme } = useTheme();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    newsService.getBySlug(slug)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const body = pickText(post?.body, language);

  return (
    <PublicChrome backTo="/news">
      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="h-7 w-7 animate-spin text-[#2E5E99]" />
        </div>
      ) : !post || post.status !== 'published' ? (
        // A draft resolves to null for anonymous visitors (the rules deny the
        // read), so both cases land here.
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                  {new Date(post.publishedAt).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </span>
              )}
              {post.authorName && (
                <span className="inline-flex items-center gap-1.5 opacity-50">
                  <UserIcon className="h-2.5 w-2.5" /> {post.authorName}
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

            {post.coverImageUrl && (
              <img
                src={optimized(post.coverImageUrl, 1400)}
                alt=""
                className="w-full rounded-[1.75rem] shadow-2xl aspect-video object-cover"
              />
            )}

            {/* Plain text with blank-line paragraphs — no HTML is rendered, so
                a post can never inject markup into the public site. */}
            <div className={`space-y-5 text-lg font-ethiopic leading-relaxed ${
              theme === 'dark' ? 'text-white/80' : 'text-[#0D2440]/80'}`}>
              {body
                ? body.split(/\n{2,}/).map((para, i) => (
                    <p key={i} className="whitespace-pre-line">{para}</p>
                  ))
                : <p className="italic opacity-60">This post has no content in the selected language.</p>}
            </div>

            <div className="pt-8 border-t border-[#2E5E99]/10">
              <Button variant="outline" onClick={() => navigate('/news')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> All news
              </Button>
            </div>
          </motion.div>
        </article>
      )}
    </PublicChrome>
  );
};

export default NewsPostPage;
