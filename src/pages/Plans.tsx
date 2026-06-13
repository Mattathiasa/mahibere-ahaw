import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, Search, Trash2, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planService } from '@/services/plans';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { RecipientSelector } from '@/components/ui/recipient-selector';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toDate } from '@/lib/date-utils';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { LearnMore } from '@/components/LearnMore';

const Plans = () => {
  const moduleCfg = useModuleConfig('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    timeframe: 'Weekly' as 'Weekly' | 'Monthly' | 'Annually',
    details: '',
    attachments: [] as string[],
    recipients: [] as string[]
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      planService.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Strategy propagated successfully!');
      setShowCreateDialog(false);
      setFormData({ name: '', timeframe: 'Weekly', details: '', attachments: [], recipients: [] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to establish plan');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => planService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plan archived successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Archive failed');
    },
  });

  const frequencyColors = {
    Weekly: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    Monthly: 'bg-[#2E5E99]/10 text-[#2E5E99] border-[#2E5E99]/20',
    Annually: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  const plans = plansData?.plans || [];
  const filteredPlans = plans.filter(
    (plan: any) =>
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      createdBy: {
        id: user?.id,
        fullName: user?.fullName || user?.username,
        hierarchyLevel: user?.hierarchyLevel
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-10 animate-pulse">
        <PageHeader title={t('plans')} description={t('planningHeaderDesc')} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-[3rem] bg-white/40 dark:bg-slate-900/40 border border-white/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex flex-col gap-3">
          <PageHeader
            title={moduleCfg.headerTitle || t('plans')}
            description={moduleCfg.headerDescription || t('planningHeaderDesc')}
            badge="Strategic Planning"
          />
          <LearnMore title={moduleCfg.headerTitle || t('plans')} content={moduleCfg.learnMore} />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="h-16 px-10 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black uppercase tracking-widest shadow-xl shadow-[#2E5E99]/20 transition-all duration-300 hover:scale-105 group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Plus className="mr-3 h-6 w-6" />
                {t('newPlan')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl">
              <DialogHeader className="p-4">
                <DialogTitle className="text-3xl font-black text-[#0D2440] tracking-tight italic">{t('newPlan')}</DialogTitle>
                <DialogDescription className="text-lg font-bold text-slate-500">
                  Establish a new strategic roadmap for ministry
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8 p-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{t('planName')}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Divine Mission Phase One"
                    className="h-16 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 text-lg font-bold focus:ring-2 ring-[#2E5E99] transition-all"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{t('period')}</Label>
                  <Select
                    value={formData.timeframe}
                    onValueChange={(value: any) => setFormData({ ...formData, timeframe: value })}
                  >
                    <SelectTrigger className="h-16 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-bold">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {(moduleCfg.options.periods ?? ['Weekly', 'Monthly', 'Annually']).map((period) => (
                        <SelectItem key={period} value={period} className="rounded-xl font-bold italic">
                          {period === 'Weekly' ? t('weekly') : period === 'Monthly' ? t('monthly') : period === 'Annually' ? t('annually') : period}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(() => {
                  const detailsField = moduleCfg.fields.find((f) => f.key === 'details');
                  if (detailsField && !detailsField.visible) return null;
                  return (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{t('description')}</Label>
                      <Textarea
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        placeholder="Detail the divine objectives and spiritual milestones..."
                        className="min-h-[150px] rounded-3xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-medium transition-all p-6"
                        required={detailsField?.required ?? false}
                      />
                    </div>
                  );
                })()}

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowCreateDialog(false)}
                    className="h-14 px-8 rounded-xl font-black text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="h-14 px-12 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black uppercase tracking-widest shadow-xl shadow-[#2E5E99]/20"
                  >
                    {createMutation.isPending ? 'Propagating...' : t('submit')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* Premium Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative group/search"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-[#2E5E99]/20 to-[#0D2440]/20 rounded-[2rem] blur-xl opacity-0 group-hover/search:opacity-100 transition-opacity duration-500" />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-[#2E5E99]/50 group-focus-within/search:text-[#2E5E99] transition-colors" />
        <Input
          placeholder="Search spiritual roadmaps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="relative pl-16 h-20 rounded-[2rem] border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl text-xl font-medium tracking-tight italic placeholder:text-slate-400 focus:ring-4 ring-[#2E5E99]/10 shadow-2xl transition-all"
        />
      </motion.div>

      {/* Plans Grid - High Fidelity Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        {filteredPlans.length > 0 ? (
          filteredPlans.map((plan: any, i: number) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group relative overflow-hidden rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500 border-2 hover:border-[#2E5E99]/20">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#204a7c] to-[#2E5E99] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="p-10 pb-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="space-y-3">
                      <CardTitle className="text-3xl font-black text-[#0D2440] dark:text-white tracking-tight italic line-clamp-2 leading-tight">
                        {plan.name}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-[#0D2440]/40 dark:text-white/40">
                        <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-4 py-2 rounded-xl border border-white/40">
                          <User className="h-4 w-4 text-[#2E5E99]" />
                          <span>{plan.createdBy?.fullName || 'Steward'}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 px-4 py-2 rounded-xl border border-white/40">
                          <Calendar className="h-4 w-4 text-[#2E5E99]" />
                          <span>{formatDistanceToNow(toDate(plan.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={cn("px-6 py-2 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl", frequencyColors[plan.timeframe as keyof typeof frequencyColors])}>
                      {plan.timeframe}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-10 pt-0 space-y-10">
                  <div className="relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-1 bg-[#2E5E99]/20 rounded-full" />
                    <p className="text-xl font-medium leading-relaxed italic text-slate-700 dark:text-slate-300 bg-white/30 dark:bg-black/10 p-8 rounded-[2.5rem] border border-white/20">
                      {plan.details}
                    </p>
                  </div>

                  {plan.attachments && plan.attachments.length > 0 && (
                    <div className="flex items-center gap-4 text-sm font-black text-[#2E5E99] bg-[#2E5E99]/5 w-fit px-6 py-3 rounded-2xl border border-[#2E5E99]/10">
                      <Paperclip className="h-5 w-5" />
                      <span className="tracking-widest">{plan.attachments.length} ATTACHED DOCUMENTS</span>
                    </div>
                  )}

                  <div className="flex gap-4 pt-6 border-t border-white/20">
                    <Button
                      variant="outline"
                      className="h-14 flex-1 rounded-2xl bg-[#0D2440] text-white hover:bg-[#1a3a5f] border-none font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02]"
                      onClick={() => toast.info('Expanding strategy details...')}
                    >
                      Explore Strategy
                    </Button>
                    <Button
                      variant="destructive"
                      className="h-14 w-14 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all duration-300 border-none group"
                      onClick={() => handleDelete(plan.id, plan.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-40 bg-white/20 dark:bg-black/10 rounded-[4rem] border-2 border-dashed border-white/20"
          >
            <Search className="h-24 w-24 text-[#2E5E99]/20 mb-6" />
            <p className="text-2xl font-black text-[#0D2440]/20 dark:text-white/20 uppercase tracking-[0.3em]">No roadmaps discovered</p>
            <p className="font-bold text-muted-foreground mt-2 italic">Try a different spiritual search query</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Plans;
