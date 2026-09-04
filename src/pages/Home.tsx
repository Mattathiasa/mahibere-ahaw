import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users, FileText, BarChart3, Sun, Moon,
  Languages, Mail, MapPin, CheckCircle2, Sparkles, Menu, X,
  ArrowRight, Heart, Calendar, MessageSquare, Bell, Shield, Youtube, Send, Phone,
  Clock, Globe, Church, Facebook, Music2, ExternalLink, BookOpen, Compass, Award, Target,
  Scale, Handshake,
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from './home-components/Button';
import { Card } from './home-components/Card';
import { ThreeBackground } from '../components/ThreeBackground';
import { OrthodoxCross3D } from '../components/OrthodoxCross3D';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LANGUAGE_ENDONYM, nextLanguage } from '@/i18n/languages';
import { useLandingContent } from '@/hooks/useLandingContent';
import {
  featureLinkTarget, resolveLink,
  type LandingFeature, type LandingLink,
} from '@/services/landingContent';
import { BrandMark } from '@/components/BrandMark';
import { BrandedLoader } from '@/components/BrandedLoader';
import { PICTURES } from '@/assets/pictures';
import { useGallery } from '@/hooks/useGallery';
import { captionFor } from '@/services/gallery';
import { optimized } from '@/services/cloudinary';
import { NewsSection } from '@/components/home/NewsSection';
import { SuggestionSection } from '@/components/home/SuggestionSection';

// Map icon name strings (stored in Firestore) to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  Users, FileText, BarChart3, Calendar, MapPin, Shield, Heart,
  Languages, Bell, CheckCircle2, Mail, ArrowRight, Sparkles,
  Youtube, Send, Phone, Clock, Globe, Church, MessageSquare,
  BookOpen, Compass, Award, Target, Scale, Handshake,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Sparkles;
  return <Icon className={className} />;
}

/**
 * The navigable sections, in the order they appear down the page.
 *
 * This is the single source of truth: the desktop nav, the mobile menu and the
 * scroll spy all map over it, and each entry's `id` is the `id` of the matching
 * `<section>` below. The two nav lists used to be written out separately, which
 * let them drift from each other and from the page.
 *
 * The keys index into `t.nav`, so adding one here means adding it to all four
 * languages in src/i18n/translations.ts.
 */
// Order matches the page. `about` sits directly under the hero: who the
// church is answers the first question a visitor actually has, and the
// feature tour means nothing before it.
// `suggestions` sits last on purpose: it asks the visitor for something, and
// asking before the page has said who the church is and how to reach it gets a
// worse answer than asking after.
const SECTIONS = ['home', 'about', 'services', 'support', 'news', 'contact', 'suggestions'] as const;

/**
 * Keeps a section's heading clear of the fixed navigation when it is scrolled
 * to. `scrollIntoView` honours `scroll-margin-top`, so this is all the offset
 * handling that is needed — no manual scroll maths.
 */
const SECTION_ANCHOR = 'scroll-mt-24 sm:scroll-mt-28';

/**
 * One of the footer's two link columns.
 *
 * A row with a URL is a button; a row without one is plain text. Both columns
 * previously rendered `href="#"` for every entry, so all eight looked
 * clickable and none of them did anything.
 */
