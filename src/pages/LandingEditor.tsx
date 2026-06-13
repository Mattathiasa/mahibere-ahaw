import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, Plus, Trash2, ArrowLeft, Eye, Loader2,
  CheckCircle2, AlertCircle, Type, Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  landingContentService,
  DEFAULT_LANDING_CONTENT,
  deepMerge,
  type LandingContent,
  type LandingFeature,
  type LandingStat,
  type LandingBank,
  type MultiLangLandingContent,
} from '@/services/landingContent';
import { invalidateLandingCache } from '@/hooks/useLandingContent';
import { pageStringsService, type AllLanguageOverrides } from '@/services/pageStrings';
import { integrationsService, DEFAULT_INTEGRATIONS, type IntegrationsConfig } from '@/services/integrations';
import { uploadToCloudinary, optimized } from '@/services/cloudinary';
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload';
import { invalidateTranslationCache } from '@/hooks/useTranslation';
import { translations, type Language } from '@/i18n/translations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocalizationEditor } from '@/components/LocalizationEditor';

// ─── Constants ────────────────────────────────────────────────────────────────

const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { value: 'om', label: 'Afaan Oromoo', flag: '🇪🇹' },
  { value: 'ti', label: 'ትግርኛ', flag: '🇪🇹' },
];

// ─── Tiny field wrapper ───────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

