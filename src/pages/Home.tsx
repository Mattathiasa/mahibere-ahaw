import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Users, FileText, BarChart3, ChevronDown, Sun, Moon,
  Languages, Mail, MapPin, CheckCircle2, Sparkles, Menu, X,
  ArrowRight, Heart, Calendar, MessageSquare, Bell, Shield
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from './home-components/Button';
import { Card } from './home-components/Card';
import { CardFlip } from './home-components/CardFlip';
import { ThreeBackground } from '../components/ThreeBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import logo from '@/assets/logo.png';
import dashboardPreview from '@/assets/dashboardpreview.png';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`min-h-screen selection:bg-[#2E5E99]/30 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
      <ThreeBackground />

      {/* Modern Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2 backdrop-blur-2xl border-b border-[#2E5E99]/10 shadow-xl' : 'py-6 bg-transparent'
          }`}
        style={{
          backgroundColor: scrolled ? (theme === 'dark' ? 'rgba(13, 36, 64, 0.85)' : 'rgba(231, 240, 250, 0.85)') : 'transparent'
        }}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => scrollToSection('home')}
            >
              <img src={logo} alt="Mahibere Ahaw" className="h-10 w-10 sm:h-12 sm:w-12" />
              <span className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#2E5E99] to-[#7BA4D0] bg-clip-text text-transparent">MAHIBERE AHAW</span>
            </motion.div>

            <div className="hidden lg:flex items-center gap-8">
              {['home', 'about', 'services', 'contact'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className={`text-sm font-bold uppercase tracking-[0.2em] transition-all hover:text-[#2E5E99] ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#0D2440]'} opacity-70 hover:opacity-100`}
                >
                  {t(section as any)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-3 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors">
              {theme === 'light' ? <Moon className="h-5 w-5 text-[#2E5E99]" /> : <Sun className="h-5 w-5 text-[#7BA4D0]" />}
            </button>
            <button onClick={toggleLanguage} className="p-3 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99]/10 transition-colors font-bold text-xs uppercase text-[#2E5E99]">
              {t('languageToggle')}
            </button>
            <Button
              onClick={() => navigate('/login')}
              className="hidden sm:flex bg-[#2E5E99] hover:bg-[#2E5E99]/90 px-8 py-3 rounded-2xl shadow-xl shadow-[#2E5E99]/20"
            >
              {t('login')}
            </Button>
            <button className="lg:hidden p-3 bg-[#2E5E99]/5 rounded-2xl" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-6 w-6 text-[#2E5E99]" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} id="home" className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="container mx-auto relative z-10 grid lg:grid-cols-2 gap-16 items-center"
        >
          <div className="text-left space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2E5E99]/10 border border-[#2E5E99]/20 text-[#2E5E99] text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles className="h-3 w-3" />
              Revolutionizing Ministry
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-8xl font-black leading-[1.1] font-ethiopic"
            >
              {t('heroTitle')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E5E99] via-[#7BA4D0] to-[#2E5E99]">
            
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`text-xl md:text-2xl ${theme === 'dark' ? 'text-[#7BA4D0]' : 'text-[#2E5E99]/80'} max-w-xl font-ethiopic leading-relaxed`}
            >
              {t('heroDescription')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" className="rounded-2xl px-12 py-8 text-xl bg-[#2E5E99] hover:scale-105 transition-transform">
                {t('getStarted')}
              </Button>
              <Button size="lg" variant="ghost" className={`rounded-2xl px-10 py-8 text-xl border border-[#2E5E99]/20 hover:bg-[#2E5E99]/5 ${theme === 'dark' ? 'text-white' : 'text-[#2E5E99]'}`}>
                {t('learnMore')}
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="relative hidden lg:block"
          >
            <div className="absolute -inset-10 bg-[#2E5E99]/10 blur-[100px] rounded-full" />
            <Card className="relative overflow-hidden group border-[#2E5E99]/10 bg-white/40">
              <img src={dashboardPreview} alt="Dashboard" className="rounded-xl shadow-2xl transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D2440]/60 to-transparent opacity-60" />
              <div className="absolute bottom-10 left-10 space-y-2">
                <div className="flex gap-2">
                  <div className="w-12 h-2 rounded-full bg-[#2E5E99]" />
                  <div className="w-6 h-2 rounded-full bg-white/20" />
                </div>
                <h4 className="text-2xl font-bold text-white">Mahibere Ahaw Pro Cloud</h4>
              </div>
            </Card>

            {/* Floating UI Elements for Depth */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-10 -right-10 bg-white/80 backdrop-blur-2xl p-6 rounded-3xl border border-[#2E5E99]/10 shadow-2xl"
            >
              <Users className="h-8 w-8 text-[#2E5E99] mb-2" />
              <div className="text-xl font-bold text-[#0D2440]">12.5k</div>
              <div className="text-[10px] uppercase tracking-tighter opacity-50 text-[#2E5E99]">{t('activeSouls')}</div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 20, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-10 -left-10 bg-white/80 backdrop-blur-2xl p-6 rounded-3xl border border-[#2E5E99]/10 shadow-2xl"
            >
              <Shield className="h-8 w-8 text-[#7BA4D0] mb-2" />
              <div className="text-xl font-bold text-[#0D2440]">99.9%</div>
              <div className="text-[10px] uppercase tracking-tighter opacity-50 text-[#2E5E99]">{t('serviceUptime')}</div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Dynamic Statistics Section */}
      <section className="py-24 relative overflow-hidden bg-white/30 backdrop-blur-sm border-y border-[#2E5E99]/5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: t('congregations'), val: '850', icon: MapPin },
              { label: t('adminStaff'), val: '2.4k', icon: Shield },
              { label: t('spiritualGrowth'), val: '40%', icon: Heart },
              { label: t('globalReach'), val: '120+', icon: Languages },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-4 bg-[#2E5E99]/5 rounded-[2rem] scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
                <div className="relative text-center p-8 space-y-4">
                  <div className="inline-flex p-4 rounded-2xl bg-[#E7F0FA] border border-[#2E5E99]/10 group-hover:border-[#2E5E99]/50 transition-colors shadow-sm">
                    <s.icon className="h-8 w-8 text-[#2E5E99]" />
                  </div>
                  <div className={`text-5xl font-black ${theme === 'dark' ? 'text-white' : 'text-[#0D2440]'}`}>{s.val}</div>
                  <div className={`text-xs uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-[#7BA4D0] opacity-80' : 'text-[#2E5E99] opacity-40'}`}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Features Grid */}
      <section id="services" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black font-ethiopic text-[#0D2440]">{t('features')}</h2>
              <p className="text-xl text-[#2E5E99] font-ethiopic leading-relaxed">Everything you need to lead your church into the future, built with cutting-edge 3D architecture.</p>
            </div>
            <Button variant="outline" className={`rounded-2xl border-[#2E5E99]/20 py-6 px-10 ${theme === 'dark' ? 'text-white' : 'text-[#2E5E99]'}`}>{t('exploreEcosystem')}</Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: t('membersTitle'), desc: t('membersDesc'), icon: Users, color: 'from-[#2E5E99] to-[#7BA4D0]' },
              { title: t('planningTitle'), desc: t('planningDesc'), icon: Calendar, color: 'from-[#7BA4D0] to-[#2E5E99]' },
              { title: t('reportsTitle'), desc: t('reportsDesc'), icon: BarChart3, color: 'from-[#2E5E99] to-[#0D2440]' },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-[#2E5E99]/10 bg-white shadow-xl border-[#2E5E99]/5">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-8 shadow-2xl`}>
                    <f.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 font-ethiopic text-[#0D2440]">{f.title}</h3>
                  <p className="text-lg text-[#0D2440]/70 font-ethiopic leading-relaxed mb-8">{f.desc}</p>
                  <div className="flex items-center gap-2 text-[#2E5E99] font-bold group/btn cursor-pointer">
                    {t('learnMoreLink')}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-2" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Ecosystem */}
      <footer id="contact" className={`pt-32 pb-12 transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440]/90 border-t border-white/5' : 'bg-white border-t border-[#2E5E99]/10'}`}>
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-4 gap-16 mb-24">
            <div className="col-span-1 lg:col-span-1 space-y-8">
              <div className="flex items-center gap-3">
                <img src={logo} alt="MahibereAhaw" className="h-12 w-12 rounded-2xl shadow-lg" />
                <span className="text-2xl font-black text-[#2E5E99]">MAHIBERE AHAW</span>
              </div>
              <p className={`font-ethiopic leading-loose ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/70'}`}>
                {t('footerDescription')}
              </p>
              <div className="flex gap-4">
                {[MessageSquare, Bell, Heart, Mail].map((Icon, i) => (
                  <button key={i} className="p-4 rounded-2xl bg-[#2E5E99]/5 hover:bg-[#2E5E99] hover:text-white transition-all duration-300 group">
                    <Icon className="h-5 w-5 text-[#2E5E99] group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 col-span-1 lg:col-span-3 gap-12">
              <div className="space-y-6">
                <h5 className="text-xs font-black uppercase tracking-[0.3em] text-[#2E5E99]">{t('platform')}</h5>
                <ul className={`space-y-4 ${theme === 'dark' ? 'text-white/50' : 'text-[#0D2440]/50'}`}>
                  {[t('platformDashboard'), t('platformCommunity'), t('platformAnalytics'), t('platformSecurity')].map(l => (
                    <li key={l}><a href="#" className="hover:text-[#2E5E99] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-xs font-black uppercase tracking-[0.3em] text-[#7BA4D0]">{t('support')}</h5>
                <ul className={`space-y-4 ${theme === 'dark' ? 'text-white/50' : 'text-[#0D2440]/50'}`}>
                  {[t('supportDocumentation'), t('supportApiReference'), t('supportHelpCenter'), t('supportStatus')].map(l => (
                    <li key={l}><a href="#" className="hover:text-[#2E5E99] transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1 space-y-6">
                <h5 className="text-xs font-black uppercase tracking-[0.3em] text-[#2E5E99]">{t('stayConnected')}</h5>
                <div className="flex gap-2">
                  <input type="text" placeholder={t('emailPlaceholder')} className="w-full bg-[#2E5E99]/5 border border-[#2E5E99]/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#2E5E99]" />
                  <Button className="rounded-2xl p-4 bg-[#2E5E99]"><ArrowRight /></Button>
                </div>
              </div>
            </div>
          </div>

          <div className={`flex flex-col md:flex-row justify-between items-center pt-12 border-t border-[#2E5E99]/5 text-[10px] uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white/30' : 'text-[#0D2440]/30'}`}>
            <p>{t('copyrightText')}</p>
            <div className="flex gap-12 mt-8 md:mt-0 font-bold">
              <a href="#" className="hover:text-[#2E5E99]">{t('privacyArchitecture')}</a>
              <a href="#" className="hover:text-[#2E5E99]">{t('termsOfFaith')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
