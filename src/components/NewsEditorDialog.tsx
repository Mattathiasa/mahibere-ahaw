import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Globe, Church, Image as ImageIcon, Star, Trash2 } from 'lucide-react';
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
import { optimized } from '@/services/cloudinary';

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
  const [images, setImages] = useState<string[]>([]);
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
    setImages(post?.images ?? []);
  }, [open, post]);

  function handleImageUploaded({ url }: { url: string }) {
    if (!url) return;
    setImages((prev) => (prev.includes(url) ? prev : [...prev, url]));
    // Automatically set cover image if none is set yet
    if (!coverImageUrl) setCoverImageUrl(url);
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((img) => img !== url));
    if (coverImageUrl === url) {
      const remaining = images.filter((img) => img !== url);
      setCoverImageUrl(remaining[0] ?? '');
    }
  }

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
      images,
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

        <div className="space-y-6 py-2">
          {/* Cover & Gallery Images Section */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  Main Cover Image
                </Label>
                {coverImageUrl && (
                  <span className="text-[11px] text-emerald-600 font-medium">Cover image set</span>
                )}
              </div>
              <CloudinaryImageUpload
                value={coverImageUrl}
                onChange={setCoverImageUrl}
                folder="mahibere-ahaw/news"
                variant="wide"
                label="Upload Cover Image"
              />
            </div>

            <div className="pt-3 border-t border-border/60 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-[#2E5E99]" />
                  Article Gallery Photos ({images.length})
                </Label>
              </div>

              <CloudinaryImageUpload
                onChange={(url) => { if (url) handleImageUploaded({ url }); }}
                onUploaded={handleImageUploaded}
                folder="mahibere-ahaw/news"
                variant="wide"
                multiple
                label="Add Gallery Photos"
              />

              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((imgUrl, idx) => {
                    const isCover = coverImageUrl === imgUrl;
                    return (
                      <div key={idx} className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${isCover ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20' : 'border-border'}`}>
                        <img src={optimized(imgUrl, 300)} alt="" className="w-full h-full object-cover" />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => setCoverImageUrl(imgUrl)}
                              title="Set as Cover Image"
                              className="p-1.5 rounded-full bg-amber-500 text-white hover:scale-110 transition-transform"
                            >
                              <Star className="h-3.5 w-3.5 fill-white" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(imgUrl)}
                            title="Remove photo"
                            className="p-1.5 rounded-full bg-red-600 text-white hover:scale-110 transition-transform"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {isCover && (
                          <div className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                            Cover
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
