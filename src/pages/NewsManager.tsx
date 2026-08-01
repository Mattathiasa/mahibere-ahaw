import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Newspaper, Globe, Church,
  AlertCircle, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { newsService, pickText, type NewsPost } from '@/services/news';
import { usePermissions } from '@/contexts/PermissionContext';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useLanguage } from '@/contexts/LanguageContext';
import { NewsEditorDialog } from '@/components/NewsEditorDialog';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { optimized } from '@/services/cloudinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SectionCard } from '@/components/ui/SectionCard';

const NewsManager: React.FC = () => {
  const { can, isHeadOffice, myAtbiyaId, isSuperAdmin } = usePermissions();
  const { showElement } = useSoftwareControl();
  const { language } = useLanguage();

  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<NewsPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = isSuperAdmin || can('canManageNews');
  const canCreate = canManage && showElement('news.create');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPosts(await newsService.listForAuthor({ isHeadOffice, atbiyaId: myAtbiyaId }));
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(
        code === 'permission-denied'
          ? 'Firestore denied access to the news collection. If news was just added to this project, the updated security rules still need to be deployed (firebase deploy --only firestore:rules).'
          : 'Could not load posts. Please try again.'
      );
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [isHeadOffice, myAtbiyaId]);

  useEffect(() => { load(); }, [load]);

  const visible = posts.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [pickText(p.title, language), pickText(p.excerpt, language), p.slug, p.authorName]
      .join(' ').toLowerCase().includes(q);
  });

  async function toggleStatus(p: NewsPost) {
    setBusyId(p.id);
    setError(null);
    try {
      await newsService.setStatus(p.id, p.status === 'published' ? 'draft' : 'published');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change the status.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(p: NewsPost) {
    if (!window.confirm(`Delete "${pickText(p.title, language) || p.slug}"? This cannot be undone.`)) return;
    setBusyId(p.id);
    try {
      await newsService.remove(p.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete the post.');
    } finally {
      setBusyId(null);
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-6">
        <ConfigurablePageHeader module="news" defaultTitle="News" defaultDescription="Church news and updates." badge="Publishing" />
        <SectionCard title="Access Denied" icon={Newspaper}>
          <p className="text-muted-foreground">
            Your role does not include the "Manage News" permission. A super admin
            can grant it in Software Control → Roles.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <ConfigurablePageHeader
          module="news"
          defaultTitle="News"
          defaultDescription={
            isHeadOffice
              ? 'Write and publish news for the public homepage.'
              : 'Write news for your parish. Published posts appear on the homepage with your parish name.'
          }
          badge="Publishing"
        />
        {canCreate && (
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}
            className="bg-[#2E5E99] hover:bg-[#204a7c]">
            <Plus className="h-4 w-4 mr-2" /> New post
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors border ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:border-primary/50'}`}>
            {f}
          </button>
        ))}
        <Input placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-xs ml-auto" />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <Card className="rounded-2xl border-dashed p-12 text-center">
          <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-bold">
            {posts.length === 0 ? 'No posts yet' : `No ${filter} posts match your search`}
          </p>
          <p className="text-sm text-muted-foreground">
            {posts.length === 0
              ? 'Write your first post — it will appear in the News section of the homepage.'
              : 'Try a different filter or search term.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {visible.map((p) => (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="rounded-2xl overflow-hidden">
                  <CardContent className="p-4 flex items-start gap-4 flex-wrap">
                    {p.coverImageUrl ? (
                      <img src={optimized(p.coverImageUrl, 200)} alt=""
                        className="w-28 h-20 object-cover rounded-xl shrink-0" />
                    ) : (
                      <div className="w-28 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Newspaper className="h-6 w-6 opacity-30" />
                      </div>
                    )}

                    <div className="flex-1 min-w-[220px] space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">
                          {pickText(p.title, language) || <span className="italic text-muted-foreground">Untitled</span>}
                        </span>
                        <Badge variant={p.status === 'published' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                          {p.status}
                        </Badge>
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          {p.scope === 'global'
                            ? <><Globe className="h-2.5 w-2.5" /> Head office</>
                            : <><Church className="h-2.5 w-2.5" /> {p.atbiyaName?.en || 'Parish'}</>}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {pickText(p.excerpt, language)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.authorName}
                        {p.publishedAt && ` · published ${new Date(p.publishedAt).toLocaleDateString()}`}
                        {' · '}<code>{p.slug}</code>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {p.status === 'published' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="View on site"
                          onClick={() => window.open(`/news/${p.slug}`, '_blank')}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="text-xs" disabled={busyId === p.id}
                        onClick={() => toggleStatus(p)}>
                        {busyId === p.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : p.status === 'published'
                            ? <><EyeOff className="h-3.5 w-3.5 mr-1" /> Unpublish</>
                            : <><Eye className="h-3.5 w-3.5 mr-1" /> Publish</>}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditing(p); setDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500"
                        disabled={busyId === p.id} onClick={() => remove(p)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <NewsEditorDialog
        open={dialogOpen}
        post={editing}
        onSaved={() => { setDialogOpen(false); setEditing(null); load(); }}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
      />
    </div>
  );
};

export default NewsManager;
