import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, Scale, Shield, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion } from 'framer-motion';

import { useLanguage } from '@/contexts/LanguageContext';
const HigeDenb = () => {
  const { t } = useTranslation();
  const { t: tree } = useLanguage();
  const pg = tree.pages;
  const rules = [
    {
      id: '1',
      title: pg.higeDenbGovernanceTitle,
      icon: Shield,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      content:
        pg.higeDenbGovernanceBody,
    },
    {
      id: '2',
      title: pg.higeDenbReportingTitle,
      icon: FileText,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      content:
        pg.higeDenbReportingBody,
    },
    {
      id: '3',
      title: pg.higeDenbConductTitle,
      icon: BookOpen,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      content:
        pg.higeDenbConductBody,
    },
    {
      id: '4',
      title: pg.higeDenbCommunicationTitle,
      icon: Scale,
      color: 'text-[#2E5E99]',
      bg: 'bg-[#2E5E99]/10',
      content:
        pg.higeDenbCommunicationBody,
    },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 ease-out pb-20">
      <ConfigurablePageHeader
        module="higeDenb"
        defaultTitle={t('higeDenb')}
        defaultDescription={t('higeDenbHeaderDesc')}
        badge="Sacred Order"
      />

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {rules.map((rule, i) => {
          const Icon = rule.icon;
          return (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group relative h-full flex flex-col rounded-[2.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 hover:shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500 overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 ${rule.bg} rounded-bl-full opacity-20 group-hover:scale-150 transition-transform duration-700`} />
                <CardHeader className="relative pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${rule.bg} ${rule.color} shadow-inner`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-2xl font-black text-[#0D2440] dark:text-white tracking-tight">{rule.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="relative flex-1">
                  <p className="text-[#0D2440]/70 dark:text-white/70 leading-relaxed font-semibold italic text-lg px-2">
                    {rule.content}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Info Card - Premium Gradient */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#204a7c] to-[#2E5E99] text-white border-none shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
            <Sparkles className="h-64 w-64" />
          </div>
          <CardHeader className="relative">
            <CardTitle className="text-3xl font-black flex items-center gap-3 tracking-tighter italic">
              <BookOpen className="h-8 w-8" />
              {t('importantNotice')}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-white/90 leading-loose text-xl font-medium max-w-4xl italic">
              These regulations are based on the canonical laws of the Ethiopian Orthodox Tewahedo
              Church and should be followed by all members. For detailed information about specific
              rules or to request clarification, please contact your local Memriya representative or
              higher church authority.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default HigeDenb;
