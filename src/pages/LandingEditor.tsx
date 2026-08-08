import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save, Plus, Trash2, ArrowLeft, Eye, Loader2,
  CheckCircle2, AlertCircle, Type, Globe,
  ArrowUp, ArrowDown, Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  landingContentService,
  DEFAULT_LANDING_CONTENT,
  deepMerge,
  featureLinkTarget,
  type LandingContent,
  type LandingFeature,
  type LandingStat,
  type LandingBank,
  type LandingBelief,
  type LandingValue,
  type LandingLink,
  type MultiLangLandingContent,
} from '@/services/landingContent';
import { invalidateLandingCache } from '@/hooks/useLandingContent';
import { galleryService, EMPTY_GALLERY, type Gallery, type GalleryImage } from '@/services/gallery';
import { invalidateGalleryCache } from '@/hooks/useGallery';
import {
  featuresContentService,
  DEFAULT_FEATURES_CONTENT,
  FEATURE_COLOR_KEYS,
  type FeaturesContent,
  type FeatureSection,
  type MultiLangFeaturesContent,
} from '@/services/featuresContent';
import { invalidateFeaturesCache } from '@/hooks/useFeaturesContent';
import { pageStringsService, type AllLanguageOverrides } from '@/services/pageStrings';
import { integrationsService, DEFAULT_INTEGRATIONS, type IntegrationsConfig } from '@/services/integrations';
import { uploadToCloudinary, optimized } from '@/services/cloudinary';
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload';
import { BrandedLoader } from '@/components/BrandedLoader';
import { invalidateTranslationCache } from '@/hooks/useTranslation';
import { translations, type Language } from '@/i18n/translations';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
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

/** Every link field on this page accepts the same three forms. */
const LINK_HINT =
  'An in-app path (/news), a section anchor (#contact), or a full https:// address, which opens in a new tab.';

