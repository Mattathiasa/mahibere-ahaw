import AnnouncementCard from '@/components/AnnouncementCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementService } from '@/services/announcements';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { PageHeader } from '@/components/ui/PageHeader';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { useAuth } from '@/hooks/useAuth';

const Announcements = () => {
  const moduleCfg = useModuleConfig('announcements');
  const showField = (k: string) => moduleCfg.fields.find((f) => f.key === k)?.visible ?? true;
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', content: '', expiresAt: '' });
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAnnouncements(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => announcementService.createAnnouncement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Announcement created and notifications sent!');
      setShowCreateDialog(false);
      setFormData({ title: '', content: '', expiresAt: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create announcement');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => announcementService.updateAnnouncement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Announcement updated successfully!');
      setShowEditDialog(false);
      setSelectedAnnouncement(null);
      setFormData({ title: '', content: '', expiresAt: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update announcement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Announcement deleted successfully!');
      setShowDeleteDialog(false);
      setSelectedAnnouncement(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete announcement');
    },
  });

  const announcements = announcementsData?.announcements || [];
  const filteredAnnouncements = announcements.filter(
    (announcement: any) =>
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData: any = {
      title: formData.title,
      content: formData.content,
      authorId: user?.id,
      authorName: user?.fullName || user?.username,
      authorHierarchyLevel: user?.hierarchyLevel || 'Atbiya',
    };

    // Only include expiresAt if it has a value
    if (formData.expiresAt && formData.expiresAt.trim() !== '') {
      // Convert datetime-local format to ISO string
      submitData.expiresAt = new Date(formData.expiresAt).toISOString();
    }

    createMutation.mutate(submitData);
  };

  const handleEdit = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : '',
    });
    setShowEditDialog(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement) return;

    const submitData: any = {
      title: formData.title,
      content: formData.content,
    };

    if (formData.expiresAt && formData.expiresAt.trim() !== '') {
      submitData.expiresAt = new Date(formData.expiresAt).toISOString();
    }

    updateMutation.mutate({ id: selectedAnnouncement.id, data: submitData });
  };

  const handleDelete = (id: string) => {
    const announcement = announcements.find((a: any) => a.id === id);
    setSelectedAnnouncement(announcement);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedAnnouncement) {
      deleteMutation.mutate(selectedAnnouncement.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title={t('announcements')} description={t('latestChurchUpdates')} />
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1">
          <ConfigurablePageHeader
            module="announcements"
            defaultTitle={t('announcements')}
            defaultDescription={t('latestChurchUpdates')}
            badge="Church Broadcast"
          />
        </div>
        <div className="flex shrink-0">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-[#2E5E99] hover:scale-105 transition-all shadow-xl shadow-[#2E5E99]/20 font-bold tracking-wide">
                <Plus className="mr-2 h-5 w-5" />
                {t('newAnnouncement')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl rounded-[2.5rem] bg-white/90 backdrop-blur-2xl border-[#2E5E99]/10">
              <DialogHeader>
                <DialogTitle className="text-3xl font-black text-[#0D2440] font-ethiopic">{t('newAnnouncement')}</DialogTitle>
                <DialogDescription className="text-lg">
                  Share important updates with the church community
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-black uppercase tracking-widest text-[#2E5E99]">{t('title')} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter announcement title"
                    className="rounded-xl border-[#2E5E99]/10 focus:border-[#2E5E99] bg-white/50 h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-black uppercase tracking-widest text-[#2E5E99]">{t('description')} *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Enter announcement content"
                    rows={6}
                    className="rounded-xl border-[#2E5E99]/10 focus:border-[#2E5E99] bg-white/50"
                    required
                  />
                </div>
                {showField('expiresAt') && (
                <div className="space-y-2">
                  <Label htmlFor="expiresAt" className="text-sm font-black uppercase tracking-widest text-[#2E5E99]">{t('expirationDate')}</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="rounded-xl border-[#2E5E99]/10 focus:border-[#2E5E99] bg-white/50 h-12"
                  />
                </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)} className="rounded-xl px-8 h-12 font-bold">
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-10 h-12 bg-[#2E5E99] font-bold">
                    {createMutation.isPending ? 'Creating...' : t('submit')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('searchAnnouncements')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {t('noAnnouncementsSearch')}
          </div>
        )}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('editAnnouncement')}</DialogTitle>
            <DialogDescription>
              {t('updateAnnouncementDesc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('title')} *</Label>
              <Input id="edit-title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter announcement title" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">{t('description')} *</Label>
              <Textarea id="edit-content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Enter announcement content" rows={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expiresAt">{t('expirationDate')}</Label>
              <Input id="edit-expiresAt" type="datetime-local" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} min={new Date().toISOString().slice(0, 16)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('updating') : t('updateAnnouncement')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteAnnouncement')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteAnnouncementConfirm')} "{selectedAnnouncement?.title}". {t('cannotUndo')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? t('loading') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Announcements;
