import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, ArrowLeft } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_ENDONYM, nextLanguage } from '@/i18n/languages';
import { Button } from '@/pages/home-components/Button';

/**
 * Shared header/footer for the public news pages, so they match the landing
 * page without duplicating its 400-line markup.
 */
export const PublicChrome: React.FC<{ children: React.ReactNode; backTo?: string }> = ({
  children, backTo = '/',
}) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const cycleLanguage = () =>
    setLanguage(nextLanguage(language));

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${
      theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
      <motion.nav initial={{ y: -60 }} animate={{ y: 0 }}
        className={`sticky top-0 z-50 backdrop-blur-2xl border-b border-[#2E5E99]/10 ${
          theme === 'dark' ? 'bg-[#0D2440]/85' : 'bg-[#E7F0FA]/85'}`}>
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
            <BrandMark size="sm" interactive />
            <span className="text-base sm:text-xl font-black tracking-tighter bg-gradient-to-r from-[#2E5E99] to-[#7BA4D0] bg-clip-text text-transparent">
              MAHIBERE AHAW
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate(backTo)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-[#2E5E99] hover:bg-[#2E5E99]/10 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors">
              {theme === 'light' ? <Moon className="h-4 w-4 text-[#2E5E99]" /> : <Sun className="h-4 w-4 text-[#7BA4D0]" />}
            </button>
            <button onClick={cycleLanguage}
              className="px-3 py-2 rounded-xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors font-bold text-xs text-[#2E5E99]">
              {LANGUAGE_ENDONYM[language]}
            </button>
            <Button onClick={() => navigate('/login')}
              className="bg-[#2E5E99] hover:bg-[#204a7c] px-4 sm:px-6 py-2 text-xs sm:text-sm rounded-xl">
              {t.nav.login}
            </Button>
          </div>
        </div>
      </motion.nav>

      <main className="flex-1">{children}</main>

      <footer className={`border-t border-[#2E5E99]/10 py-8 ${theme === 'dark' ? 'bg-[#0D2440]/90' : 'bg-white'}`}>
        <div className="container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs uppercase tracking-[0.2em] font-bold">
          <span className={theme === 'dark' ? 'text-white/30' : 'text-[#0D2440]/30'}>
            © {new Date().getFullYear()} Mahibere Ahaw
          </span>
          <div className="flex gap-6">
            <button onClick={() => navigate('/')} className="text-[#2E5E99] hover:underline">{t.nav.home}</button>
            <button onClick={() => navigate('/news')} className="text-[#2E5E99] hover:underline">{t.nav.news}</button>
            <button onClick={() => navigate('/signup')} className="text-[#2E5E99] hover:underline">{t.common.joinNav}</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
