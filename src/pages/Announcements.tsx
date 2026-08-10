import AnnouncementCard from '@/components/AnnouncementCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementService, type AnnouncementAudience } from '@/services/announcements';
import { usePermissions } from '@/contexts/PermissionContext';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { PageHeader } from '@/components/ui/PageHeader';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { useAuth } from '@/hooks/useAuth';

import { useLanguage } from '@/contexts/LanguageContext';
const Announcements = () => {
  const moduleCfg = useModuleConfig('announcements');
  const { showElement } = useSoftwareControl();
  const { t: tree } = useLanguage();
  const pg = tree.pages;
  const rolePerms = useRolePermissions();
  const canCreateAnnouncement = rolePerms.canCreateAnnouncement && showElement('announcements.create');
  const showField = (k: string) => moduleCfg.fields.find((f) => f.key === k)?.visible ?? true;
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', content: '', expiresAt: '' });
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // ── Who the announcement goes to ──────────────────────────────────────────
  // A member has no Announcements page, so this is the only way the message
  // reaches them: it is turned into one notification per recipient.
  const { myAtbiyaId, isHeadOffice, roles, roleLabel } = usePermissions();
  const [audienceKind, setAudienceKind] = useState<AnnouncementAudience['kind']>(
    isHeadOffice ? 'everyone' : 'parish'
  );
  const [audienceRoles, setAudienceRoles] = useState<string[]>([]);

  function buildAudience(): AnnouncementAudience {
    if (audienceKind === 'roles' && audienceRoles.length > 0) {
      return { kind: 'roles', roles: audienceRoles };
    }
    // Falling back to 'everyone' when a parish-scoped author has no parish
    // avoids silently sending to nobody.
    if (audienceKind === 'parish' && myAtbiyaId) {
      return { kind: 'parish', atbiyaId: myAtbiyaId };
    }
    return { kind: 'everyone' };
  }

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementService.getAnnouncements(),
  });

  const createMutation = useMutation({
    /**
     * Posts the announcement, then delivers it. The delivery count is reported
     * honestly — this toast used to claim notifications had been sent when the
     * app had never sent one.
     */
    mutationFn: async (data: any) => {
      const created = await announcementService.createAnnouncement(data);
      try {
        const sent = await announcementService.broadcast(
          { id: created.id, title: data.title, content: data.content },
          data.audience,
          { id: user?.id, name: user?.fullName || user?.username }
        );
        return { sent, delivered: true as const };
      } catch {
        // The announcement itself is posted and must not be rolled back; only
        // delivery failed, and that is worth saying out loud.
        return { sent: 0, delivered: false as const };
      }
    },
    onSuccess: ({ sent, delivered }) => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (!delivered) {
        toast.warning(pg.announcementPostedNoNotify);
      } else if (sent === 0) {
        toast.success(pg.announcementPostedNoAudience);
      } else {
        toast.success(`Announcement posted and sent to ${sent} ${sent === 1 ? 'person' : 'people'}.`);
      }
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
      toast.success(pg.announcementUpdated);
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
      toast.success(pg.announcementDeleted);
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
      audience: buildAudience(),
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
            {canCreateAnnouncement && (
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-[#2E5E99] hover:scale-105 transition-all shadow-xl shadow-[#2E5E99]/20 font-bold tracking-wide">
                  <Plus className="mr-2 h-5 w-5" />
                  {t('newAnnouncement')}
                </Button>
              </DialogTrigger>
            )}
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
                    placeholder={pg.announcementTitlePlaceholder}
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
                    placeholder={pg.announcementContentPlaceholder}
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

                {/* Delivery. Members never open this page — this is how they
                    receive the announcement at all. */}
                <div className="space-y-2">
                  <Label className="text-sm font-black uppercase tracking-widest text-[#2E5E99]">
                    Send to
                  </Label>
                  <Select value={audienceKind} onValueChange={(v) => setAudienceKind(v as AnnouncementAudience['kind'])}>
                    <SelectTrigger className="rounded-xl border-[#2E5E99]/10 bg-white/50 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {myAtbiyaId && <SelectItem value="parish">{pg.audienceMyAtbiya}</SelectItem>}
                      <SelectItem value="everyone">{pg.audienceEveryone}</SelectItem>
                      <SelectItem value="roles">{pg.audienceChosenRoles}</SelectItem>
                    </SelectContent>
                  </Select>

                  {audienceKind === 'roles' && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {roles.filter((r) => r.active !== false).map((r) => {
                        const on = audienceRoles.includes(r.key);
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => setAudienceRoles((prev) =>
                              on ? prev.filter((k) => k !== r.key) : [...prev, r.key]
                            )}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              on
                                ? 'bg-[#2E5E99] text-white border-[#2E5E99]'
                                : 'bg-white border-[#2E5E99]/20 hover:border-[#2E5E99]/50'}`}
                          >
                            {roleLabel(r.key)}
                          </button>
                        );
                      })}
                      {audienceRoles.length === 0 && (
                        <p className="text-[11px] text-muted-foreground w-full">
                          Pick at least one role, or this will go to everyone.
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Each recipient gets this as a notification. Members read
                    announcements there rather than on this page.
                  </p>
                </div>

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
