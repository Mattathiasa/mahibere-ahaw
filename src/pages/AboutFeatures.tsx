import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, BarChart3, ArrowLeft,
    CheckCircle2, Sparkles, Shield, Zap,
    Search, FileText, Database, Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ThreeBackground } from '@/components/ThreeBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect } from 'react';
import logo from '@/assets/logo.png';

const AboutFeatures = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const { t } = useTranslation();

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const element = document.querySelector(hash);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            }
        }
    }, []);

    const sections = [
        {
            id: 'members',
            title: 'Member Management',
            subtitle: 'The Heart of Your Ministry',
            description: 'Comprehensive tools to manage your congregation with dignity and precision. From spiritual growth tracking to ministry assignments, keep everyone connected.',
            icon: Users,
            color: 'bg-blue-500/10 text-blue-500',
            features: [
                'Detailed spiritual profiles for every member',
                'Ministry assignment and participation tracking',
                'Advanced search and filtering by region or hierarchy',
                'Secure contact and family relationship management',
                'Automated birthday and anniversary spiritual blessings'
            ],
            image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=2070"
        },
        {
            id: 'planning',
            title: 'Planning Management',
            subtitle: 'Visionary Leadership Tools',
            description: 'Strategic planning made simple. Coordinate events, manage liturgical calendars, and align your ministry goals across all levels of the church hierarchy.',
            icon: Calendar,
            color: 'bg-emerald-500/10 text-emerald-500',
            features: [
                'Dynamic liturgical calendar integration',
                'Hierarchical event coordination (Sinodos to Atbiya)',
                'Resource and venue allocation management',
                'Task delegation and progress monitoring',
                'Collaborative planning workspaces for ministries'
            ],
            image: "https://images.unsplash.com/photo-1506784911079-5214c67c530e?auto=format&fit=crop&q=80&w=2068"
        },
        {
            id: 'reports',
            title: 'Report Management',
            subtitle: 'Insightful Stewardship',
            description: 'Transform data into divine insights. Generate comprehensive reports on ministry growth, financial stewardship, and spiritual milestones with ease.',
            icon: BarChart3,
            color: 'bg-purple-500/10 text-purple-500',
            features: [
                'Real-time automated gathering of statistics',
                'Customizable report templates for all departments',
                'Financial transparency and audit-ready tools',
                'Visual growth trends and impact analytics',
                'Secure multi-level reporting submission system'
            ],
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2015"
        }
    ];

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
                        <span className="font-bold text-xs uppercase tracking-widest">Back to Home</span>
                    </Button>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-[#2E5E99]" />
                        <span className="font-black text-lg tracking-tighter">MAHIBERE AHAW</span>
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
                        Ecosystem Details
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                        Divine Tools for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E5E99] via-[#7BA4D0] to-[#2E5E99]">Modern Ministry</span>
                    </h1>
                    <p className="text-xl opacity-70 font-ethiopic leading-relaxed">
                        Discover how Mahibere Ahaw empowers your church to manage, plan, and grow in the digital age.
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
                            <div className={`w-16 h-16 rounded-2xl ${section.color} flex items-center justify-center shadow-lg border border-current`}>
                                <section.icon className="h-8 w-8" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-[#2E5E99]">{section.subtitle}</h3>
                                <h2 className="text-4xl md:text-5xl font-black font-ethiopic">{section.title}</h2>
                                <p className="text-lg opacity-80 leading-relaxed font-ethiopic">{section.description}</p>
                            </div>

                            <ul className="space-y-4">
                                {section.features.map((feature, fIdx) => (
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
                                Experience This Feature
                            </Button>
                        </div>

                        <div className={`relative group ${idx % 2 !== 0 ? 'lg:order-1' : ''}`}>
                            <div className="absolute -inset-4 bg-gradient-to-r from-[#2E5E99]/20 to-[#7BA4D0]/20 rounded-[2rem] blur-2xl group-hover:scale-110 transition-transform duration-700" />
                            <div className="relative overflow-hidden rounded-[2rem] border border-[#2E5E99]/10 shadow-2xl aspect-[4/3]">
                                <img
                                    src={section.image}
                                    alt={section.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
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
                    <h2 className="text-4xl md:text-6xl font-black font-ethiopic">Ready to Transform Your Church?</h2>
                    <p className="text-xl opacity-70 max-w-2xl mx-auto font-ethiopic">Join hundreds of congregations already using Mahibere Ahaw to lead their ministry into the future.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button size="lg" onClick={() => navigate('/login')} className="px-12 py-8 text-xl bg-[#2E5E99] rounded-2xl hover:scale-105 transition-transform">
                            Get Started Now
                        </Button>
                        <Button size="lg" variant="outline" className="px-12 py-8 text-xl border-[#2E5E99]/30 rounded-2xl hover:bg-[#2E5E99]/5">
                            Contact Support
                        </Button>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-[#2E5E99]/10 relative z-10">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Ahaw" className="h-8 w-8" />
                        <span className="font-bold text-[#2E5E99]">MAHIBERE AHAW</span>
                    </div>
                    <p className="text-xs opacity-50 uppercase tracking-widest font-bold">
                        © 2024 Mahibere Ahaw Ecosystem. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AboutFeatures;