function FooterLinkColumn({
  heading, headingClass, links, theme, onFollow,
}: {
  heading: string;
  headingClass: string;
  links: LandingLink[];
  theme: string;
  onFollow: (url: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h5 className={`text-xs font-black uppercase tracking-[0.3em] ${headingClass}`}>{heading}</h5>
      <ul className={`space-y-4 ${theme === 'dark' ? 'text-white/50' : 'text-[#0D2440]/50'}`}>
        {(links ?? []).filter((l) => l.label?.trim()).map((link) => (
          <li key={link.label}>
            {link.url?.trim() ? (
              <button type="button" className="hover:text-[#2E5E99] transition-colors text-left"
                onClick={() => onFollow(link.url)}>
                {link.label}
              </button>
            ) : (
              <span>{link.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { content, loading } = useLandingContent();

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { gallery } = useGallery();
  /**
   * The admin-managed gallery (siteConfig/gallery), falling back to the photos
   * bundled with the app until an admin has uploaded any.
   *
   * A third source used to sit between them — the per-language `carousel`
   * field — but it stopped being editable when photos moved to the Gallery
   * tab, so stale saved data could silently outrank both the gallery and the
   * bundled photos with no way to correct it. The field is gone.
   */
  const featureCount = content.features?.items?.length ?? 0;
  const carousel = gallery.images.length > 0
    ? gallery.images.map((i) => i.url)
    : PICTURES.slice(featureCount);

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

  /**
   * Scroll spy: highlights whichever section is currently in view.
   *
   * The top margin matches the fixed nav so a section only counts as "current"
   * once it is actually visible below the bar, and the bottom margin keeps a
   * single section selected rather than every one crossing the viewport.
   */
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 }
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [loading]);

  /**
   * Honour a hash arrived at from another page, e.g. the /features CTA linking
   * to /#contact. The target does not exist until the content resolves, so this
   * waits for that — the same reason AboutFeatures defers its own hash scroll.
   */
  useEffect(() => {
    if (loading) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /**
   * Follow any link configured in the Landing Editor — hero buttons, feature
   * cards, footer columns. External opens a new tab, `#id` scrolls, everything
   * else routes in-app.
   */
  const followLink = (url: string | undefined, fallback = '') => {
    const action = resolveLink(url, fallback);
    switch (action.kind) {
      case 'external': window.open(action.url, '_blank', 'noopener,noreferrer'); break;
      case 'anchor': scrollToSection(action.id); break;
      case 'route': navigate(action.path); break;
      case 'none': break;
    }
  };

  const openFeatureLink = (feature: LandingFeature) => followLink(featureLinkTarget(feature));

  const upcomingLanguage = nextLanguage(language);
  const toggleLanguage = () => setLanguage(upcomingLanguage);

  // Shown while the Firestore-backed page content resolves. Same palette as
  // the pre-boot splash in index.html, so the two read as one screen.
  if (loading) return <BrandedLoader />;

  const { hero, stats, features, about, support, footer, contact } = content;

  return (
    <div className={`min-h-screen overflow-x-hidden selection:bg-[#2E5E99]/30 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
      <ThreeBackground />

      {/* ── Navigation ── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2 backdrop-blur-2xl border-b border-[#2E5E99]/10 shadow-xl' : 'py-3 sm:py-6 bg-transparent'}`}
        style={{ backgroundColor: scrolled ? (theme === 'dark' ? 'rgba(13,36,64,0.85)' : 'rgba(231,240,250,0.85)') : 'transparent' }}
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 sm:gap-12 min-w-0">
            <motion.div whileHover={{ scale: 1.04 }} className="group flex items-center cursor-pointer" onClick={() => scrollToSection('home')}>
              <BrandMark size="md" showWordmark interactive />
            </motion.div>
            <div className="hidden lg:flex items-center gap-7">
              {SECTIONS.map((section) => {
                const isActive = activeSection === section;
                return (
                  <button key={section} onClick={() => scrollToSection(section)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative text-sm font-bold uppercase tracking-[0.2em] transition-all hover:text-[#2E5E99] hover:opacity-100 ${
                      theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#0D2440]'
                    } ${isActive ? 'opacity-100 text-[#2E5E99]' : 'opacity-70'}`}>
                    {t.nav[section]}
                    <span className={`absolute -bottom-1.5 left-0 h-0.5 rounded-full bg-[#2E5E99] transition-all duration-300 ${
                      isActive ? 'w-full' : 'w-0'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggleTheme} className="p-2.5 sm:p-3 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors">
              {theme === 'light' ? <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-[#2E5E99]" /> : <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-[#7BA4D0]" />}
            </button>
            <button onClick={toggleLanguage} className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors font-bold text-xs text-[#2E5E99]">
              {LANGUAGE_ENDONYM[language]}
            </button>
            <Button onClick={() => navigate('/login')} className="bg-[#2E5E99] hover:bg-[#2E5E99]/90 px-4 py-2 sm:px-6 sm:py-2.5 text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-lg shadow-[#2E5E99]/20 whitespace-nowrap">
              {t.nav.login}
            </Button>
            <button className="lg:hidden p-2.5 sm:p-3 bg-[#2E5E99]/5 rounded-2xl shrink-0" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-[#2E5E99]" />
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
              <BrandMark size="md" showWordmark wordmarkClass="flex" />
              <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-red-500/10 text-red-500 rounded-2xl"><X className="h-6 w-6" /></button>
            </div>
            <div className="flex flex-col gap-6">
              {SECTIONS.map((section) => {
                const isActive = activeSection === section;
                return (
                  <button key={section} onClick={() => { setMobileMenuOpen(false); scrollToSection(section); }}
                    aria-current={isActive ? 'true' : undefined}
                    className={`flex items-center gap-3 text-2xl font-black uppercase text-left w-full py-4 border-b border-[#2E5E99]/10 active:scale-95 transition-transform ${
                      isActive ? 'text-[#2E5E99]' : theme === 'dark' ? 'text-white' : 'text-[#0D2440]'
                    }`}>
                    <span className={`h-2 w-2 rounded-full bg-[#2E5E99] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                    {t.nav[section]}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section ref={heroRef} id="home" className={`relative min-h-screen flex items-center justify-center pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 overflow-hidden ${SECTION_ANCHOR}`}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-8 sm:gap-16 items-center w-full">
          <div className="text-left space-y-5 sm:space-y-8 min-w-0">
            {/* The seal leads the page. It carries the church's identity —
                the rim text, the cross, the dove, the open Bible — none of
                which is legible at nav size, so it gets one place on the site
                where it is shown large enough to actually be read. */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }} className="block">
              <BrandMark size="xl" />
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#2E5E99]/10 border border-[#2E5E99]/20 text-[#2E5E99] text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              {hero.badge}
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-7xl font-black leading-[1.1] font-ethiopic break-words">
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
              <Button size="lg" onClick={() => followLink(hero.ctaPrimaryUrl, '/login')} className="rounded-2xl px-6 sm:px-12 py-4 sm:py-8 text-base sm:text-xl bg-[#2E5E99] hover:scale-105 transition-transform">
                {hero.ctaPrimary}
              </Button>
              <Button size="lg" variant="ghost" onClick={() => followLink(hero.ctaSecondaryUrl, '#about')}
                className={`rounded-2xl px-6 sm:px-10 py-4 sm:py-8 text-base sm:text-xl border border-[#2E5E99]/20 hover:bg-[#2E5E99]/5 ${theme === 'dark' ? 'text-white' : 'text-[#2E5E99]'}`}>
                {hero.ctaSecondary}
              </Button>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden sm:block">
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
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className={`py-12 sm:py-24 relative overflow-hidden bg-white/30 backdrop-blur-sm border-y border-[#2E5E99]/5 ${SECTION_ANCHOR}`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="group relative">
                <div className="absolute -inset-4 bg-[#2E5E99]/5 rounded-[2rem] scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
                <div className="relative text-center p-4 sm:p-8 space-y-3 sm:space-y-4">
                  <div className="inline-flex p-3 sm:p-4 rounded-2xl bg-[#E7F0FA] border border-[#2E5E99]/10 group-hover:border-[#2E5E99]/50 transition-colors shadow-sm">
                    <DynamicIcon name={s.icon} className="h-6 w-6 sm:h-8 sm:w-8 text-[#2E5E99]" />
                  </div>
                  <div className={`text-3xl sm:text-5xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{s.value}</div>
                  <div className={`text-[10px] sm:text-xs uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-[#7BA4D0] opacity-80' : 'text-[#2E5E99] opacity-40'}`}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo carousel ── */}
      {carousel.length > 0 && (
        <section id="gallery" className={`py-16 sm:py-24 relative overflow-hidden ${SECTION_ANCHOR}`}>
          <div className="container mx-auto px-4 sm:px-6">
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

      {/* ── About Us, Faith, Mission & Values ── */}
      <section id="about" className={`py-24 sm:py-32 relative bg-[#2E5E99]/5 backdrop-blur-md ${SECTION_ANCHOR}`}>
        <div className="container mx-auto px-4 sm:px-6 space-y-20">
          
          {/* Section Header */}
          <div className="max-w-3xl space-y-4">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
              <Church className="h-3.5 w-3.5" />
              {about?.badge ?? DEFAULT_LANDING_CONTENT.en.about!.badge}
            </motion.div>
            <h2 className={`text-3xl sm:text-4xl md:text-6xl font-black font-ethiopic break-words ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
              {about?.sectionTitle ?? DEFAULT_LANDING_CONTENT.en.about!.sectionTitle}
            </h2>
            <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">
              {about?.sectionDescription ?? DEFAULT_LANDING_CONTENT.en.about!.sectionDescription}
            </p>
          </div>

          {/* Identity, Mission & Vision Cards */}
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border shadow-xl flex flex-col justify-between space-y-6 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2E5E99] to-[#7BA4D0] flex items-center justify-center shadow-lg">
                  <Church className="h-7 w-7 text-white" />
                </div>
                <h3 className={`text-2xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                  {about?.whoWeAreTitle ?? DEFAULT_LANDING_CONTENT.en.about!.whoWeAreTitle}
                </h3>
                <p className={`font-ethiopic leading-relaxed text-base ${theme === 'dark' ? 'text-white/70' : 'text-[#0D2440]/70'}`}>
                  {about?.whoWeAreDescription ?? DEFAULT_LANDING_CONTENT.en.about!.whoWeAreDescription}
                </p>
              </div>
              {about?.historyLinkLabel && (
                <Link
                  to={about.historyUrl || '/about'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#2E5E99] text-white font-ethiopic font-bold shadow-lg shadow-[#2E5E99]/20 hover:bg-[#204a7c] hover:gap-3 transition-all"
                >
                  {about.historyLinkLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} viewport={{ once: true }}
              className="p-8 rounded-3xl bg-gradient-to-br from-[#2E5E99] to-[#1D3E66] text-white shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
              <div className="space-y-4 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-black font-ethiopic text-white">
                  {about?.missionTitle ?? DEFAULT_LANDING_CONTENT.en.about!.missionTitle}
                </h3>
                {/* The mission is a list of commitments, not a paragraph —
                    rendered as one when the content supplies several lines. */}
                {(() => {
                  const lines = (about?.missionDescription ?? '')
                    .split('\n').map((l) => l.trim()).filter(Boolean);
                  if (lines.length > 1) {
                    return (
                      <ul className="space-y-2 font-ethiopic text-base text-white/90">
                        {lines.map((line, i) => (
                          <li key={i} className="flex gap-2 leading-relaxed">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/70 shrink-0" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p className="font-ethiopic leading-relaxed text-base text-white/90">
                      {lines[0] ?? DEFAULT_LANDING_CONTENT.en.about!.missionDescription}
                    </p>
                  );
                })()}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border shadow-xl flex flex-col justify-between space-y-6 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7BA4D0] to-[#2E5E99] flex items-center justify-center shadow-lg">
                  <Compass className="h-7 w-7 text-white" />
                </div>
                <h3 className={`text-2xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                  {about?.visionTitle ?? DEFAULT_LANDING_CONTENT.en.about!.visionTitle}
                </h3>
                <p className={`font-ethiopic leading-relaxed text-base ${theme === 'dark' ? 'text-white/70' : 'text-[#0D2440]/70'}`}>
                  {about?.visionDescription ?? DEFAULT_LANDING_CONTENT.en.about!.visionDescription}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Statement of Faith / What We Believe */}
          <div className="space-y-10 pt-4">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[#2E5E99]">{about?.beliefsEyebrow}</span>
              <h3 className={`text-3xl sm:text-4xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                {about?.beliefsTitle ?? DEFAULT_LANDING_CONTENT.en.about!.beliefsTitle}
              </h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {(about?.beliefs ?? []).map((belief, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  className={`p-6 sm:p-8 rounded-3xl border shadow-sm flex items-start gap-5 transition-all hover:shadow-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
                  <div className="p-3.5 rounded-2xl bg-[#2E5E99]/10 text-[#2E5E99] shrink-0">
                    <DynamicIcon name={belief.icon} className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className={`text-xl font-bold font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                      {belief.title}
                    </h4>
                    <p className={`font-ethiopic text-sm sm:text-base leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-[#0D2440]/70'}`}>
                      {belief.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Core Values */}
          <div className="space-y-10 pt-4">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-[#2E5E99]">{about?.valuesEyebrow}</span>
              <h3 className={`text-3xl sm:text-4xl font-black font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                {about?.valuesTitle ?? DEFAULT_LANDING_CONTENT.en.about!.valuesTitle}
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(about?.values ?? []).map((val, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                  className={`p-6 rounded-3xl border shadow-sm space-y-4 hover:-translate-y-1 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
                  <div className="w-12 h-12 rounded-2xl bg-[#2E5E99]/10 text-[#2E5E99] flex items-center justify-center">
                    <DynamicIcon name={val.icon} className="h-6 w-6" />
                  </div>
                  <h4 className={`text-lg font-bold font-ethiopic ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                    {val.title}
                  </h4>
                  <p className={`font-ethiopic text-sm leading-relaxed ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/70'}`}>
                    {val.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Full history CTA — the About section above is a summary, so the way
          through to the complete account has to be impossible to miss. */}
      {content.about?.historyLinkLabel && (
        <div className="pb-20 sm:pb-24 -mt-8 sm:-mt-12 relative bg-[#2E5E99]/5 backdrop-blur-md">
          <div className="container mx-auto px-6 flex justify-center">
            <Link
              to={content.about.historyUrl || '/about'}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-3xl border-2 border-[#2E5E99]/30 font-ethiopic font-black text-[#2E5E99] hover:bg-[#2E5E99] hover:text-white hover:border-transparent transition-all"
            >
              <BookOpen className="h-5 w-5" />
              {content.about.historyLinkLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Features ── */}
      <section id="services" className={`py-32 relative ${SECTION_ANCHOR}`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8">
            <div className="space-y-4 max-w-2xl min-w-0">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black font-ethiopic text-[#0D2440] break-words">{features.sectionTitle}</h2>
              <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">{features.sectionDescription}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
            {features.items.map((f, i) => {
              /* An admin-uploaded photo wins; otherwise fall back to the
                 bundled src/assets/pictures photo at this position, and to a
                 plain icon tile when that directory is empty — so the card
                 never depends on either source having contents. */
              const photo = f.imageUrl ? optimized(f.imageUrl, 800)
                : PICTURES.length > 0 ? PICTURES[i % PICTURES.length]
                : null;
              return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} viewport={{ once: true }}>
                <Card className="h-full hover:shadow-[#2E5E99]/10 bg-white shadow-xl border-[#2E5E99]/5">
                  {/* The negative margins match the card's own p-8 so the image
                      bleeds to its edges; only the top corners are rounded. */}
                  {photo ? (
                    <div className="relative -mx-8 -mt-8 mb-8 aspect-video overflow-hidden rounded-t-3xl group/photo">
                      <img
                        src={photo}
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
                  <button type="button" className="flex items-center gap-2 text-[#2E5E99] font-bold group/btn" onClick={() => openFeatureLink(f)}>
                    {f.learnMoreLabel?.trim() || t.common.learnMore}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </button>
                </Card>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Ministerial Support & Bank Accounts ──
          Its own section rather than a block tucked inside About: it has its
          own heading and the bank details visitors come looking for, so it
          needs an anchor the navigation can point at. */}
      <section id="support" className={`py-24 sm:py-32 relative ${SECTION_ANCHOR}`}>
        <div className="container mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
                <Heart className="h-3 w-3" />
                {support.badge}
              </div>
              <h2 className={`text-3xl sm:text-4xl md:text-6xl font-black font-ethiopic break-words ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>
                {support.title}
              </h2>
              <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">
                {support.description}
              </p>
            </div>
          </div>

          {/* The mission restated beside the giving details. These two fields
              were editable in the Landing Editor but rendered nowhere, so the
              translated copy an admin had written was invisible on the site. */}
          {(support.missionTitle || support.missionStatement) && (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`p-8 rounded-3xl border shadow-sm max-w-3xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
              {support.missionTitle && (
                <h3 className={`text-xs font-black uppercase tracking-[0.25em] text-[#2E5E99] mb-3`}>
                  {support.missionTitle}
                </h3>
              )}
              {support.missionStatement && (
                <blockquote className={`text-lg sm:text-xl font-ethiopic leading-relaxed italic ${theme === 'dark' ? 'text-white/80' : 'text-[#0D2440]/80'}`}>
                  “{support.missionStatement}”
                </blockquote>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {support.banks.map((bank, i) => (
              <motion.div key={i} whileHover={{ scale: 1.03 }} className={`p-4 rounded-2xl border shadow-sm transition-all min-w-0 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-[#2E5E99]/10'}`}>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#2E5E99] mb-1 truncate">{bank.name}</p>
                <p className={`text-xs sm:text-sm font-bold font-mono break-all ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{bank.account}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── News ── (shows an editable empty state when nothing is published) */}
      <NewsSection />

      {/* ── Contact ── */}
      <section id="contact" className={`py-32 relative ${SECTION_ANCHOR}`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-16 space-y-4">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[10px] font-black uppercase tracking-widest border border-[#2E5E99]/20">
              <Phone className="h-3 w-3" />
              {contact.badge}
            </motion.div>
            <h2 className={`text-3xl sm:text-4xl md:text-6xl font-black font-ethiopic break-words ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{contact.sectionTitle}</h2>
            <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">{contact.sectionDescription}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  {t.common.openInMaps} <ExternalLink className="h-3.5 w-3.5" />
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
                    <a href={contact.website} target="_blank" rel="noopener noreferrer" title={t.common.website}
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

      {/* ── Suggestion box ──
          The only place on this site where a visitor with no account writes to
          Firestore. See services/suggestions.ts and the `suggestions` block in
          firestore.rules. */}
      <SuggestionSection />

      {/* ── Footer ── */}
      <footer id="footer" className={`pt-32 pb-12 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440]/90 border-t border-white/5' : 'bg-white border-t border-[#2E5E99]/10'}`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-4 gap-12 sm:gap-16 mb-24">
            <div className="col-span-1 lg:col-span-1 space-y-8">
              <BrandMark size="lg" showWordmark tagline={null} wordmarkClass="flex" />
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
                {footer.facebook && (
                  <a href={footer.facebook} target="_blank" rel="noopener noreferrer" title="Facebook"
                    className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#1877F2] hover:text-white transition-all duration-300 group">
                    <Facebook className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </a>
                )}
                {footer.email && (
                  <a href={`mailto:${footer.email}`} title={t.common.emailAction} className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99] hover:text-white transition-all duration-300 group">
                    <Mail className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </a>
                )}
                {footer.phone && (
                  <a href={`tel:${footer.phone.replace(/\s+/g, '')}`} title={t.common.callAction} className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99] hover:text-white transition-all duration-300 group">
                    <Phone className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 col-span-1 lg:col-span-3 gap-12">
              {/* Both columns used to be four `href="#"` links that went
                  nowhere. Labels and destinations now come from the Landing
                  Editor; a row with no URL renders as plain text rather than
                  as a link that does nothing. */}
              <FooterLinkColumn heading={footer.platformHeading} headingClass="text-[#2E5E99]"
                links={footer.platformLinks} theme={theme} onFollow={followLink} />
              <FooterLinkColumn heading={footer.supportHeading} headingClass="text-[#7BA4D0]"
                links={footer.supportLinks} theme={theme} onFollow={followLink} />
              {footer.newsletterEnabled && (
                <div className="col-span-2 md:col-span-1 space-y-6">
                  <h5 className="text-xs font-black uppercase tracking-[0.3em] text-[#2E5E99]">{footer.newsletterHeading}</h5>
                  {/* There is no mailing-list backend, so this opens the
                      visitor's mail client addressed to the office rather than
                      swallowing the address into nothing. */}
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const address = new FormData(e.currentTarget).get('subscriber');
                      window.location.href =
                        `mailto:${footer.email}?subject=${encodeURIComponent(footer.newsletterHeading)}` +
                        `&body=${encodeURIComponent(String(address ?? ''))}`;
                    }}
                  >
                    <input type="email" name="subscriber" required placeholder={footer.newsletterPlaceholder}
                      className="w-full bg-[#2E5E99]/5 border border-[#2E5E99]/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#2E5E99]" />
                    <Button type="submit" aria-label={footer.newsletterHeading} className="rounded-2xl p-4 bg-[#2E5E99]"><ArrowRight /></Button>
                  </form>
                  <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{footer.emailLabel}: {footer.email}</p>
                </div>
              )}
            </div>
          </div>
          <div className={`flex flex-col md:flex-row justify-between items-center pt-12 border-t border-[#2E5E99]/5 text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/30' : 'text-[#0D2440]/30'}`}>
            <p>{footer.copyright}</p>
            <div className="flex gap-12 mt-8 md:mt-0 font-bold">
              {footer.privacyUrl?.trim() && (
                <button type="button" className="uppercase hover:text-[#2E5E99]" onClick={() => followLink(footer.privacyUrl)}>{footer.privacyLabel}</button>
              )}
              {footer.termsUrl?.trim() && (
                <button type="button" className="uppercase hover:text-[#2E5E99]" onClick={() => followLink(footer.termsUrl)}>{footer.termsLabel}</button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
