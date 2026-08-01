import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Globe, Church } from 'lucide-react';
import {
  newsService, pickText,
  type NewsPost, type NewsInput, type LocalizedText, type NewsScope,
} from '@/services/news';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload';
import type { Language } from '@/i18n/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const LANGS: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromoo' },
  { code: 'ti', label: 'ትግርኛ' },
];

interface NewsEditorDialogProps {
  open: boolean;
  /** null creates a new post. */
  post: NewsPost | null;
  onSaved: () => void;
  onClose: () => void;
}

export const NewsEditorDialog: React.FC<NewsEditorDialogProps> = ({
  open, post, onSaved, onClose,
}) => {
  const { user } = useAuth();
  const { isHeadOffice, myAtbiyaId, myRole } = usePermissions();

  const [title, setTitle] = useState<LocalizedText>({});
  const [excerpt, setExcerpt] = useState<LocalizedText>({});
  const [body, setBody] = useState<LocalizedText>({});
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A parish author can only ever publish for their own parish — the rules
  // enforce it, so the scope is derived rather than offered as a choice.
  const scope: NewsScope = isHeadOffice ? 'global' : 'atbiya';

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTitle(post?.title ?? {});
    setExcerpt(post?.excerpt ?? {});
    setBody(post?.body ?? {});
    setCoverImageUrl(post?.coverImageUrl ?? '');
  }, [open, post]);

  function build(status: 'draft' | 'published'): NewsInput | null {
    if (!pickText(title, 'en') && !pickText(title, 'am')) {
      setError('Please give the post a title in English or Amharic.');
      return null;
    }
    if (!isHeadOffice && !myAtbiyaId) {
      setError('Your account has no parish assigned, so a parish post cannot be attributed. Ask an administrator to set your Atbiya.');
      return null;
    }
    return {
      slug: post?.slug ?? '',
      status,
      publishedAt: post?.publishedAt ?? null,
      title, excerpt, body,
      coverImageUrl,
      scope,
      atbiyaId: scope === 'atbiya' ? myAtbiyaId : null,
      atbiyaName: scope === 'atbiya'
        ? { en: user?.atbiyaName ?? '', am: user?.atbiyaName ?? '' }
        : null,
      authorId: user?.id ?? '',
      authorName: user?.fullName ?? user?.username ?? '',
      authorRole: myRole,
    };
  }

  async function save(status: 'draft' | 'published') {
    const input = build(status);
    if (!input) return;
    setSaving(true);
    setError(null);
    try {
      if (post) {
        await newsService.update(post.id, input);
        if (post.status !== status) await newsService.setStatus(post.id, status);
      } else {
        await newsService.create(input);
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the post.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {post ? 'Edit post' : 'New post'}
            <Badge variant={scope === 'global' ? 'default' : 'secondary'} className="gap-1 text-[10px]">
              {scope === 'global'
                ? <><Globe className="h-3 w-3" /> Head office</>
                : <><Church className="h-3 w-3" /> {user?.atbiyaName || 'Your parish'}</>}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Published posts appear on the public homepage. Write at least the
            English or Amharic version — the site falls back between languages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cover image
            </Label>
            <CloudinaryImageUpload
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              folder="mahibere-ahaw/news"
              variant="wide"
            />
          </div>

          <Tabs defaultValue="en">
            <TabsList className="flex-wrap h-auto">
              {LANGS.map((l) => (
                <TabsTrigger key={l.code} value={l.code} className="gap-1.5">
                  {l.label}
                  {pickText({ [l.code]: title[l.code] }, l.code) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {LANGS.map((l) => (
              <TabsContent key={l.code} value={l.code} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Title ({l.label})
                  </Label>
                  <Input
                    value={title[l.code] ?? ''}
                    onChange={(e) => setTitle((t) => ({ ...t, [l.code]: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Short summary ({l.label})
                  </Label>
                  <Textarea
                    rows={2}
                    value={excerpt[l.code] ?? ''}
                    onChange={(e) => setExcerpt((t) => ({ ...t, [l.code]: e.target.value }))}
                    placeholder="One or two sentences shown on the homepage card."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Full text ({l.label})
                  </Label>
                  <Textarea
                    rows={12}
                    value={body[l.code] ?? ''}
                    onChange={(e) => setBody((t) => ({ ...t, [l.code]: e.target.value }))}
                    placeholder="Write the article. Blank lines start a new paragraph."
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="secondary" onClick={() => save('draft')} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save draft
          </Button>
          <Button onClick={() => save('published')} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
