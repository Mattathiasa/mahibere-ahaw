import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, BarChart3, ArrowLeft,
    CheckCircle2, Sparkles, Shield, Zap,
    Search, FileText, Database, Layers,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThreeBackground } from '@/components/ThreeBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeaturesContent } from '@/hooks/useFeaturesContent';
import { colorClass } from '@/services/featuresContent';
import { optimized } from '@/services/cloudinary';
import { BrandMark } from '@/components/BrandMark';

/** Icon name -> component, so an admin can change the icon from a text field. */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Users, Calendar, BarChart3, CheckCircle2, Sparkles, Shield, Zap,
    Search, FileText, Database, Layers,
};

function DynamicIcon({ name, className }: { name: string; className?: string }) {
    const Icon = ICON_MAP[name] ?? Sparkles;
    return <Icon className={className} />;
}

const AboutFeatures = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { content, loaded } = useFeaturesContent();
    const sections = content.sections ?? [];

    // Re-run once the content resolves: the target section does not exist in
    // the DOM until then, so scrolling on mount alone silently did nothing.
    useEffect(() => {
        if (!loaded) return;
        const hash = window.location.hash;
        if (!hash) return;
        const id = window.setTimeout(() => {
            document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return () => window.clearTimeout(id);
    }, [loaded]);

    return (
        <div className={`min-h-screen relative overflow-hidden transition-colors duration-700 ${theme === 'dark' ? 'bg-[#0D2440] text-white' : 'bg-[#E7F0FA] text-[#0D2440]'}`}>
            <ThreeBackground />

            {/* Header */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-[#2E5E99]/10 py-4">
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="gap-2 rounded-xl group"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span className="font-bold text-xs uppercase tracking-widest">{content.backLabel}</span>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#2E5E99]" />
                        <span className="font-black text-lg tracking-tighter">{content.brand}</span>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 pt-32 pb-20 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2E5E99]/10 border border-[#2E5E99]/20 text-[#2E5E99] text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                        <Layers className="h-3 w-3" />
                        {content.badge}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        {content.title} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E5E99] via-[#7BA4D0] to-[#2E5E99]">{content.titleHighlight}</span>
                    </h1>
                    <p className="text-xl opacity-70 font-ethiopic leading-relaxed">
                        {content.subtitle}
                    </p>
                </motion.div>

                {sections.map((section, idx) => (
                    <motion.section
                        key={section.id}
                        id={section.id}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className={`py-20 grid lg:grid-cols-2 gap-16 items-center ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
                    >
                        <div className={`space-y-8 ${idx % 2 !== 0 ? 'lg:order-2' : ''}`}>
                            <div className={`w-16 h-16 rounded-2xl ${colorClass(section.color)} flex items-center justify-center shadow-lg border border-current`}>
                                <DynamicIcon name={section.icon} className="h-8 w-8" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[#2E5E99]">{section.subtitle}</h3>
                                <h2 className="text-4xl md:text-5xl font-black font-ethiopic">{section.title}</h2>
                                <p className="text-lg opacity-80 leading-relaxed font-ethiopic">{section.description}</p>
                            </div>

                            <ul className="space-y-4">
                                {(section.bullets ?? []).map((feature, fIdx) => (
                                    <motion.li
                                        key={fIdx}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + (fIdx * 0.1) }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="p-1 rounded-full bg-[#2E5E99]/20">
                                            <CheckCircle2 className="h-4 w-4 text-[#2E5E99]" />
                                        </div>
                                        <span className="font-ethiopic font-medium">{feature}</span>
                                    </motion.li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => navigate('/login')}
                                className="bg-[#2E5E99] hover:bg-[#1a3a60] text-white px-10 py-6 rounded-2xl font-bold shadow-xl transition-all hover:scale-105"
                            >
                                {section.ctaLabel}
                            </Button>
                        </div>

                        <div className={`relative group ${idx % 2 !== 0 ? 'lg:order-1' : ''}`}>
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#2E5E99]/20 to-[#7BA4D0]/20 rounded-[2rem] blur-2xl group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative overflow-hidden rounded-[2rem] border border-[#2E5E99]/10 shadow-2xl aspect-[4/3]">
                                {section.imageUrl ? (
                                    <img
                                        src={optimized(section.imageUrl, 1200)}
                                        alt={section.title}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#2E5E99]/10">
                                        <DynamicIcon name={section.icon} className="h-16 w-16 text-[#2E5E99]/30" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0D2440]/60 to-transparent" />
                                <div className="absolute bottom-8 left-8">
                                    <div className="flex gap-2">
                                        <div className="w-8 h-1 rounded-full bg-[#2E5E99]" />
                                        <div className="w-4 h-1 rounded-full bg-white/30" />
                                        <div className="w-4 h-1 rounded-full bg-white/30" />
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Icons */}
                            <div className="absolute -top-6 -right-6 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-[#2E5E99]/10 shadow-xl lg:flex hidden">
                                <Zap className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-[#2E5E99]/10 shadow-xl lg:flex hidden">
                                <Shield className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </motion.section>
                ))}
            </main>

            {/* Call to Action */}
            <section className="py-24 bg-[#2E5E99]/5 border-y border-[#2E5E99]/10 relative z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#2E5E99]/10 blur-[100px] rounded-full -mr-48 -mt-48" />
                <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
                    <h2 className="text-4xl md:text-6xl font-black font-ethiopic">{content.cta.title}</h2>
                    <p className="text-xl opacity-70 max-w-2xl mx-auto font-ethiopic">{content.cta.description}</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button size="lg" onClick={() => navigate('/login')} className="px-12 py-8 text-xl bg-[#2E5E99] rounded-2xl hover:scale-105 transition-transform">
                            {content.cta.primaryLabel}
                        </Button>
                        <Button size="lg" variant="outline" onClick={() => navigate('/#contact')}
                            className="px-12 py-8 text-xl border-[#2E5E99]/30 rounded-2xl hover:bg-[#2E5E99]/5">
                            {content.cta.secondaryLabel}
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-[#2E5E99]/10 relative z-10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <BrandMark size="sm" />
                        <span className="font-bold text-[#2E5E99]">{content.brand}</span>
                    </div>
                    <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
                        {content.footer}
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AboutFeatures;
