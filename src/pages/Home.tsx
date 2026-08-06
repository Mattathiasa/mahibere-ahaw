import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, BarChart3, Sun, Moon,
  Languages, Mail, MapPin, CheckCircle2, Sparkles, Menu, X,
  ArrowRight, Heart, Calendar, MessageSquare, Bell, Shield, Youtube, Send, Phone,
  Clock, Globe, Church, Facebook, Music2, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from './home-components/Button';
import { Card } from './home-components/Card';
import { ThreeBackground } from '../components/ThreeBackground';
import { OrthodoxCross3D } from '../components/OrthodoxCross3D';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLandingContent } from '@/hooks/useLandingContent';
import logo from '@/assets/logo.png';
import { PICTURES } from '@/assets/pictures';
import { useGallery } from '@/hooks/useGallery';
import { captionFor } from '@/services/gallery';
import { optimized } from '@/services/cloudinary';
import { NewsSection } from '@/components/home/NewsSection';

// Map icon name strings (stored in Firestore) to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  Users, FileText, BarChart3, Calendar, MapPin, Shield, Heart,
  Languages, Bell, CheckCircle2, Mail, ArrowRight, Sparkles,
  Youtube, Send, Phone, Clock, Globe, Church, MessageSquare,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} />;
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { content, loading } = useLandingContent();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { gallery } = useGallery();
  /**
   * Three sources, in order of authority:
   *   1. the admin-managed gallery (siteConfig/gallery)
   *   2. the legacy per-language `carousel`, so anything already uploaded
   *      before the gallery existed is not silently lost
   *   3. the photos bundled with the app
   */
  const featureCount = content.features?.items?.length ?? 0;
  const carousel = gallery.images.length > 0
    ? gallery.images.map((i) => i.url)
    : (content.carousel?.length ? content.carousel : PICTURES.slice(featureCount));

  useEffect(() => {
    if (carousel.length < 2) return;
    const id = setInterval(() => setCarouselIndex((i) => (i + 1) % carousel.length), 4000);
    return () => clearInterval(id);
  }, [carousel.length]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleLanguage = () => {
    if (language === 'en') setLanguage('am');
    else if (language === 'am') setLanguage('om');
    else if (language === 'om') setLanguage('ti');
    else setLanguage('en');
  };

  // Skeleton shimmer shown while Firestore loads
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-[#0D2440]' : 'bg-[#E7F0FA]'}`}>
        <div className="space-y-4 text-center animate-pulse">
          <div className="h-12 w-64 bg-[#2E5E99]/20 rounded-2xl mx-auto" />
          <div className="h-4 w-48 bg-[#2E5E99]/10 rounded-xl mx-auto" />
        </div>
      </div>
    );
  }

  const { hero, stats, features, support, footer, contact } = content;

  return (
    <div className={`min-h-screen selection:bg-[#2E5E99]/30 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
      <ThreeBackground />

      {/* ── Navigation ── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2 backdrop-blur-2xl border-b border-[#2E5E99]/10 shadow-xl' : 'py-3 sm:py-6 bg-transparent'}`}
        style={{ backgroundColor: scrolled ? (theme === 'dark' ? 'rgba(13,36,64,0.85)' : 'rgba(231,240,250,0.85)') : 'transparent' }}
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-12">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => scrollToSection('home')}>
              <img src={logo} alt="Mahibere Ahaw" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="text-base sm:text-xl font-black tracking-tighter bg-gradient-to-r from-[#2E5E99] to-[#7BA4D0] bg-clip-text text-transparent">MAHIBERE AHAW</span>
            </motion.div>
            <div className="hidden lg:flex items-center gap-8">
              {['home', 'about', 'services', 'contact'].map((section) => (
                <button key={section} onClick={() => scrollToSection(section)}
                  className={`text-sm font-bold uppercase tracking-[0.2em] transition-all hover:text-[#2E5E99] ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#0D2440]'} opacity-70 hover:opacity-100`}>
                  {(t.nav as any)[section]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-3 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors">
              {theme === 'light' ? <Moon className="h-5 w-5 text-[#2E5E99]" /> : <Sun className="h-5 w-5 text-[#7BA4D0]" />}
            </button>
            <button onClick={toggleLanguage} className="p-3 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors font-bold text-xs uppercase text-[#2E5E99]">
              {language === 'en' ? 'AM' : language === 'am' ? 'OM' : language === 'om' ? 'TI' : 'EN'}
            </button>
            <Button onClick={() => navigate('/login')} className="flex bg-[#2E5E99] hover:bg-[#2E5E99]/90 px-4 sm:px-8 py-2 sm:py-3 text-xs sm:text-base rounded-2xl shadow-xl shadow-[#2E5E99]/20">
              {t.nav.login}
            </Button>
            <button className="lg:hidden p-3 bg-[#2E5E99]/5 rounded-2xl" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6 text-[#2E5E99]" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed inset-0 z-[100] ${theme === 'dark' ? 'bg-[#0D2440]' : 'bg-[#E7F0FA]'} p-6 flex flex-col`}>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <img src={logo} alt="Mahibere Ahaw" className="h-10 w-10" />
                <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-[#2E5E99] to-[#7BA4D0] bg-clip-text text-transparent">MAHIBERE AHAW</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-red-500/10 text-red-500 rounded-2xl"><X className="h-6 w-6" /></button>
            </div>
            <div className="flex flex-col gap-6">
              {['home', 'about', 'services', 'contact'].map((section) => (
                <button key={section} onClick={() => { setMobileMenuOpen(false); scrollToSection(section); }}
                  className={`text-2xl font-black uppercase text-left w-full py-4 border-b border-[#2E5E99]/10 ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'} active:scale-95 transition-transform`}>
                  {(t.nav as any)[section]}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section ref={heroRef} id="home" className="relative min-h-screen flex items-center justify-center pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          <div className="text-left space-y-5 sm:space-y-8">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#2E5E99]/10 border border-[#2E5E99]/20 text-[#2E5E99] text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              {hero.badge}
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.1] font-ethiopic">
              {hero.title}
              {hero.titleHighlight && (
                <><br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E5E99] via-[#7BA4D0] to-[#2E5E99]">{hero.titleHighlight}</span></>
              )}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`text-base sm:text-xl ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]/80'} max-w-xl font-ethiopic leading-relaxed`}>
              {hero.description}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3 sm:gap-4">
              <Button size="lg" onClick={() => navigate('/login')} className="rounded-2xl px-6 sm:px-12 py-4 sm:py-8 text-base sm:text-xl bg-[#2E5E99] hover:scale-105 transition-transform">
                {hero.ctaPrimary}
              </Button>
              <Button size="lg" variant="ghost" onClick={() => scrollToSection('about')}
                className={`rounded-2xl px-6 sm:px-10 py-4 sm:py-8 text-base sm:text-xl border border-[#2E5E99]/20 hover:bg-[#2E5E99]/5 ${theme === 'dark' ? 'text-white' : 'text-[#2E5E99]'}`}>
                {hero.ctaSecondary}
              </Button>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }} className="relative">
            {/* interactive 3D Ethiopian Orthodox cross — drag to spin, double-tap to reset */}
            <div className="absolute -inset-10 bg-[#FABB2A]/15 blur-[100px] rounded-full" />
            {/* Optional hero photo (Landing Editor → Hero) sits behind the cross
                as a soft backdrop. Empty by default, in which case only the glow shows. */}
            {hero.imageUrl && (
              <div
                aria-hidden
                className="absolute inset-0 rounded-[3rem] overflow-hidden opacity-25 blur-[2px] pointer-events-none"
              >
                <img
                  src={optimized(hero.imageUrl, 1200)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="relative h-[380px] sm:h-[460px] lg:h-[560px]">
              <OrthodoxCross3D />
            </div>
            {/* Floating stat cards hidden for now
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 bg-white/80 backdrop-blur-2xl p-6 rounded-3xl border border-[#2E5E99]/10 shadow-2xl">
              <Users className="h-8 w-8 text-[#2E5E99] mb-2" />
              <div className="text-xl font-bold text-[#0D2440]">{hero.statsCard1Value}</div>
              <div className="text-[10px] uppercase tracking-tighter opacity-50 text-[#2E5E99]">{hero.statsCard1Label}</div>
            </motion.div>
            <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-10 -left-10 bg-white/80 backdrop-blur-2xl p-6 rounded-3xl border border-[#2E5E99]/10 shadow-2xl">
              <Shield className="h-8 w-8 text-[#7BA4D0] mb-2" />
              <div className="text-xl font-bold text-[#0D2440]">{hero.statsCard2Value}</div>
              <div className="text-[10px] uppercase tracking-tighter opacity-50 text-[#2E5E99]">{hero.statsCard2Label}</div>
            </motion.div>
            */}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 sm:py-24 relative overflow-hidden bg-white/30 backdrop-blur-sm border-y border-[#2E5E99]/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group relative">
                <div className="absolute -inset-4 bg-[#2E5E99]/5 rounded-[2rem] scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
                <div className="relative text-center p-8 space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-[#E7F0FA] border border-[#2E5E99]/10 group-hover:border-[#2E5E99]/50 transition-colors shadow-sm">
                    <DynamicIcon name={s.icon} className="h-8 w-8 text-[#2E5E99]" />
                  </div>
                  <div className={`text-5xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{s.value}</div>
                  <div className={`text-xs uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-[#7BA4D0] opacity-80' : 'text-[#2E5E99] opacity-40'}`}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo carousel ── */}
      {carousel.length > 0 && (
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#2E5E99]/10 aspect-video max-h-[70vh] mx-auto">
              {carousel.map((url, i) => (
                <motion.img
                  key={url}
                  src={optimized(url, 1600)}
                  alt={`Slide ${i + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={false}
                  animate={{ opacity: i === carouselIndex ? 1 : 0 }}
                  transition={{ duration: 0.8 }}
                />
              ))}
              {/* Caption of the visible slide, when the gallery supplies one. */}
              {gallery.images[carouselIndex] && captionFor(gallery.images[carouselIndex], language) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D2440]/80 to-transparent p-6 pb-16">
                  <p className="text-white text-lg font-ethiopic max-w-3xl">
                    {captionFor(gallery.images[carouselIndex], language)}
                  </p>
                </div>
              )}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {carousel.map((_, i) => (
                  <button key={i} onClick={() => setCarouselIndex(i)} aria-label={`Go to slide ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all ${i === carouselIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/50'}`} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section id="services" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black font-ethiopic text-[#0D2440]">{features.sectionTitle}</h2>
              <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">{features.sectionDescription}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.items.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} viewport={{ once: true }}>
                <Card className="h-full hover:shadow-[#2E5E99]/10 bg-white shadow-xl border-[#2E5E99]/5">
                  {/* Photos come from src/assets/pictures by position. With none
                      in the directory this falls back to the plain icon tile, so
                      the page never depends on the folder having contents.
                      The negative margins match the card's own p-8 so the image
                      bleeds to its edges; only the top corners are rounded. */}
                  {PICTURES.length > 0 ? (
                    <div className="relative -mx-8 -mt-8 mb-8 aspect-video overflow-hidden rounded-t-3xl group/photo">
                      <img
                        src={PICTURES[i % PICTURES.length]}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D2440]/50 to-transparent" />
                      <div className="absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br from-[#2E5E99] to-[#7BA4D0] flex items-center justify-center shadow-2xl">
                        <DynamicIcon name={f.icon} className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2E5E99] to-[#7BA4D0] flex items-center justify-center mb-8 shadow-2xl">
                      <DynamicIcon name={f.icon} className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <h3 className="text-3xl font-bold mb-4 font-ethiopic text-[#0D2440]">{f.title}</h3>
                  <p className="text-lg text-[#0D2440]/70 font-ethiopic leading-relaxed mb-8">{f.description}</p>
                  <div className="flex items-center gap-2 text-[#2E5E99] font-bold group/btn cursor-pointer" onClick={() => navigate(`/features#${f.id}`)}>
                    {t.common.learnMore}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Support / About ── */}
      <section id="about" className="py-32 relative bg-[#2E5E99]/5 backdrop-blur-md">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
                <Heart className="h-3 w-3" />
                {support.badge}
              </motion.div>
              <h2 className="text-5xl font-black font-ethiopic text-[#0D2440]">{support.title}</h2>
              <p className="text-xl text-[#0D2440]/70 font-ethiopic leading-relaxed">{support.description}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {support.banks.map((bank, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }} className="p-4 rounded-2xl bg-white border border-[#2E5E99]/10 shadow-sm transition-all">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#2E5E99] mb-1">{bank.name}</p>
                    <p className="text-lg font-bold text-[#0D2440] font-mono">{bank.account}</p>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-10 bg-[#2E5E99]/20 blur-[100px] rounded-full" />
              <div className="relative p-12 rounded-[3rem] bg-gradient-to-br from-[#2E5E99] to-[#7BA4D0] shadow-2xl overflow-hidden hover:rotate-2 transition-transform duration-700">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                <Heart className="h-20 w-20 text-white/40 mb-8" />
                <h3 className="text-4xl font-black text-white mb-6 font-ethiopic">{support.missionTitle}</h3>
                <p className="text-2xl text-white/90 font-ethiopic leading-relaxed font-bold">"{support.missionStatement}"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── News ── (renders nothing when no posts are published) */}
      <NewsSection />

      {/* ── Contact ── */}
      <section id="contact" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-16 space-y-4">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
              <Phone className="h-3 w-3" />
              {contact.badge}
            </motion.div>
            <h2 className={`text-4xl md:text-6xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{contact.sectionTitle}</h2>
            <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">{contact.sectionDescription}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Address */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border shadow-sm space-y-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
              <div className="inline-flex p-3 rounded-2xl bg-[#E7F0FA] border border-[#2E5E99]/10">
                <MapPin className="h-6 w-6 text-[#2E5E99]" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2E5E99]">{contact.addressLabel}</h3>
              <p className={`font-ethiopic leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-[#0D2440]/70'}`}>{contact.address}</p>
              {contact.mapUrl && (
                <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#2E5E99] hover:gap-3 transition-all">
                  Open in Maps <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </motion.div>

            {/* Phones */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border shadow-sm space-y-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
              <div className="inline-flex p-3 rounded-2xl bg-[#E7F0FA] border border-[#2E5E99]/10">
                <Phone className="h-6 w-6 text-[#2E5E99]" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2E5E99]">{contact.phoneLabel}</h3>
              <ul className="space-y-2">
                {(contact.phones ?? []).filter(Boolean).map((p) => (
                  <li key={p}>
                    <a href={`tel:${p.replace(/\s+/g, '')}`}
                      className={`font-bold hover:text-[#2E5E99] transition-colors ${theme === 'dark' ? 'text-white/80' : 'text-[#0D2440]'}`}>{p}</a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Emails */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border shadow-sm space-y-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
              <div className="inline-flex p-3 rounded-2xl bg-[#E7F0FA] border border-[#2E5E99]/10">
                <Mail className="h-6 w-6 text-[#2E5E99]" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2E5E99]">{contact.emailLabel}</h3>
              <ul className="space-y-2">
                {(contact.emails ?? []).filter(Boolean).map((e) => (
                  <li key={e}>
                    <a href={`mailto:${e}`} className={`font-bold break-all hover:text-[#2E5E99] transition-colors ${theme === 'dark' ? 'text-white/80' : 'text-[#0D2440]'}`}>{e}</a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Hours + socials */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border shadow-sm space-y-4 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
              <div className="inline-flex p-3 rounded-2xl bg-[#E7F0FA] border border-[#2E5E99]/10">
                <Clock className="h-6 w-6 text-[#2E5E99]" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#2E5E99]">{contact.hoursLabel}</h3>
              <p className={`font-ethiopic leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-[#0D2440]/70'}`}>{contact.hours}</p>
              <div className="pt-2 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7BA4D0]">{contact.socialsLabel}</h4>
                <div className="flex gap-2 flex-wrap">
                  {contact.youtube && (
                    <a href={contact.youtube} target="_blank" rel="noopener noreferrer" title="YouTube"
                      className="p-3 rounded-xl bg-[#2E5E99]/5 hover:bg-[#FF0000] transition-all duration-300 group">
                      <Youtube className="h-4 w-4 text-[#2E5E99] group-hover:text-white" />
                    </a>
                  )}
                  {contact.telegram && (
                    <a href={contact.telegram} target="_blank" rel="noopener noreferrer" title="Telegram"
                      className="p-3 rounded-xl bg-[#2E5E99]/5 hover:bg-[#229ED9] transition-all duration-300 group">
                      <Send className="h-4 w-4 text-[#2E5E99] group-hover:text-white" />
                    </a>
                  )}
                  {contact.facebook && (
                    <a href={contact.facebook} target="_blank" rel="noopener noreferrer" title="Facebook"
                      className="p-3 rounded-xl bg-[#2E5E99]/5 hover:bg-[#1877F2] transition-all duration-300 group">
                      <Facebook className="h-4 w-4 text-[#2E5E99] group-hover:text-white" />
                    </a>
                  )}
                  {contact.tiktok && (
                    <a href={contact.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok"
                      className="p-3 rounded-xl bg-[#2E5E99]/5 hover:bg-[#0D2440] transition-all duration-300 group">
                      <Music2 className="h-4 w-4 text-[#2E5E99] group-hover:text-white" />
                    </a>
                  )}
                  {contact.website && (
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" title="Website"
                      className="p-3 rounded-xl bg-[#2E5E99]/5 hover:bg-[#2E5E99] transition-all duration-300 group">
                      <Globe className="h-4 w-4 text-[#2E5E99] group-hover:text-white" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="footer" className={`pt-32 pb-12 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440]/90 border-t border-white/5' : 'bg-white border-t border-[#2E5E99]/10'}`}>
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 lg:col-span-1 space-y-8">
              <div className="flex items-center gap-3">
                <img src={logo} alt="MahibereAhaw" className="h-12 w-12 rounded-2xl shadow-lg" />
                <span className="text-2xl font-black text-[#2E5E99]">MAHIBERE AHAW</span>
              </div>
              <p className={`font-ethiopic leading-loose ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/70'}`}>{footer.description}</p>
              <div className="flex gap-4 flex-wrap">
                {footer.youtube && (
                  <a href={footer.youtube} target="_blank" rel="noopener noreferrer" title="YouTube"
                    className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#FF0000] hover:text-white transition-all duration-300 group">
                    <Youtube className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </a>
                )}
                {footer.telegram && (
                  <a href={footer.telegram} target="_blank" rel="noopener noreferrer" title="Telegram"
                    className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#229ED9] hover:text-white transition-all duration-300 group">
                    <Send className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </a>
                )}
                {footer.email && (
                  <a href={`mailto:${footer.email}`} title="Email" className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99] hover:text-white transition-all duration-300 group">
                    <Mail className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </a>
                )}
                {footer.phone && (
                  <a href={`tel:${footer.phone.replace(/\s+/g, '')}`} title="Call" className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99] hover:text-white transition-all duration-300 group">
                    <Phone className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 col-span-1 lg:col-span-3 gap-12">
              <div className="space-y-6">
                <h5 className="text-xs font-black uppercase tracking-[0.3em] text-[#2E5E99]">{t.footer.platform}</h5>
                <ul className={`space-y-4 ${theme === 'dark' ? 'text-white/50' : 'text-[#0D2440]/50'}`}>
                  {[t.footer.platformDashboard, t.footer.platformCommunity, t.footer.platformAnalytics, t.footer.platformSecurity].map(l => (
                    <li key={l}><a href="#" className="hover:text-[#2E5E99] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-xs font-black uppercase tracking-[0.3em] text-[#7BA4D0]">{t.footer.support}</h5>
                <ul className={`space-y-4 ${theme === 'dark' ? 'text-white/50' : 'text-[#0D2440]/50'}`}>
                  {[t.footer.supportDocumentation, t.footer.supportApiReference, t.footer.supportHelpCenter, t.footer.supportStatus].map(l => (
                    <li key={l}><a href="#" className="hover:text-[#2E5E99] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1 space-y-6">
                <h5 className="text-xs font-black uppercase tracking-[0.3em] text-[#2E5E99]">{t.footer.stayConnected}</h5>
                <div className="flex gap-2">
                  <input type="text" placeholder={t.footer.emailPlaceholder}
                    className="w-full bg-[#2E5E99]/5 border border-[#2E5E99]/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#2E5E99]" />
                  <Button className="rounded-2xl p-4 bg-[#2E5E99]"><ArrowRight /></Button>
                </div>
                <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">Email: {footer.email}</p>
              </div>
            </div>
          </div>
          <div className={`flex flex-col md:flex-row justify-between items-center pt-12 border-t border-[#2E5E99]/5 text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/30' : 'text-[#0D2440]/30'}`}>
            <p>{footer.copyright}</p>
            <div className="flex gap-12 mt-8 md:mt-0 font-bold">
              <a href="#" className="hover:text-[#2E5E99]">{t.footer.privacyArchitecture}</a>
              <a href="#" className="hover:text-[#2E5E99]">{t.footer.termsOfFaith}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
