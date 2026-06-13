import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Gavel, AlertCircle, ShieldCheck, Scale, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

const ChurchLaws = () => {
    const { t } = useTranslation();

    return (
        <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
            <ConfigurablePageHeader
                module="churchRules"
                defaultTitle={t('churchRules')}
                defaultDescription={t('churchRulesHeaderDesc')}
                badge="Canonical Law"
            />

            <Tabs defaultValue="guidelines" className="space-y-8">
                <TabsList className="bg-white/40 dark:bg-black/20 p-1.5 rounded-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl h-auto flex flex-wrap gap-2">
                    <TabsTrigger value="guidelines" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#2E5E99] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold">
                        General Guidelines
                    </TabsTrigger>
                    <TabsTrigger value="prohibitions" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold">
                        Prohibitions (Kelkelowich)
                    </TabsTrigger>
                    <TabsTrigger value="obligations" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold">
                        Obligations (Gidetawoch)
                    </TabsTrigger>
                    <TabsTrigger value="administration" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold">
                        Admin Rules
                    </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <TabsContent value="guidelines">
                            <Card className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-2xl overflow-hidden">
                                <CardHeader className="border-b border-white/20 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-2xl font-black text-[#0D2440] dark:text-white tracking-tight">
                                        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
                                            <Book className="h-6 w-6" />
                                        </div>
                                        Living Guidelines
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8">
                                    <ScrollArea className="h-[500px] pr-6">
                                        <div className="space-y-8">
                                            {[
                                                { title: '1. Sunday Worship', desc: 'All members are expected to attend Sunday worship services regularly with devotion and humility.', icon: Sparkles },
                                                { title: '2. Community Service', desc: 'Members are encouraged to participate in at least one community service activity per month to manifest the love of Christ in action.', icon: Heart },
                                                { title: '3. Spiritual Growth', desc: 'Active participation in Bible studies, fasting periods, and sacraments is vital for the spiritual maturity of every believer.', icon: ShieldCheck }
                                            ].map((item, i) => (
                                                <div key={i} className="group relative p-6 rounded-3xl bg-white/40 dark:bg-slate-800/40 border border-white/20 hover:bg-[#2E5E99]/5 transition-all duration-300">
                                                    <h3 className="font-black text-xl mb-3 flex items-center gap-2 text-[#0D2440] dark:text-white">
                                                        <item.icon className="h-5 w-5 text-[#2E5E99]/60" />
                                                        {item.title}
                                                    </h3>
                                                    <p className="text-[#0D2440]/70 dark:text-white/70 leading-relaxed font-medium text-lg italic">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="prohibitions">
                            <Card className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-2xl overflow-hidden">
                                <CardHeader className="border-b border-white/20 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-2xl font-black text-rose-500 tracking-tight">
                                        <div className="p-3 rounded-2xl bg-rose-500/10">
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        Prohibited Actions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8 px-8">
                                    <div className="grid gap-6">
                                        {[
                                            'Disruptive behavior during services that hinders the spiritual peace of the congregation.',
                                            'Misuse or mishandling of church funds, property, or sacred items.',
                                            'Public defamation, gossip, or causing division among church leadership or members.',
                                            'Non-compliance with the established canonical practices and traditions.'
                                        ].map((rule, i) => (
                                            <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                                                <div className="mt-1 h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
                                                <p className="text-lg font-bold text-[#0D2440]/80 dark:text-white/80">{rule}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="obligations">
                            <Card className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-2xl overflow-hidden">
                                <CardHeader className="border-b border-white/20 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-2xl font-black text-emerald-500 tracking-tight">
                                        <div className="p-3 rounded-2xl bg-emerald-500/10">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        Membership Obligations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-8 px-8">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        {[
                                            { title: 'Tithe (Asrat)', desc: 'Faithful and regular contribution of the tithe for church operations.' },
                                            { title: 'Mahderat', desc: 'Devout participation in the assigned Small Group (Mahderat).' },
                                            { title: 'Respect', desc: 'Honor and submission to the hierarchy and spiritual leadership.' },
                                            { title: 'Purity', desc: 'Maintaining spiritual and moral purity in personal and public life.' }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10">
                                                <h4 className="font-black text-lg text-emerald-600 mb-2">{item.title}</h4>
                                                <p className="font-semibold text-[#0D2440]/70 dark:text-white/70 italic">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="administration">
                            <Card className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                                    <Gavel className="h-48 w-48" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-2xl font-black text-[#0D2440] dark:text-white tracking-tight">
                                        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                                            <Gavel className="h-6 w-6" />
                                        </div>
                                        Administrative Rules
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <p className="text-xl font-bold text-[#0D2440]/70 dark:text-white/70 leading-relaxed italic max-w-2xl px-2">
                                        Rules regarding elections, appointments, and financial management follow the strict guidelines of the Central Council. Transparency and divine accountability are the pillars of our administration.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </motion.div>
                </AnimatePresence>
            </Tabs>
        </div>
    );
};

export default ChurchLaws;
