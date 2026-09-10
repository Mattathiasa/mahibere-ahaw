import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, User, Mic2, Tag, Plus, ArrowRight, Clock, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { sermonService, resolveSermonField } from '@/services/sermons';
import { SermonServiceType } from '@/types';
import { CreateSermonDialog } from '@/components/CreateSermonDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { motion, AnimatePresence } from 'framer-motion';

import { useFormatters } from '@/lib/formatters';
import { useLanguage } from '@/contexts/LanguageContext';
const Sermons = () => {
    const { t } = useTranslation();
    const { t: tree, language } = useLanguage();
    const pg = tree.pages;
    const { formatDate } = useFormatters();
    const { showElement } = useSoftwareControl();
    const rolePerms = useRolePermissions();
    const queryClient = useQueryClient();
    // Permission/element keys stay 'Teaching'-named internally — see the
    // comment at the top of src/services/sermons.ts.
    const canCreateTeaching = rolePerms.canCreateTeaching && showElement('teachings.create');
    const canEditTeaching = rolePerms.canEditTeaching && showElement('teachings.edit');
    const canDeleteTeaching = rolePerms.canDeleteTeaching && showElement('teachings.delete');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
    const { data: sermons, isLoading } = useQuery({
        queryKey: ['sermons'],
        queryFn: () => sermonService.getAllSermons(),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => sermonService.deleteSermon(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sermons'] });
            toast.success(pg.sermonDeleted ?? 'Sermon deleted.');
            setDeleteTarget(null);
        },
        onError: () => toast.error('Failed to delete sermon'),
    });

    const openCreate = () => { setEditing(null); setDialogOpen(true); };
    const openEdit = (sermon: any) => { setEditing(sermon); setDialogOpen(true); };

    return (
        <div className="space-y-12 animate-in fade-in duration-700 ease-out pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <ConfigurablePageHeader
                    module="teachings"
                    defaultTitle={t('sermons')}
                    defaultDescription={t('sermonsHeaderDesc')}
                    badge="Wisdom & Grace"
                />
                {canCreateTeaching && (
                    <Button
                        onClick={openCreate}
                        className="h-14 px-8 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black shadow-xl shadow-[#2E5E99]/20 active:scale-95 transition-all gap-2"
                    >
                        <Plus className="h-6 w-6" />
                        {t('create')}
                    </Button>
                )}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <LoadingSkeleton type="card" count={6} />
                ) : sermons && sermons.length > 0 ? (
                    <AnimatePresence>
                        {sermons.map((sermon: any, i: number) => (
                            <motion.div
                                key={sermon._id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="group relative rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/60 dark:border-white/10 overflow-hidden hover:shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500 flex flex-col h-full border-2 hover:border-[#2E5E99]/30">
                                    <div className="relative h-64 w-full overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
                                        <img
                                            src={sermon.featuredImage || 'https://images.unsplash.com/photo-1544427928-c49cdfb81949?auto=format&fit=crop&q=80'}
                                            alt={sermon.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <Badge className={`absolute top-6 left-6 z-20 h-8 px-4 font-black uppercase tracking-widest bg-white/90 text-[#0D2440] border-none backdrop-blur-md`}>
                                            {t(sermon.serviceType?.toLowerCase() as any)}
                                        </Badge>
                                    </div>

                                    <CardHeader className="relative z-20 -mt-12 mx-6 rounded-[2rem] bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-xl p-6 group-hover:-translate-y-2 transition-transform duration-500">
                                        <div className="flex justify-end items-start mb-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2E5E99]/60">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(sermon.dateDelivered)}
                                            </div>
                                        </div>
                                        <CardTitle className="text-2xl font-black text-[#0D2440] dark:text-white leading-tight mb-2 tracking-tight group-hover:text-[#2E5E99] transition-colors">
                                            {resolveSermonField(sermon, 'title', language)}
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2 font-semibold text-[#0D2440]/60 dark:text-white/40">
                                            {resolveSermonField(sermon, 'shortDescription', language)}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="px-8 pb-8 flex-1 flex flex-col justify-between mt-4">
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {sermon.tags?.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="text-[10px] font-black uppercase tracking-widest bg-[#2E5E99]/5 text-[#2E5E99] px-3 py-1 rounded-full border border-[#2E5E99]/10">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-[#2E5E99]/10">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2E5E99] to-[#7BA4D0] flex items-center justify-center text-white shadow-lg">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60">{t('speaker')}</p>
                                                    <p className="text-sm font-black text-[#0D2440] dark:text-white">{sermon.speaker}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {canEditTeaching && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEdit(sermon)}
                                                        className="rounded-full hover:bg-[#2E5E99] hover:text-white transition-all shadow-md"
                                                        aria-label={t('edit')}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canDeleteTeaching && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteTarget(sermon)}
                                                        className="rounded-full hover:bg-red-500 hover:text-white transition-all shadow-md"
                                                        aria-label={t('delete')}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-[#2E5E99] hover:text-white transition-all shadow-md group-hover:translate-x-1">
                                                    <ArrowRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center rounded-[3rem] bg-white/20 dark:bg-black/20 backdrop-blur-md border border-dashed border-[#2E5E99]/30">
                        <div className="p-8 rounded-full bg-[#2E5E99]/10 text-[#2E5E99] mb-8 animate-pulse">
                            <BookOpen className="h-16 w-16" />
                        </div>
                        <h3 className="text-3xl font-black text-[#0D2440] dark:text-white tracking-tighter mb-4 italic">{pg.noSermons}</h3>
                        <p className="text-xl font-bold text-[#2E5E99]/60 max-w-md text-center">{pg.noSermonsHint}</p>
                    </div>
                )}
            </div>
            <CreateSermonDialog
                open={dialogOpen}
                onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
                sermon={editing}
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('delete')}</AlertDialogTitle>
                        <AlertDialogDescription>{pg.deleteSermonConfirm}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{tree.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id ?? deleteTarget._id)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {t('delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Sermons;
