import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Users, Flag, Sparkles } from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

const StrategicPlan = () => {
    const { t } = useTranslation();
    const { data: goals, isLoading } = useQuery({
        queryKey: ['strategic-goals'],
        queryFn: async () => {
            const response = await api.get('/strategic-plans');
            return response.data;
        },
    });

    // Mock data if no backend data yet
    const mockGoals = [
        {
            id: 1,
            title: '50 Million Members in 50 Years',
            description: 'Our long term vision for church growth and evangelism.',
            targetYear: 2075,
            currentValue: 1200000,
            targetValue: 50000000,
            unit: 'Members',
        },
        {
            id: 2,
            title: 'Plant 10,000 New Churches',
            description: 'Establishing new places of worship across the region.',
            targetYear: 2030,
            currentValue: 2450,
            targetValue: 10000,
            unit: 'Churches',
        }
    ];

    const displayGoals = goals && goals.length > 0 ? goals : mockGoals;

    return (
        <div className="space-y-12 animate-in fade-in duration-700 ease-out pb-20">
            <PageHeader
                title={t('strategicPlan')}
                description={t('strategicPlanHeaderDesc')}
                badge="Divine Vision"
            />

            <div className="grid gap-10">
                {displayGoals.map((goal: any, i: number) => {
                    const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));

                    return (
                        <motion.div
                            key={goal._id || goal.id}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.2 }}
                        >
                            <Card className="group relative overflow-hidden rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-2xl hover:shadow-primary/10 transition-all duration-700">
                                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700">
                                    <Target className="h-48 w-48" />
                                </div>

                                <CardHeader className="relative p-10 border-b border-white/20">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-[#2E5E99] to-[#7BA4D0] text-white shadow-xl shadow-[#2E5E99]/20">
                                                    <Flag className="h-8 w-8" />
                                                </div>
                                                <CardTitle className="text-3xl font-black text-[#0D2440] dark:text-white tracking-tight italic">
                                                    {goal.title}
                                                </CardTitle>
                                            </div>
                                            <CardDescription className="text-xl font-semibold text-[#0D2440]/60 dark:text-white/50 max-w-2xl leading-relaxed italic">
                                                {goal.description}
                                            </CardDescription>
                                        </div>
                                        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-xl min-w-[200px] text-center lg:text-right">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99]/60">{t('targetYear')}</span>
                                            <p className="text-5xl font-black text-[#2E5E99] tracking-tighter mt-1">{goal.targetYear}</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-10 bg-gradient-to-b from-transparent to-[#2E5E99]/5">
                                    <div className="space-y-8">
                                        <div className="flex items-end justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60">{t('progressToDate')}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-6xl font-black text-[#0D2440] dark:text-white tracking-tighter">{percentage}%</span>
                                                    <div className="h-10 w-10 p-2 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center animate-bounce">
                                                        <TrendingUp className="h-6 w-6" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="hidden sm:block text-right">
                                                <p className="text-sm font-bold opacity-60 italic mb-2">Steady spiritual growth</p>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 4, 5].map(dot => (
                                                        <div key={dot} className={`h-2 w-2 rounded-full ${percentage >= dot * 20 ? 'bg-emerald-500' : 'bg-[#2E5E99]/10'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative pt-4">
                                            <Progress value={percentage} className="h-6 rounded-full bg-[#2E5E99]/10" />
                                            {/* Glowing indicator */}
                                            <motion.div
                                                className="absolute top-4 left-0 h-6 bg-gradient-to-r from-transparent to-white/40 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-8 pt-6">
                                            <div className="p-8 rounded-[2.5rem] bg-white/60 dark:bg-slate-800/60 border border-white/40 shadow-lg group-hover:translate-y-[-4px] transition-transform duration-500">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60 mb-2">{t('current')} {goal.unit}</p>
                                                <p className="text-4xl font-black text-[#0D2440] dark:text-white tracking-tighter">{goal.currentValue.toLocaleString()}</p>
                                            </div>
                                            <div className="p-8 rounded-[2.5rem] bg-[#2E5E99] text-white shadow-xl shadow-[#2E5E99]/20 group-hover:translate-y-[-4px] transition-transform duration-500 delay-75">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">{t('target')} {goal.unit}</p>
                                                <p className="text-4xl font-black tracking-tighter">{goal.targetValue.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default StrategicPlan;