/** One editable footer link column — heading plus label/URL rows. */
function FooterLinkEditor({
  title, heading, onHeading, links, onChange, onAdd, onRemove,
}: {
  title: string;
  heading: string;
  onHeading: (value: string) => void;
  links: LandingLink[];
  onChange: (i: number, key: keyof LandingLink, value: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="secondary">{title}</Badge>
        <Button size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add link
        </Button>
      </div>
      <Field label="Column heading">
        <Input value={heading} onChange={(e) => onHeading(e.target.value)} />
      </Field>
      {(links ?? []).map((link, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Field label="Label">
            <Input value={link.label} onChange={(e) => onChange(i, 'label', e.target.value)} />
          </Field>
          <Field label="Link">
            <Input value={link.url} onChange={(e) => onChange(i, 'url', e.target.value)} placeholder="/dashboard" />
          </Field>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
            onClick={() => onRemove(i)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────────────────

const LandingEditor: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshTranslations } = useLanguage();

  // ── State ─────────────────────────────────────────────────────────────────
  const [allContent, setAllContent] = useState<MultiLangLandingContent>({});
  /** Not per-language: photographs are shared, only captions are translated. */
  const [gallery, setGallery] = useState<Gallery>(EMPTY_GALLERY);
  const [featuresContent, setFeaturesContent] = useState<MultiLangFeaturesContent>({});
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
    Promise.all([
      landingContentService.getAll(), pageStringsService.get(),
      integrationsService.get(), galleryService.get(), featuresContentService.getAll(),
    ])
      .then(([landing, strings, integ, gal, features]) => {
        setAllContent(landing);
        setPageStrings(strings);
        setIntegrations(integ);
        setGallery(gal);
        setFeaturesContent(features);
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
  // ── /features page ─────────────────────────────────────────────────────────
  // Same merge-on-edit shape as `patch` above: the first edit in a language
  // materialises the whole default tree, so a saved document is never partial.
  const fp: FeaturesContent = deepMerge(
    (DEFAULT_FEATURES_CONTENT[activeLang] ?? DEFAULT_FEATURES_CONTENT.en) as unknown as Record<string, unknown>,
    ((featuresContent[activeLang] ?? {}) as unknown as Record<string, unknown>)
  ) as unknown as FeaturesContent;

  function patchFeatures(updater: (prev: FeaturesContent) => FeaturesContent) {
    setFeaturesContent((prev) => ({
      ...prev,
      [activeLang]: updater(
        deepMerge(
          (DEFAULT_FEATURES_CONTENT[activeLang] ?? DEFAULT_FEATURES_CONTENT.en) as unknown as Record<string, unknown>,
          ((prev[activeLang] ?? {}) as unknown as Record<string, unknown>)
        ) as unknown as FeaturesContent
      ),
    }));
  }

  function setFp(key: 'badge' | 'title' | 'titleHighlight' | 'subtitle' | 'backLabel' | 'brand' | 'footer', value: string) {
    patchFeatures((c) => ({ ...c, [key]: value }));
  }
  function setFpCta(key: keyof FeaturesContent['cta'], value: string) {
    patchFeatures((c) => ({ ...c, cta: { ...c.cta, [key]: value } }));
  }
  function updateFeatureSection(i: number, key: keyof FeatureSection, value: string) {
    patchFeatures((c) => {
      const sections = [...c.sections];
      sections[i] = { ...sections[i], [key]: value };
      return { ...c, sections };
    });
  }
  function addFeatureSection() {
    patchFeatures((c) => ({
      ...c,
      sections: [...c.sections, {
        id: `section-${Date.now()}`, title: 'New Section', subtitle: '', description: '',
        icon: 'Sparkles', color: 'blue', bullets: [], imageUrl: '',
        ctaLabel: 'Experience This Feature',
      }],
    }));
  }
  function removeFeatureSection(i: number) {
    patchFeatures((c) => ({ ...c, sections: c.sections.filter((_, idx) => idx !== i) }));
  }
  function setSectionBullet(i: number, bIdx: number, value: string) {
    patchFeatures((c) => {
      const sections = [...c.sections];
      const bullets = [...(sections[i].bullets ?? [])];
      bullets[bIdx] = value;
      sections[i] = { ...sections[i], bullets };
      return { ...c, sections };
    });
  }
  function addSectionBullet(i: number) {
    patchFeatures((c) => {
      const sections = [...c.sections];
      sections[i] = { ...sections[i], bullets: [...(sections[i].bullets ?? []), ''] };
      return { ...c, sections };
    });
  }
  function removeSectionBullet(i: number, bIdx: number) {
    patchFeatures((c) => {
      const sections = [...c.sections];
      sections[i] = { ...sections[i], bullets: (sections[i].bullets ?? []).filter((_, idx) => idx !== bIdx) };
      return { ...c, sections };
    });
  }

  // ── Gallery ────────────────────────────────────────────────────────────────
  // Language-independent, so these sit outside `patch` and its per-language
  // content entirely.
  function addGalleryImage(image: GalleryImage) {
    setGallery((g) => ({ ...g, images: [...g.images, image] }));
  }
  function removeGalleryImage(i: number) {
    setGallery((g) => ({ ...g, images: g.images.filter((_, idx) => idx !== i) }));
  }
  function setGalleryCaption(i: number, lang: Language, value: string) {
    setGallery((g) => {
      const images = [...g.images];
      images[i] = { ...images[i], caption: { ...images[i].caption, [lang]: value } };
      return { ...g, images };
    });
  }
  /** Order is the display order on the home page, so it has to be editable. */
  function moveGalleryImage(i: number, delta: number) {
    setGallery((g) => {
      const target = i + delta;
      if (target < 0 || target >= g.images.length) return g;
      const images = [...g.images];
      [images[i], images[target]] = [images[target], images[i]];
      return { ...g, images };
    });
  }
  function setFooter(key: keyof LandingContent['footer'], value: string | boolean) {
    patch((c) => ({ ...c, footer: { ...c.footer, [key]: value } }));
  }
  function setNews(key: keyof LandingContent['news'], value: string | number) {
    patch((c) => ({ ...c, news: { ...c.news, [key]: value } }));
  }
  /** The two footer link columns share one shape, so one set of updaters. */
  function updateFooterLink(
    list: 'platformLinks' | 'supportLinks', i: number, key: keyof LandingLink, value: string
  ) {
    patch((c) => {
      const links = [...c.footer[list]];
      links[i] = { ...links[i], [key]: value };
      return { ...c, footer: { ...c.footer, [list]: links } };
    });
  }
  function addFooterLink(list: 'platformLinks' | 'supportLinks') {
    patch((c) => ({ ...c, footer: { ...c.footer, [list]: [...c.footer[list], { label: '', url: '' }] } }));
  }
  function removeFooterLink(list: 'platformLinks' | 'supportLinks', i: number) {
    patch((c) => ({ ...c, footer: { ...c.footer, [list]: c.footer[list].filter((_, idx) => idx !== i) } }));
  }
  function setContact(key: keyof LandingContent['contact'], value: string) {
    patch((c) => ({ ...c, contact: { ...c.contact, [key]: value } }));
  }
  /** Phones and emails are plain string lists — one editable row each. */
  function setContactListItem(key: 'phones' | 'emails', i: number, value: string) {
    patch((c) => {
      const list = [...(c.contact[key] ?? [])];
      list[i] = value;
      return { ...c, contact: { ...c.contact, [key]: list } };
    });
  }
  function addContactListItem(key: 'phones' | 'emails') {
    patch((c) => ({ ...c, contact: { ...c.contact, [key]: [...(c.contact[key] ?? []), ''] } }));
  }
  function removeContactListItem(key: 'phones' | 'emails', i: number) {
    patch((c) => ({ ...c, contact: { ...c.contact, [key]: (c.contact[key] ?? []).filter((_, idx) => idx !== i) } }));
  }
  function setSupport(key: keyof LandingContent['support'], value: string) {
    patch((c) => ({ ...c, support: { ...c.support, [key]: value } }));
  }
  /** About holds translated strings plus the belief and value card lists. */
  function setAbout(
    key: keyof NonNullable<LandingContent['about']>,
    value: string | LandingBelief[] | LandingValue[]
  ) {
    patch((c) => ({
      ...c,
      about: {
        ...(c.about ?? DEFAULT_LANDING_CONTENT.en.about!),
        [key]: value,
      },
    }));
  }
  function setFeaturesSection(key: 'sectionTitle' | 'sectionDescription', value: string) {
    patch((c) => ({ ...c, features: { ...c.features, [key]: value } }));
  }

  // ── Feature link validation ────────────────────────────────────────────────
  /**
   * Which feature cards point at a `/features#…` anchor that no section on the
   * /features page actually has.
   *
   * Only `/features#…` targets are checked: an in-app path or an external URL
   * is the admin's business, but a broken anchor is always a mistake and one
   * that silently does nothing when clicked.
   */
  const featureSectionIds = new Set(fp.sections.map((sec) => sec.id.trim()).filter(Boolean));
  const brokenFeatureLinks = content.features.items
    .map((item, index) => ({ item, index, target: featureLinkTarget(item) }))
    .filter(({ target }) => target.startsWith('/features#'))
    .filter(({ target }) => !featureSectionIds.has(target.slice('/features#'.length)))
    .map(({ item, index, target }) => ({
      index,
      title: item.title || `Feature ${index + 1}`,
      target,
    }));

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
    // A card whose anchor names no section on /features scrolls nowhere, and
    // the mistake is invisible until someone clicks it on the live site.
    if (brokenFeatureLinks.length > 0) {
      setSaveStatus('error');
      return;
    }
    setSaving(true);
    setSaveStatus('idle');
    try {
      // Saved together so one press of Save publishes everything on this page,
      // including the gallery, which lives in its own document.
      await Promise.all([
        landingContentService.saveAll(allContent, user?.email ?? 'admin'),
        galleryService.save(gallery, user?.email ?? 'admin'),
        featuresContentService.saveAll(featuresContent, user?.email ?? 'admin'),
      ]);
      invalidateLandingCache();
      invalidateGalleryCache();
      invalidateFeaturesCache();
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
      // Two caches read this document: the flat `t('key')` map, and the nested
      // tree LanguageContext hands to `useLanguage().t` — which is what the
      // landing page renders. Both have to be told, or the save appears to do
      // nothing until a full reload.
      invalidateTranslationCache();
      await refreshTranslations();
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
    return <BrandedLoader variant="app" message="Loading site content…" />;
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
            <Button onClick={handleSave} disabled={saving || brokenFeatureLinks.length > 0} size="sm">
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
        {brokenFeatureLinks.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-amber-800 text-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  Saving is blocked: {brokenFeatureLinks.length} feature link
                  {brokenFeatureLinks.length !== 1 ? 's point' : ' points'} to a section that does not exist.
                </p>
                <ul className="list-disc pl-5 mt-1">
                  {brokenFeatureLinks.map(({ index, title, target }) => (
                    <li key={index}>
                      <b>{title}</b> → <code>{target}</code>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px]">
                  Fix the anchor under Features, or add a matching section under
                  Features Page. Available: {[...featureSectionIds].join(', ') || '(none)'}
                </p>
              </div>
            </div>
          </div>
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
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="about">About & Faith</TabsTrigger>
                <TabsTrigger value="news">News</TabsTrigger>
                <TabsTrigger value="support">Support & Banks</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
                <TabsTrigger value="featuresPage">Features Page</TabsTrigger>
              </TabsList>

              {/* ── /features page ── */}
              <TabsContent value="featuresPage">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Features Page</CardTitle>
                      <CardDescription>
                        Everything on the public /features page, in{' '}
                        {LANGUAGES.find((l) => l.value === activeLang)?.label}. The
                        feature cards on the home page link here by anchor.
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={addFeatureSection}>
                      <Plus className="h-4 w-4 mr-1" /> Add Section
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 pb-4 border-b border-border">
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Badge"><Input value={fp.badge} onChange={(e) => setFp('badge', e.target.value)} /></Field>
                        <Field label="Brand"><Input value={fp.brand} onChange={(e) => setFp('brand', e.target.value)} /></Field>
                        <Field label="Heading"><Input value={fp.title} onChange={(e) => setFp('title', e.target.value)} /></Field>
                        <Field label="Heading highlight" hint="The gradient second line."><Input value={fp.titleHighlight} onChange={(e) => setFp('titleHighlight', e.target.value)} /></Field>
                        <Field label="Back link label"><Input value={fp.backLabel} onChange={(e) => setFp('backLabel', e.target.value)} /></Field>
                      </div>
                      <Field label="Subtitle"><Textarea rows={2} value={fp.subtitle} onChange={(e) => setFp('subtitle', e.target.value)} /></Field>
                    </div>

                    {fp.sections.map((section, i) => (
                      // key by index: the anchor below is editable, and keying
                      // on it would remount the row and drop focus per keystroke.
                      <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">Section {i + 1}</Badge>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                            onClick={() => removeFeatureSection(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Title"><Input value={section.title} onChange={(e) => updateFeatureSection(i, 'title', e.target.value)} /></Field>
                          <Field label="Subtitle"><Input value={section.subtitle} onChange={(e) => updateFeatureSection(i, 'subtitle', e.target.value)} /></Field>
                          <Field label="Icon name (Lucide)" hint="Users, Calendar, BarChart3, Shield, Zap…">
                            <Input value={section.icon} onChange={(e) => updateFeatureSection(i, 'icon', e.target.value)} />
                          </Field>
                          <Field label="Accent colour">
                            <Select value={section.color} onValueChange={(v) => updateFeatureSection(i, 'color', v)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FEATURE_COLOR_KEYS.map((c) => (
                                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>
                        <Field label="Description"><Textarea rows={3} value={section.description} onChange={(e) => updateFeatureSection(i, 'description', e.target.value)} /></Field>
                        <Field
                          label="Link anchor"
                          hint={`Reached as /features#${section.id || '…'}. Must match a feature's anchor on the home page, or that card will scroll nowhere.`}
                        >
                          <Input value={section.id} onChange={(e) => updateFeatureSection(i, 'id', e.target.value)} />
                        </Field>
                        <Field label="Button label"><Input value={section.ctaLabel} onChange={(e) => updateFeatureSection(i, 'ctaLabel', e.target.value)} /></Field>

                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Bullet points
                          </Label>
                          {(section.bullets ?? []).map((b, bIdx) => (
                            <div key={bIdx} className="flex gap-2">
                              <Input value={b} onChange={(e) => setSectionBullet(i, bIdx, e.target.value)} />
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0"
                                onClick={() => removeSectionBullet(i, bIdx)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={() => addSectionBullet(i)}>
                            <Plus className="h-4 w-4 mr-1" /> Add bullet
                          </Button>
                        </div>

                        <Field label="Photo" hint="Leave empty to show the section's icon instead.">
                          <CloudinaryImageUpload
                            value={section.imageUrl}
                            onChange={(url) => updateFeatureSection(i, 'imageUrl', url)}
                            folder="mahibere-ahaw/features"
                            variant="wide"
                          />
                        </Field>
                      </div>
                    ))}

                    <div className="grid gap-4 pt-4 border-t border-border">
                      <SectionDivider label="Closing call to action" />
                      <Field label="Title"><Input value={fp.cta.title} onChange={(e) => setFpCta('title', e.target.value)} /></Field>
                      <Field label="Description"><Textarea rows={2} value={fp.cta.description} onChange={(e) => setFpCta('description', e.target.value)} /></Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Primary button"><Input value={fp.cta.primaryLabel} onChange={(e) => setFpCta('primaryLabel', e.target.value)} /></Field>
                        <Field label="Secondary button"><Input value={fp.cta.secondaryLabel} onChange={(e) => setFpCta('secondaryLabel', e.target.value)} /></Field>
                      </div>
                      <Field label="Footer line"><Input value={fp.footer} onChange={(e) => setFp('footer', e.target.value)} /></Field>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Gallery ── */}
              <TabsContent value="gallery">
                <Card>
                  <CardHeader>
                    <CardTitle>Photo Gallery</CardTitle>
                    <CardDescription>
                      The photographs shown on the home page. These are shared
                      across all four languages — only the captions differ — so
                      you upload each picture once.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CloudinaryImageUpload
                      value=""
                      onChange={() => { /* handled by onUploaded, which also carries the publicId */ }}
                      onUploaded={addGalleryImage}
                      folder="mahibere-ahaw/gallery"
                      label="Add photos"
                      variant="wide"
                      multiple
                    />

                    {gallery.images.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
                        <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No photos yet</p>
                        <p className="text-sm">
                          Until you add some, the home page falls back to the
                          pictures bundled with the app.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {gallery.images.map((image, i) => (
                          <div key={`${image.url}-${i}`}
                            className="p-3 rounded-xl border border-border bg-muted/20 flex gap-4 flex-wrap">
                            <img
                              src={optimized(image.url, 240)}
                              alt=""
                              className="h-24 w-36 object-cover rounded-lg border border-border shrink-0"
                            />
                            <div className="flex-1 min-w-[220px] space-y-2">
                              <Field label={`Caption (${activeLang.toUpperCase()})`} hint="Optional. Shown over the photo.">
                                <Input
                                  value={image.caption?.[activeLang] ?? ''}
                                  onChange={(e) => setGalleryCaption(i, activeLang, e.target.value)}
                                  placeholder="Sunday service, Bishoftu"
                                />
                              </Field>
                              {/* Shown so the file can be found in Cloudinary:
                                  removing it here only drops the reference. */}
                              <p className="text-[10px] text-muted-foreground font-mono break-all">
                                {image.publicId || '(no publicId — uploaded before this was recorded)'}
                              </p>
                            </div>
                            <div className="flex items-start gap-1">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                                title="Move earlier" disabled={i === 0}
                                onClick={() => moveGalleryImage(i, -1)}>
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                                title="Move later" disabled={i === gallery.images.length - 1}
                                onClick={() => moveGalleryImage(i, 1)}>
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                              <Button type="button" variant="ghost" size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Remove from the site"
                                onClick={() => removeGalleryImage(i)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground">
                      Removing a photo takes it off the site immediately. The file
                      itself stays in your Cloudinary account — deleting it there
                      needs a signed request that this app deliberately cannot
                      make. Use the id above to find it in the Cloudinary console.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

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
                      <Field label="Primary button link" hint={LINK_HINT}>
                        <Input value={content.hero.ctaPrimaryUrl ?? ''} onChange={(e) => setHero('ctaPrimaryUrl', e.target.value)} placeholder="/login" />
                      </Field>
                      <Field label="Secondary button link" hint={LINK_HINT}>
                        <Input value={content.hero.ctaSecondaryUrl ?? ''} onChange={(e) => setHero('ctaSecondaryUrl', e.target.value)} placeholder="#about" />
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

                    {/* The photo carousel moved to its own Gallery tab: it used
                        to live inside this per-language content, so the same
                        photos had to be uploaded once per language.

                        The "Floating stat cards" fields lived here too. They
                        edited hero.statsCard1/2, which no part of the page has
                        rendered since the cards were removed from the hero —
                        the Stats tab is where editable figures belong. */}
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
                      <CardDescription>
                        The “Everything You Need” cards on the home page — heading,
                        text, photo and Learn More link for each card.
                      </CardDescription>
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

                        <Field
                          label="Card photo"
                          hint="Shown across the top of the card. Leave empty to use the photo bundled with the app for this position."
                        >
                          <CloudinaryImageUpload
                            value={feature.imageUrl}
                            onChange={(url) => updateFeature(i, 'imageUrl', url)}
                            folder="mahibere-ahaw/features"
                            variant="wide"
                          />
                        </Field>

                        <SectionDivider label="Learn More link" />
                        <Field label="Link anchor" hint="e.g. members, planning, reports">
                          <Input value={feature.id} onChange={(e) => updateFeature(i, 'id', e.target.value)} />
                        </Field>
                        {brokenFeatureLinks.some((b) => b.index === i) && (
                          <p className="text-[11px] text-amber-700 flex items-start gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                            No section on the Features page has this anchor, so
                            this card's link would scroll nowhere.
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Button label" hint="Leave empty to use the shared “Learn More” translation.">
                            <Input
                              value={feature.learnMoreLabel ?? ''}
                              onChange={(e) => updateFeature(i, 'learnMoreLabel', e.target.value)}
                              placeholder={translations[activeLang].common.learnMore}
                            />
                          </Field>
                          <Field
                            label="Button link"
                            hint={`Goes to ${featureLinkTarget(feature)}. Leave empty for the anchor above; an https:// address opens in a new tab.`}
                          >
                            <Input
                              value={feature.learnMoreUrl ?? ''}
                              onChange={(e) => updateFeature(i, 'learnMoreUrl', e.target.value)}
                              placeholder={`/features#${feature.id || '…'}`}
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── About & Faith ── */}
              <TabsContent value="about">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>About Us Section</CardTitle>
                      <CardDescription>The section header, identity, mission, and vision cards.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Badge text" hint="Small pill above the section title">
                        <Input value={content.about?.badge ?? ''} onChange={(e) => setAbout('badge', e.target.value)} />
                      </Field>
                      <Field label="Section title">
                        <Input value={content.about?.sectionTitle ?? ''} onChange={(e) => setAbout('sectionTitle', e.target.value)} />
                      </Field>
                      <Field label="Section description">
                        <Textarea rows={3} value={content.about?.sectionDescription ?? ''} onChange={(e) => setAbout('sectionDescription', e.target.value)} />
                      </Field>
                      <SectionDivider label="Identity Card" />
                      <Field label="Identity card title">
                        <Input value={content.about?.whoWeAreTitle ?? ''} onChange={(e) => setAbout('whoWeAreTitle', e.target.value)} />
                      </Field>
                      <Field label="Identity card description">
                        <Textarea rows={3} value={content.about?.whoWeAreDescription ?? ''} onChange={(e) => setAbout('whoWeAreDescription', e.target.value)} />
                      </Field>
                      <SectionDivider label="Mission Card" />
                      <Field label="Mission card title">
                        <Input value={content.about?.missionTitle ?? ''} onChange={(e) => setAbout('missionTitle', e.target.value)} />
                      </Field>
                      <Field label="Mission card description">
                        <Textarea rows={3} value={content.about?.missionDescription ?? ''} onChange={(e) => setAbout('missionDescription', e.target.value)} />
                      </Field>
                      <SectionDivider label="Vision Card" />
                      <Field label="Vision card title">
                        <Input value={content.about?.visionTitle ?? ''} onChange={(e) => setAbout('visionTitle', e.target.value)} />
                      </Field>
                      <Field label="Vision card description">
                        <Textarea rows={3} value={content.about?.visionDescription ?? ''} onChange={(e) => setAbout('visionDescription', e.target.value)} />
                      </Field>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Statement of Faith</CardTitle>
                      <CardDescription>The "What We Believe" belief cards (icon, title, description).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Eyebrow" hint="The small line above the heading, e.g. Statement of Faith">
                        <Input value={content.about?.beliefsEyebrow ?? ''} onChange={(e) => setAbout('beliefsEyebrow', e.target.value)} />
                      </Field>
                      <Field label="Section title" hint="e.g. What We Believe / የምናምንበት እምነታችን">
                        <Input value={content.about?.beliefsTitle ?? ''} onChange={(e) => setAbout('beliefsTitle', e.target.value)} />
                      </Field>
                      <p className="text-xs text-muted-foreground">
                        Icon must be a Lucide icon name: <code className="bg-muted px-1 rounded">BookOpen</code>, <code className="bg-muted px-1 rounded">Church</code>, <code className="bg-muted px-1 rounded">Heart</code>, <code className="bg-muted px-1 rounded">Shield</code>…
                      </p>
                      {(content.about?.beliefs ?? []).map((belief, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Belief {i + 1}</Badge>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                              onClick={() => {
                                const beliefs = (content.about?.beliefs ?? []).filter((_, idx) => idx !== i);
                                setAbout('beliefs', beliefs);
                              }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Title">
                              <Input value={belief.title} onChange={(e) => {
                                const beliefs = [...(content.about?.beliefs ?? [])];
                                beliefs[i] = { ...beliefs[i], title: e.target.value };
                                setAbout('beliefs', beliefs);
                              }} />
                            </Field>
                            <Field label="Icon name (Lucide)">
                              <Input value={belief.icon} onChange={(e) => {
                                const beliefs = [...(content.about?.beliefs ?? [])];
                                beliefs[i] = { ...beliefs[i], icon: e.target.value };
                                setAbout('beliefs', beliefs);
                              }} />
                            </Field>
                          </div>
                          <Field label="Description">
                            <Textarea rows={2} value={belief.description} onChange={(e) => {
                              const beliefs = [...(content.about?.beliefs ?? [])];
                              beliefs[i] = { ...beliefs[i], description: e.target.value };
                              setAbout('beliefs', beliefs);
                            }} />
                          </Field>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => {
                        const beliefs = [...(content.about?.beliefs ?? []), { title: 'New Belief', description: '', icon: 'BookOpen' }];
                        setAbout('beliefs', beliefs);
                      }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Belief
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Core Values</CardTitle>
                      <CardDescription>The value cards displayed in a 4-column grid.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Eyebrow" hint="The small line above the heading, e.g. Our Culture">
                        <Input value={content.about?.valuesEyebrow ?? ''} onChange={(e) => setAbout('valuesEyebrow', e.target.value)} />
                      </Field>
                      <Field label="Section title" hint="e.g. Our Core Values / መሠረታዊ እሴቶቻችን">
                        <Input value={content.about?.valuesTitle ?? ''} onChange={(e) => setAbout('valuesTitle', e.target.value)} />
                      </Field>
                      {(content.about?.values ?? []).map((val, i) => (
                        <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">Value {i + 1}</Badge>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                              onClick={() => {
                                const values = (content.about?.values ?? []).filter((_, idx) => idx !== i);
                                setAbout('values', values);
                              }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="Title">
                              <Input value={val.title} onChange={(e) => {
                                const values = [...(content.about?.values ?? [])];
                                values[i] = { ...values[i], title: e.target.value };
                                setAbout('values', values);
                              }} />
                            </Field>
                            <Field label="Icon name (Lucide)">
                              <Input value={val.icon} onChange={(e) => {
                                const values = [...(content.about?.values ?? [])];
                                values[i] = { ...values[i], icon: e.target.value };
                                setAbout('values', values);
                              }} />
                            </Field>
                          </div>
                          <Field label="Description">
                            <Textarea rows={2} value={val.description} onChange={(e) => {
                              const values = [...(content.about?.values ?? [])];
                              values[i] = { ...values[i], description: e.target.value };
                              setAbout('values', values);
                            }} />
                          </Field>
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => {
                        const values = [...(content.about?.values ?? []), { title: 'New Value', description: '', icon: 'Shield' }];
                        setAbout('values', values);
                      }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Value
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ── News ── */}
              <TabsContent value="news">
                <Card>
                  <CardHeader>
                    <CardTitle>News Section</CardTitle>
                    <CardDescription>
                      Everything the homepage news feed says around the posts.
                      The posts themselves are managed in News Manager.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Badge text" hint="Small pill above the heading">
                        <Input value={content.news.badge} onChange={(e) => setNews('badge', e.target.value)} />
                      </Field>
                      <Field label="Section title">
                        <Input value={content.news.sectionTitle} onChange={(e) => setNews('sectionTitle', e.target.value)} />
                      </Field>
                    </div>
                    <Field label="Section description">
                      <Textarea rows={2} value={content.news.sectionDescription} onChange={(e) => setNews('sectionDescription', e.target.value)} />
                    </Field>

                    <SectionDivider label="Labels" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="“See all” button">
                        <Input value={content.news.seeAllLabel} onChange={(e) => setNews('seeAllLabel', e.target.value)} />
                      </Field>
                      <Field label="“Read more” link">
                        <Input value={content.news.readMoreLabel} onChange={(e) => setNews('readMoreLabel', e.target.value)} />
                      </Field>
                      <Field label="Head-office attribution" hint="Shown on posts published centrally.">
                        <Input value={content.news.headOfficeLabel} onChange={(e) => setNews('headOfficeLabel', e.target.value)} />
                      </Field>
                      <Field label="Congregation attribution" hint="Fallback when a congregation has no name in this language.">
                        <Input value={content.news.parishLabel} onChange={(e) => setNews('parishLabel', e.target.value)} />
                      </Field>
                    </div>

                    <SectionDivider label="When nothing is published" />
                    <Field label="Empty-state title">
                      <Input value={content.news.emptyTitle} onChange={(e) => setNews('emptyTitle', e.target.value)} />
                    </Field>
                    <Field label="Empty-state message">
                      <Textarea rows={2} value={content.news.emptyDescription} onChange={(e) => setNews('emptyDescription', e.target.value)} />
                    </Field>

                    <SectionDivider label="Feed" />
                    <Field label="Posts to show" hint="The newest post leads; the rest form the list beside it.">
                      <Input type="number" min={1} max={12} value={content.news.maxPosts}
                        onChange={(e) => setNews('maxPosts', Math.max(1, Math.min(12, Number(e.target.value) || 1)))} />
                    </Field>
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

              {/* ── Contact ── */}
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Section</CardTitle>
                    <CardDescription>
                      The public "Contact Us" section on the homepage. The nav bar's
                      Contact link scrolls here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Badge text" hint="Small pill above the title">
                        <Input value={content.contact.badge} onChange={(e) => setContact('badge', e.target.value)} />
                      </Field>
                      <Field label="Section title">
                        <Input value={content.contact.sectionTitle} onChange={(e) => setContact('sectionTitle', e.target.value)} />
                      </Field>
                    </div>
                    <Field label="Section description">
                      <Textarea rows={2} value={content.contact.sectionDescription} onChange={(e) => setContact('sectionDescription', e.target.value)} />
                    </Field>

                    <SectionDivider label="Address" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Address card label">
                        <Input value={content.contact.addressLabel} onChange={(e) => setContact('addressLabel', e.target.value)} />
                      </Field>
                      <Field label="Google Maps link (optional)">
                        <Input value={content.contact.mapUrl ?? ''} onChange={(e) => setContact('mapUrl', e.target.value)} placeholder="https://maps.app.goo.gl/…" />
                      </Field>
                    </div>
                    <Field label="Address">
                      <Textarea rows={3} value={content.contact.address} onChange={(e) => setContact('address', e.target.value)} />
                    </Field>

                    <SectionDivider label="Phone numbers" />
                    <Field label="Phone card label">
                      <Input value={content.contact.phoneLabel} onChange={(e) => setContact('phoneLabel', e.target.value)} />
                    </Field>
                    <div className="space-y-2">
                      {(content.contact.phones ?? []).map((p, i) => (
                        <div key={i} className="flex gap-2">
                          <Input value={p} onChange={(e) => setContactListItem('phones', i, e.target.value)} placeholder="+251 911 22 33 44" />
                          <Button type="button" variant="outline" size="icon" onClick={() => removeContactListItem('phones', i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addContactListItem('phones')}>
                        <Plus className="h-4 w-4 mr-2" /> Add phone
                      </Button>
                    </div>

                    <SectionDivider label="Email addresses" />
                    <Field label="Email card label">
                      <Input value={content.contact.emailLabel} onChange={(e) => setContact('emailLabel', e.target.value)} />
                    </Field>
                    <div className="space-y-2">
                      {(content.contact.emails ?? []).map((em, i) => (
                        <div key={i} className="flex gap-2">
                          <Input type="email" value={em} onChange={(e) => setContactListItem('emails', i, e.target.value)} placeholder="name@example.com" />
                          <Button type="button" variant="outline" size="icon" onClick={() => removeContactListItem('emails', i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => addContactListItem('emails')}>
                        <Plus className="h-4 w-4 mr-2" /> Add email
                      </Button>
                    </div>

                    <SectionDivider label="Office hours" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Hours card label">
                        <Input value={content.contact.hoursLabel} onChange={(e) => setContact('hoursLabel', e.target.value)} />
                      </Field>
                      <Field label="Office hours">
                        <Input value={content.contact.hours} onChange={(e) => setContact('hours', e.target.value)} />
                      </Field>
                    </div>

                    <SectionDivider label="Social links" />
                    <Field label="Socials heading">
                      <Input value={content.contact.socialsLabel} onChange={(e) => setContact('socialsLabel', e.target.value)} />
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="YouTube URL">
                        <Input value={content.contact.youtube ?? ''} onChange={(e) => setContact('youtube', e.target.value)} placeholder="https://youtube.com/@…" />
                      </Field>
                      <Field label="Telegram URL">
                        <Input value={content.contact.telegram ?? ''} onChange={(e) => setContact('telegram', e.target.value)} placeholder="https://t.me/…" />
                      </Field>
                      <Field label="Facebook URL">
                        <Input value={content.contact.facebook ?? ''} onChange={(e) => setContact('facebook', e.target.value)} placeholder="https://facebook.com/…" />
                      </Field>
                      <Field label="TikTok URL">
                        <Input value={content.contact.tiktok ?? ''} onChange={(e) => setContact('tiktok', e.target.value)} placeholder="https://tiktok.com/@…" />
                      </Field>
                      <Field label="Website URL">
                        <Input value={content.contact.website ?? ''} onChange={(e) => setContact('website', e.target.value)} placeholder="https://…" />
                      </Field>
                    </div>
                  </CardContent>
                </Card>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Contact email">
                        <Input type="email" value={content.footer.email} onChange={(e) => setFooter('email', e.target.value)} />
                      </Field>
                      <Field label="Email label" hint="Prefixes the address, e.g. “Email: …”">
                        <Input value={content.footer.emailLabel} onChange={(e) => setFooter('emailLabel', e.target.value)} />
                      </Field>
                    </div>
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

                    <SectionDivider label="Link columns" />
                    <p className="text-[11px] text-muted-foreground">
                      These two columns used to be fixed labels pointing at
                      nothing. A row with no link shows as plain text instead of
                      a link that does nothing. {LINK_HINT}
                    </p>
                    <FooterLinkEditor
                      title="Platform column"
                      heading={content.footer.platformHeading}
                      onHeading={(v) => setFooter('platformHeading', v)}
                      links={content.footer.platformLinks}
                      onChange={(i, k, v) => updateFooterLink('platformLinks', i, k, v)}
                      onAdd={() => addFooterLink('platformLinks')}
                      onRemove={(i) => removeFooterLink('platformLinks', i)}
                    />
                    <FooterLinkEditor
                      title="Support column"
                      heading={content.footer.supportHeading}
                      onHeading={(v) => setFooter('supportHeading', v)}
                      links={content.footer.supportLinks}
                      onChange={(i, k, v) => updateFooterLink('supportLinks', i, k, v)}
                      onAdd={() => addFooterLink('supportLinks')}
                      onRemove={(i) => removeFooterLink('supportLinks', i)}
                    />

                    <SectionDivider label="Stay Connected" />
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={content.footer.newsletterEnabled}
                        onChange={(e) => setFooter('newsletterEnabled', e.target.checked)} />
                      Show the sign-up block
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      There is no mailing-list service wired up, so the button
                      opens the visitor's mail app addressed to the contact
                      email above rather than discarding what they typed.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Heading">
                        <Input value={content.footer.newsletterHeading} onChange={(e) => setFooter('newsletterHeading', e.target.value)} />
                      </Field>
                      <Field label="Input placeholder">
                        <Input value={content.footer.newsletterPlaceholder} onChange={(e) => setFooter('newsletterPlaceholder', e.target.value)} />
                      </Field>
                    </div>

                    <SectionDivider label="Legal links" />
                    <p className="text-[11px] text-muted-foreground">
                      Each link is hidden until it has a destination.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Privacy label">
                        <Input value={content.footer.privacyLabel} onChange={(e) => setFooter('privacyLabel', e.target.value)} />
                      </Field>
                      <Field label="Privacy link" hint={LINK_HINT}>
                        <Input value={content.footer.privacyUrl ?? ''} onChange={(e) => setFooter('privacyUrl', e.target.value)} placeholder="/privacy" />
                      </Field>
                      <Field label="Terms label">
                        <Input value={content.footer.termsLabel} onChange={(e) => setFooter('termsLabel', e.target.value)} />
                      </Field>
                      <Field label="Terms link" hint={LINK_HINT}>
                        <Input value={content.footer.termsUrl ?? ''} onChange={(e) => setFooter('termsUrl', e.target.value)} placeholder="/terms" />
                      </Field>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>

            {/* Save button */}
            <div className="mt-8 flex justify-end">
              <Button onClick={handleSave} disabled={saving || brokenFeatureLinks.length > 0} size="lg">
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
