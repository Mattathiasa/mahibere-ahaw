import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, LucideIcon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface PageHeaderProps {
    title: string;
    description: string;
    icon?: LucideIcon;
    badge?: string;
}

export const PageHeader = ({ title, description, badge = 'Divine Stewardship' }: PageHeaderProps) => {
    const { theme } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative group p-8 rounded-[2rem] bg-white/40 dark:bg-[#0D2440]/40 backdrop-blur-3xl border border-white/20 dark:border-white/5 shadow-xl overflow-hidden mb-10"
        >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#2E5E99]/5 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] text-[9px] font-black uppercase tracking-widest border border-[#2E5E99]/20 shadow-inner">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    {badge}
                </div>
                <div className="space-y-1">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-[#0D2440] dark:text-white font-ethiopic leading-tight">
                        {title}
                    </h1>
                    <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white/60' : 'text-[#0D2440]/60'}`}>
                        {description}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
