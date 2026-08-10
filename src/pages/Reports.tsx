import { useState } from 'react';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { LearnMore } from '@/components/LearnMore';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, Clock, User, CheckCircle2, AlertCircle, Info, Plus, FileText, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/reports';
import { planService } from '@/services/plans';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { toDate } from '@/lib/date-utils';
import { useAuth } from '@/hooks/useAuth';

import { useFormatters } from '@/lib/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
const Reports = () => {
  const permissions = useRolePermissions();
  const { showElement } = useSoftwareControl();
  const { t: tree } = useLanguage();
  const pg = tree.pages;
  const { formatDate } = useFormatters();
  const { t } = useTranslation();
  const moduleCfg = useModuleConfig('reports');
  const [expandedReports, setExpandedReports] = useState<string[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [commentContent, setCommentContent] = useState('');
  const [formData, setFormData] = useState({
    planId: '',
    option: 'Memriya' as 'Memriya' | 'Kifil' | 'Zerf',
    timeframe: 'Weekly' as 'Weekly' | 'Monthly' | 'Annually',
    department: '',
    workPlanned: '',
    workDone: '',
    uncompletedTasks: '',
    result: '',
    attachments: [] as string[],
    recipients: [] as string[],
  });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportService.getAllReports(),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => planService.getAllPlans(),
  });

  const reports = reportsData?.reports || [];
  const plans = plansData?.plans || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      const selectedPlan = plans.find((p: any) => p.id === data.planId);
      return reportService.createReport({
        ...data,
        planName: selectedPlan?.name || 'Unknown Plan',
        authorId: user?.id,
        authorName: user?.fullName || user?.username,
        authorHierarchyLevel: user?.hierarchyLevel || 'Atbiya',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(pg.reportCreated);
      setShowCreateDialog(false);
      setFormData({
        planId: '',
        option: 'Memriya',
        timeframe: 'Weekly',
        department: '',
        workPlanned: '',
        workDone: '',
        uncompletedTasks: '',
        result: '',
        attachments: [],
        recipients: [],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create report');
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ reportId, content }: { reportId: string; content: string }) =>
      reportService.addComment(reportId, {
        content,
        authorName: user?.fullName || user?.username || 'Anonymous'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(pg.commentAdded);
      setShowCommentDialog(false);
      setCommentContent('');
      setSelectedReportId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    },
  });

  const toggleReport = (reportId: string) => {
    setExpandedReports((prev) =>
      prev.includes(reportId)
        ? prev.filter((id) => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.planId) {
      toast.error(pg.selectPlanFirst);
      return;
    }
    createMutation.mutate(formData);
  };

  const handleAddComment = (reportId: string) => {
    setSelectedReportId(reportId);
    setShowCommentDialog(true);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    commentMutation.mutate({ reportId: selectedReportId, content: commentContent });
  };

  const optionColors = {
    Memriya: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Kifil: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Zerf: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  const timeframeColors = {
    Weekly: 'bg-primary/10 text-primary',
    Monthly: 'bg-secondary/10 text-secondary',
    Annually: 'bg-accent/10 text-accent',
  };

  if (isLoadingReports) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title={t('reports')} description={t('monitoringHeaderDesc')} />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex flex-col gap-3">
          <PageHeader
            title={moduleCfg.headerTitle || t('reports')}
            description={moduleCfg.headerDescription || t('monitoringHeaderDesc')}
            badge="Performance Tracking"
          />
          <LearnMore title={moduleCfg.headerTitle || t('reports')} content={moduleCfg.learnMore} />
        </div>

        {permissions.canCreateReport && showElement('reports.create') && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="h-16 px-10 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black uppercase tracking-widest shadow-xl shadow-[#2E5E99]/20 transition-all duration-300 hover:scale-105 group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Plus className="mr-3 h-6 w-6" />
                  {t('newReport')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl">
                <DialogHeader className="p-4">
                  <DialogTitle className="text-3xl font-black text-[#0D2440] tracking-tight italic">{t('newReport')}</DialogTitle>
                  <DialogDescription className="text-lg font-bold text-slate-500">
                    Establish a record of divine progress
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8 p-4">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{t('selectPlan')}</Label>
                      <Select
                        value={formData.planId}
                        onValueChange={(value) => setFormData({ ...formData, planId: value })}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-bold">
                          <SelectValue placeholder={pg.selectTargetPlan} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {plans.map((plan: any) => (
                            <SelectItem key={plan.id} value={plan.id} className="rounded-xl font-bold">
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{t('type')}</Label>
                      <Select
                        value={formData.option}
                        onValueChange={(value: any) => setFormData({ ...formData, option: value })}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-bold">
                          <SelectValue placeholder={pg.selectEntityType} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {(moduleCfg.options.types ?? ['Memriya', 'Kifil', 'Zerf']).map((type) => (
                            <SelectItem key={type} value={type} className="rounded-xl font-bold italic">{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {(moduleCfg.fields.find((f) => f.key === 'department')?.visible ?? true) && (moduleCfg.options.departments ?? []).length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{pg.department}</Label>
                      <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                        <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-bold">
                          <SelectValue placeholder={pg.selectDepartment} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {(moduleCfg.options.departments ?? []).map((d) => (
                            <SelectItem key={d} value={d} className="rounded-xl font-bold italic">{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(moduleCfg.fields.find((f) => f.key === 'workPlanned')?.visible ?? true) && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{pg.workPlanned}</Label>
                      <Textarea
                        value={formData.workPlanned}
                        onChange={(e) => setFormData({ ...formData, workPlanned: e.target.value })}
                        placeholder={pg.workPlannedPlaceholder}
                        className="min-h-[100px] rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-medium transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{pg.workPerformed}</Label>
                    <Textarea
                      value={formData.workDone}
                      onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
                      placeholder={pg.workPerformedPlaceholder}
                      className="min-h-[120px] rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-medium transition-all"
                      required
                    />
                  </div>

                  {(moduleCfg.fields.find((f) => f.key === 'uncompletedTasks')?.visible ?? true) && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 ml-1">{pg.uncompletedTasks}</Label>
                      <Textarea
                        value={formData.uncompletedTasks}
                        onChange={(e) => setFormData({ ...formData, uncompletedTasks: e.target.value })}
                        placeholder={pg.uncompletedPlaceholder}
                        className="min-h-[100px] rounded-2xl border-none bg-rose-50 dark:bg-rose-950/20 focus:ring-2 ring-rose-400 font-medium transition-all"
                      />
                    </div>
                  )}

                  {(moduleCfg.fields.find((f) => f.key === 'results')?.visible ?? true) && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99] ml-1">{t('results')}</Label>
                      <Textarea
                        value={formData.result}
                        onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                        placeholder={pg.quantifyPlaceholder}
                        className="min-h-[120px] rounded-2xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-medium transition-all"
                        required={moduleCfg.fields.find((f) => f.key === 'results')?.required ?? false}
                      />
                    </div>
                  )}

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
                      {createMutation.isPending ? 'Committing...' : t('submit')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        )}
      </div>

      <div className="grid gap-8">
        <AnimatePresence mode="popLayout">
          {reports.length > 0 ? (
            reports.map((report: any, i: number) => (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="group overflow-hidden rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500">
                  <div className="flex flex-col lg:flex-row">
                    {/* Report Sidebar - Status Tracker */}
                    <div className="lg:w-80 p-10 bg-slate-50/50 dark:bg-slate-800/20 border-r border-white/20">
                      <div className="space-y-6">
                        <div className="h-16 w-16 rounded-2xl bg-[#2E5E99]/10 flex items-center justify-center text-[#2E5E99]">
                          <FileText className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60">{pg.submissionType}</p>
                          <Badge className={cn("px-4 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest", optionColors[report.option as keyof typeof optionColors])}>
                            {report.option}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60">{pg.registryDate}</p>
                          <div className="flex items-center gap-2 text-[#0D2440] dark:text-white font-bold">
                            <Calendar className="h-4 w-4 opacity-40" />
                            <span className="text-sm">
                              {formatDate(toDate(report.submittedAt))}
                            </span>
                          </div>
                        </div>
                        <div className="pt-6">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60 mb-3">{pg.timeframe}</p>
                          <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-inner", timeframeColors[report.timeframe as keyof typeof timeframeColors])}>
                            <Clock className="h-3.5 w-3.5" />
                            {report.timeframe}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-10 lg:p-12 space-y-10">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                          <h3 className="text-3xl font-black text-[#0D2440] dark:text-white tracking-tight italic">
                            {report.planName}
                          </h3>
                          <p className="font-bold text-[#0D2440]/40 dark:text-white/40 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-[#2E5E99]" />
                            Ref: {report.id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div className="bg-green-500/10 text-green-600 px-6 py-2 rounded-2xl flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-black uppercase tracking-[0.2em] text-[10px]">{pg.verified}</span>
                        </div>
                      </div>

                      <div className="grid gap-12 lg:grid-cols-2">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-8 bg-[#2E5E99] rounded-full" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('workDone')}</h4>
                          </div>
                          <p className="text-lg font-medium leading-relaxed italic text-slate-700 dark:text-slate-300 bg-white/30 dark:bg-black/10 p-6 rounded-[2rem] border border-white/20">
                            {report.workDone}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-8 bg-green-500 rounded-full" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('results')}</h4>
                          </div>
                          <p className="text-lg font-medium leading-relaxed italic text-slate-700 dark:text-slate-300 bg-white/30 dark:bg-black/10 p-6 rounded-[2rem] border border-white/20">
                            {report.result}
                          </p>
                        </div>
                      </div>

                      {/* Feedback & Engagement Section */}
                      <div className="pt-10 border-t border-white/20">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-[#2E5E99]/60" />
                            <span className="font-black text-xs uppercase tracking-widest opacity-40">
                              {report.comments?.length || 0} Professional Feedback{report.comments?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleAddComment(report.id)}
                            className="h-12 px-8 rounded-xl border-dashed border-2 hover:bg-[#2E5E99] hover:text-white transition-all duration-300 font-black text-xs uppercase tracking-widest"
                          >
                            {t('addComment')}
                          </Button>
                        </div>

                        <AnimatePresence mode="popLayout">
                          {report.comments?.length > 0 && (
                            <div className="mt-8 space-y-4">
                              {report.comments.map((comment: any, ci: number) => (
                                <motion.div
                                  key={comment.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: ci * 0.1 }}
                                  className="flex gap-4 group"
                                >
                                  <Avatar className="h-12 w-12 border-2 border-white/60 dark:border-black/20 shadow-xl group-hover:scale-110 transition-transform">
                                    <AvatarFallback className="font-black bg-gradient-to-br from-[#2E5E99] to-[#0D2440] text-white">
                                      {comment.authorName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 bg-white/20 dark:bg-white/5 p-6 rounded-3xl rounded-tl-none border border-white/20 relative">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-black tracking-tight flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 opacity-40" />
                                        {comment.authorName}
                                      </p>
                                      <span className="text-[10px] font-black uppercase tracking-widest opacity-30">
                                        {formatDistanceToNow(toDate(comment.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium italic opacity-70 leading-relaxed">{comment.content}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-40 bg-white/20 dark:bg-black/10 rounded-[4rem] border-2 border-dashed border-white/20"
            >
              <AlertCircle className="h-24 w-24 text-[#2E5E99]/20 mb-6" />
              <p className="text-2xl font-black text-[#0D2440]/20 dark:text-white/20 uppercase tracking-[0.3em]">{pg.archivesEmpty}</p>
              <p className="font-bold text-muted-foreground mt-2 italic">{pg.archivesEmptyDesc}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comment Submission Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="rounded-[3rem] bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight italic">{pg.contributeInsights}</DialogTitle>
            <DialogDescription className="font-bold text-slate-500">{pg.contributeInsightsDesc}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCommentSubmit} className="space-y-6 pt-4">
            <Textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={pg.feedbackPlaceholder}
              className="min-h-[150px] rounded-3xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 ring-[#2E5E99] font-medium transition-all p-6"
              required
            />
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowCommentDialog(false);
                  setCommentContent('');
                }}
                className="h-14 px-8 rounded-xl font-black"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={commentMutation.isPending}
                className="h-14 px-12 rounded-2xl bg-[#2E5E99] font-black uppercase tracking-widest shadow-xl shadow-[#2E5E99]/20"
              >
                {commentMutation.isPending ? tree.admin.busyPublishing : tree.admin.addInsight}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