const LandingEditor: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── State ─────────────────────────────────────────────────────────────────
  const [allContent, setAllContent] = useState<MultiLangLandingContent>({});
  const [activeLang, setActiveLang] = useState<Language>('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Page strings (UI translations)
  const [pageStrings, setPageStrings] = useState<AllLanguageOverrides>({});
  const [stringsLang, setStringsLang] = useState<Language>('en');
  const [savingStrings, setSavingStrings] = useState(false);

  // Integrations (Cloudinary) + hero image upload state
  const [integrations, setIntegrations] = useState<IntegrationsConfig>(DEFAULT_INTEGRATIONS);
  const [savingIntegrations, setSavingIntegrations] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([landingContentService.getAll(), pageStringsService.get(), integrationsService.get()])
      .then(([landing, strings, integ]) => {
        setAllContent(landing);
        setPageStrings(strings);
        setIntegrations(integ);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveIntegrations() {
    setSavingIntegrations(true);
    try {
      await integrationsService.save(integrations, user?.email ?? 'admin');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSavingIntegrations(false);
    }
  }

  async function handleHeroImageUpload(file: File) {
    setUploadError(null);
    setUploadingHero(true);
    try {
      const result = await uploadToCloudinary(file, integrationsService.toCloudinary(integrations), 'mahibere-ahaw/hero');
      setHero('imageUrl', result.secureUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingHero(false);
    }
  }

  // ── Derived: content for the active language (merged with defaults) ────────
  const content: LandingContent = deepMerge(
    (DEFAULT_LANDING_CONTENT[activeLang] ?? DEFAULT_LANDING_CONTENT.en) as unknown as Record<string, unknown>,
    ((allContent[activeLang] ?? {}) as unknown as Record<string, unknown>)
  ) as unknown as LandingContent;

  // ── Updaters ──────────────────────────────────────────────────────────────

  function patch(updater: (prev: LandingContent) => LandingContent) {
    setAllContent((prev) => ({
      ...prev,
      [activeLang]: updater(
        deepMerge(
          (DEFAULT_LANDING_CONTENT[activeLang] ?? DEFAULT_LANDING_CONTENT.en) as unknown as Record<string, unknown>,
          ((prev[activeLang] ?? {}) as unknown as Record<string, unknown>)
        ) as unknown as LandingContent
      ),
    }));
  }

  function setHero(key: keyof LandingContent['hero'], value: string) {
    patch((c) => ({ ...c, hero: { ...c.hero, [key]: value } }));
  }
  function addCarouselImage(url: string) {
    patch((c) => ({ ...c, carousel: [...(c.carousel ?? []), url] }));
  }
  function removeCarouselImage(i: number) {
    patch((c) => ({ ...c, carousel: (c.carousel ?? []).filter((_, idx) => idx !== i) }));
  }
  function setFooter(key: keyof LandingContent['footer'], value: string) {
    patch((c) => ({ ...c, footer: { ...c.footer, [key]: value } }));
  }
  function setSupport(key: keyof LandingContent['support'], value: string) {
    patch((c) => ({ ...c, support: { ...c.support, [key]: value } }));
  }
  function setFeaturesSection(key: 'sectionTitle' | 'sectionDescription', value: string) {
    patch((c) => ({ ...c, features: { ...c.features, [key]: value } }));
  }

  // Stats
  function updateStat(i: number, key: keyof LandingStat, value: string) {
    patch((c) => {
      const stats = [...c.stats];
      stats[i] = { ...stats[i], [key]: value };
      return { ...c, stats };
    });
  }
  function addStat() {
    patch((c) => ({ ...c, stats: [...c.stats, { label: 'New Stat', value: '0', icon: 'Shield' }] }));
  }
  function removeStat(i: number) {
    patch((c) => ({ ...c, stats: c.stats.filter((_, idx) => idx !== i) }));
  }

  // Features
  function updateFeature(i: number, key: keyof LandingFeature, value: string) {
    patch((c) => {
      const items = [...c.features.items];
      items[i] = { ...items[i], [key]: value };
      return { ...c, features: { ...c.features, items } };
    });
  }
  function addFeature() {
    patch((c) => ({
      ...c,
      features: {
        ...c.features,
        items: [...c.features.items, { id: `feature-${Date.now()}`, title: 'New Feature', description: '', icon: 'Sparkles' }],
      },
    }));
  }
  function removeFeature(i: number) {
    patch((c) => ({ ...c, features: { ...c.features, items: c.features.items.filter((_, idx) => idx !== i) } }));
  }

  // Banks
  function updateBank(i: number, key: keyof LandingBank, value: string) {
    patch((c) => {
      const banks = [...c.support.banks];
      banks[i] = { ...banks[i], [key]: value };
      return { ...c, support: { ...c.support, banks } };
    });
  }
  function addBank() {
    patch((c) => ({ ...c, support: { ...c.support, banks: [...c.support.banks, { name: 'Bank Name', account: '' }] } }));
  }
  function removeBank(i: number) {
    patch((c) => ({ ...c, support: { ...c.support, banks: c.support.banks.filter((_, idx) => idx !== i) } }));
  }

  // ── Save landing content ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await landingContentService.saveAll(allContent, user?.email ?? 'admin');
      invalidateLandingCache();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  // ── Save page string overrides ────────────────────────────────────────────
  async function handleSaveStrings() {
    setSavingStrings(true);
    try {
      await pageStringsService.save(pageStrings, user?.email ?? 'admin');
      invalidateTranslationCache();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSavingStrings(false);
    }
  }

  function setStringOverride(key: string, value: string) {
    setPageStrings((prev) => ({
      ...prev,
      [stringsLang]: { ...(prev[stringsLang] ?? {}), [key]: value },
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-bold">Site Content Editor</h1>
              {allContent.meta?.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last saved: {new Date(allContent.meta.updatedAt).toLocaleString()} by {allContent.meta.updatedBy}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Status banners */}
        {saveStatus === 'success' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Changes saved and live.
          </motion.div>
        )}
        {saveStatus === 'error' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> Failed to save. Check your connection.
          </motion.div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* ── Top-level tabs: Landing Content vs UI Translations ── */}
        <Tabs defaultValue="landing">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="landing" className="flex-1 gap-2">
              <Globe className="h-4 w-4" /> Landing Page Content
            </TabsTrigger>
            <TabsTrigger value="localization" className="flex-1 gap-2">
              <Type className="h-4 w-4" /> UI Translations
            </TabsTrigger>
          </TabsList>

          {/* ════════════════════════════════════════════════════════════════
              LANDING PAGE CONTENT TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="landing">

            {/* Language switcher */}
            <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-muted/40 border border-border">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-muted-foreground">Editing language:</span>
              <div className="flex gap-2 flex-wrap">
                {LANGUAGES.map(({ value, label, flag }) => (
                  <button
                    key={value}
                    onClick={() => setActiveLang(value)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all border ${
                      activeLang === value
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    {flag} {label}
                  </button>
                ))}
              </div>
              <Badge variant="outline" className="ml-auto text-xs">
                {LANGUAGES.find(l => l.value === activeLang)?.flag} {LANGUAGES.find(l => l.value === activeLang)?.label}
              </Badge>
            </div>

            {/* Section tabs */}
            <Tabs defaultValue="hero">
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="hero">Hero</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="support">Support & Banks</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
              </TabsList>

              {/* ── Hero ── */}
              <TabsContent value="hero">
                <Card>
                  <CardHeader>
                    <CardTitle>Hero Section</CardTitle>
                    <CardDescription>The main banner visitors see first.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <Field label="Badge text" hint="Small pill above the title">
                      <Input value={content.hero.badge} onChange={(e) => setHero('badge', e.target.value)} />
                    </Field>
                    <Field label="Main title">
                      <Input value={content.hero.title} onChange={(e) => setHero('title', e.target.value)} />
                    </Field>
                    <Field label="Highlighted title (gradient, optional)" hint="Appears below main title in gradient color">
                      <Input value={content.hero.titleHighlight} onChange={(e) => setHero('titleHighlight', e.target.value)} placeholder="Leave blank to hide" />
                    </Field>
                    <Field label="Description">
                      <Textarea rows={4} value={content.hero.description} onChange={(e) => setHero('description', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Primary button label">
                        <Input value={content.hero.ctaPrimary} onChange={(e) => setHero('ctaPrimary', e.target.value)} />
                      </Field>
                      <Field label="Secondary button label">
                        <Input value={content.hero.ctaSecondary} onChange={(e) => setHero('ctaSecondary', e.target.value)} />
                      </Field>
                    </div>

                    <SectionDivider label="Hero image (Cloudinary)" />
                    <div className="space-y-3">
                      {content.hero.imageUrl ? (
                        <div className="relative w-full max-w-md">
                          <img src={optimized(content.hero.imageUrl, 600)} alt="Hero" className="w-full rounded-xl border border-border" />
                          <Button type="button" variant="outline" size="sm" className="mt-2"
                            onClick={() => setHero('imageUrl', '')}>
                            Remove image
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No custom image — the bundled default is shown. Upload one to override (web &amp; mobile).</p>
                      )}
                      <div className="flex items-center gap-3">
                        <input
                          id="hero-upload" type="file" accept="image/*" className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHeroImageUpload(f); e.target.value = ''; }}
                        />
                        <Button type="button" variant="secondary" disabled={uploadingHero}
                          onClick={() => document.getElementById('hero-upload')?.click()}>
                          {uploadingHero ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          {uploadingHero ? 'Uploading…' : 'Upload hero image'}
                        </Button>
                        <span className="text-xs text-muted-foreground">Stored on Cloudinary, optimized on delivery.</span>
                      </div>
                      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

                      <details className="rounded-lg border border-border p-3">
                        <summary className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                          Cloudinary settings
                        </summary>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                          <Field label="Cloud name">
                            <Input value={integrations.cloudinaryCloudName}
                              onChange={(e) => setIntegrations({ ...integrations, cloudinaryCloudName: e.target.value })}
                              placeholder="your-cloud-name" />
                          </Field>
                          <Field label="Upload preset (unsigned)">
                            <Input value={integrations.cloudinaryUploadPreset}
                              onChange={(e) => setIntegrations({ ...integrations, cloudinaryUploadPreset: e.target.value })}
                              placeholder="mahibere-ahaw" />
                          </Field>
                        </div>
                        <Button type="button" size="sm" className="mt-3" disabled={savingIntegrations} onClick={handleSaveIntegrations}>
                          {savingIntegrations ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                          Save Cloudinary settings
                        </Button>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          In Cloudinary: Settings → Upload → set the <b>mahibere-ahaw</b> preset's Signing Mode to <b>Unsigned</b>, then paste its name and your cloud name here.
                        </p>
                      </details>
                    </div>

                    <SectionDivider label="Photo carousel (4-5 images)" />
                    <div className="space-y-3">
                      {(content.carousel ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {(content.carousel ?? []).map((url, i) => (
                            <div key={i} className="relative">
                              <img src={optimized(url, 240)} alt={`Slide ${i + 1}`} className="h-24 w-36 object-cover rounded-lg border border-border" />
                              <button type="button" onClick={() => removeCarouselImage(i)}
                                className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 shadow hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <CloudinaryImageUpload
                        value=""
                        onChange={(url) => { if (url) addCarouselImage(url); }}
                        folder="mahibere-ahaw/carousel"
                        label="Add carousel image"
                        variant="wide"
                      />
                      <p className="text-[11px] text-muted-foreground">Uploaded images appear in an auto-advancing carousel on the home page. Recommended 4-5 landscape images.</p>
                    </div>

                    <SectionDivider label="Floating stat cards" />
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Card 1 (top-right)</p>
                        <Field label="Value">
                          <Input value={content.hero.statsCard1Value} onChange={(e) => setHero('statsCard1Value', e.target.value)} />
                        </Field>
                        <Field label="Label">
                          <Input value={content.hero.statsCard1Label} onChange={(e) => setHero('statsCard1Label', e.target.value)} />
                        </Field>
                      </div>
                      <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Card 2 (bottom-left)</p>
                        <Field label="Value">
                          <Input value={content.hero.statsCard2Value} onChange={(e) => setHero('statsCard2Value', e.target.value)} />
                        </Field>
                        <Field label="Label">
                          <Input value={content.hero.statsCard2Label} onChange={(e) => setHero('statsCard2Label', e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Stats ── */}
              <TabsContent value="stats">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Statistics Bar</CardTitle>
                      <CardDescription>The 4-column numbers strip below the hero.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={addStat}>
                      <Plus className="h-4 w-4 mr-1" /> Add Stat
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Icon must be a Lucide icon name: <code className="bg-muted px-1 rounded">MapPin</code>, <code className="bg-muted px-1 rounded">Shield</code>, <code className="bg-muted px-1 rounded">Heart</code>, <code className="bg-muted px-1 rounded">Languages</code>, <code className="bg-muted px-1 rounded">Users</code>…
                    </p>
                    {content.stats.map((stat, i) => (
                      <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end p-4 rounded-xl border border-border bg-muted/20">
                        <Field label="Label">
                          <Input value={stat.label} onChange={(e) => updateStat(i, 'label', e.target.value)} />
                        </Field>
                        <Field label="Value">
                          <Input value={stat.value} onChange={(e) => updateStat(i, 'value', e.target.value)} />
                        </Field>
                        <Field label="Icon name">
                          <Input value={stat.icon} onChange={(e) => updateStat(i, 'icon', e.target.value)} />
                        </Field>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeStat(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Features ── */}
              <TabsContent value="features">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Features Section</CardTitle>
                      <CardDescription>The 3-column feature cards grid.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={addFeature}>
                      <Plus className="h-4 w-4 mr-1" /> Add Feature
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 pb-4 border-b border-border">
                      <Field label="Section title">
                        <Input value={content.features.sectionTitle} onChange={(e) => setFeaturesSection('sectionTitle', e.target.value)} />
                      </Field>
                      <Field label="Section description">
                        <Textarea rows={2} value={content.features.sectionDescription} onChange={(e) => setFeaturesSection('sectionDescription', e.target.value)} />
                      </Field>
                    </div>
                    {content.features.items.map((feature, i) => (
                      <div key={feature.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Feature {i + 1}</Badge>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeFeature(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Title">
                            <Input value={feature.title} onChange={(e) => updateFeature(i, 'title', e.target.value)} />
                          </Field>
                          <Field label="Icon name (Lucide)" hint="e.g. Users, Calendar, BarChart3">
                            <Input value={feature.icon} onChange={(e) => updateFeature(i, 'icon', e.target.value)} />
                          </Field>
                        </div>
                        <Field label="Description">
                          <Textarea rows={2} value={feature.description} onChange={(e) => updateFeature(i, 'description', e.target.value)} />
                        </Field>
                        <Field label="Link anchor" hint="e.g. members, planning, reports">
                          <Input value={feature.id} onChange={(e) => updateFeature(i, 'id', e.target.value)} />
                        </Field>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Support & Banks ── */}
              <TabsContent value="support">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Support Section Text</CardTitle>
                      <CardDescription>The giving / mission section.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Badge text">
                        <Input value={content.support.badge} onChange={(e) => setSupport('badge', e.target.value)} />
                      </Field>
                      <Field label="Section title">
                        <Input value={content.support.title} onChange={(e) => setSupport('title', e.target.value)} />
                      </Field>
                      <Field label="Description">
                        <Textarea rows={3} value={content.support.description} onChange={(e) => setSupport('description', e.target.value)} />
                      </Field>
                      <Field label="Mission card title">
                        <Input value={content.support.missionTitle} onChange={(e) => setSupport('missionTitle', e.target.value)} />
                      </Field>
                      <Field label="Mission statement (shown in quotes)">
                        <Textarea rows={3} value={content.support.missionStatement} onChange={(e) => setSupport('missionStatement', e.target.value)} />
                      </Field>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Bank Accounts</CardTitle>
                        <CardDescription>Displayed as cards in the support section.</CardDescription>
                      </div>
                      <Button size="sm" variant="outline" onClick={addBank}>
                        <Plus className="h-4 w-4 mr-1" /> Add Bank
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {content.support.banks.map((bank, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end p-3 rounded-xl border border-border bg-muted/20">
                          <Field label="Bank name">
                            <Input value={bank.name} onChange={(e) => updateBank(i, 'name', e.target.value)} />
                          </Field>
                          <Field label="Account number">
                            <Input value={bank.account} onChange={(e) => updateBank(i, 'account', e.target.value)} />
                          </Field>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeBank(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── Footer ── */}
              <TabsContent value="footer">
                <Card>
                  <CardHeader>
                    <CardTitle>Footer</CardTitle>
                    <CardDescription>Bottom section of the landing page.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Field label="Description text">
                      <Textarea rows={3} value={content.footer.description} onChange={(e) => setFooter('description', e.target.value)} />
                    </Field>
                    <Field label="Contact email">
                      <Input type="email" value={content.footer.email} onChange={(e) => setFooter('email', e.target.value)} />
                    </Field>
                    <Field label="Copyright line">
                      <Input value={content.footer.copyright} onChange={(e) => setFooter('copyright', e.target.value)} />
                    </Field>
                    <SectionDivider label="Social & contact links" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="YouTube URL">
                        <Input value={content.footer.youtube ?? ''} onChange={(e) => setFooter('youtube', e.target.value)} placeholder="https://youtube.com/@…" />
                      </Field>
                      <Field label="Telegram URL">
                        <Input value={content.footer.telegram ?? ''} onChange={(e) => setFooter('telegram', e.target.value)} placeholder="https://t.me/…" />
                      </Field>
                      <Field label="Phone number">
                        <Input value={content.footer.phone ?? ''} onChange={(e) => setFooter('phone', e.target.value)} placeholder="+251…" />
                      </Field>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>

            {/* Save button */}
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Saving…' : `Save ${LANGUAGES.find(l => l.value === activeLang)?.flag} ${LANGUAGES.find(l => l.value === activeLang)?.label} Content`}
              </Button>
            </div>
          </TabsContent>

          {/* ════════════════════════════════════════════════════════════════
              UI TRANSLATIONS TAB
          ════════════════════════════════════════════════════════════════ */}
          <TabsContent value="localization">
            <LocalizationEditor
              pageStrings={pageStrings}
              stringsLang={stringsLang}
              setStringsLang={setStringsLang}
              setStringOverride={setStringOverride}
              handleSaveStrings={handleSaveStrings}
              savingStrings={savingStrings}
            />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default LandingEditor;
