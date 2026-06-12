import React, { useState } from 'react';
import { Save, Loader2, Search, RotateCcw } from 'lucide-react';
import { translations, type Language } from '@/i18n/translations';
import { type AllLanguageOverrides } from '@/services/pageStrings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalizationEditorProps {
  pageStrings: AllLanguageOverrides;
  stringsLang: Language;
  setStringsLang: (lang: Language) => void;
  setStringOverride: (key: string, value: string) => void;
  handleSaveStrings: () => Promise<void>;
  savingStrings: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LANG_LABELS: Record<Language, string> = {
  en: '🇬🇧 English',
  am: '🇪🇹 አማርኛ (Amharic)',
  om: '🇪🇹 Afaan Oromoo',
  ti: '🇪🇹 ትግርኛ (Tigrigna)',
};

// Walk the nested translations object and return flat { key, defaultValue, isLong } entries
function flattenSection(obj: Record<string, unknown>): Array<{ key: string; defaultValue: string; isLong: boolean }> {
  const result: Array<{ key: string; defaultValue: string; isLong: boolean }> = [];
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      result.push({ key, defaultValue: val, isLong: val.length > 60 });
    }
  }
  return result;
}

// Get all top-level sections from translations for a language
function getSections(lang: Language): Array<{ section: string; entries: ReturnType<typeof flattenSection> }> {
  const langData = translations[lang] as Record<string, unknown>;
  return Object.entries(langData)
    .filter(([, val]) => val && typeof val === 'object' && !Array.isArray(val))
    .map(([section, val]) => ({
      section,
      entries: flattenSection(val as Record<string, unknown>),
    }))
    .filter(({ entries }) => entries.length > 0);
}

const SECTION_LABELS: Record<string, string> = {
  nav: 'Navigation',
  common: 'Common UI',
  dashboard: 'Dashboard',
  home: 'Home Page',
  footer: 'Footer',
  settings: 'Settings',
  pages: 'Page Titles & Descriptions',
};

// ─── Component ────────────────────────────────────────────────────────────────

export const LocalizationEditor: React.FC<LocalizationEditorProps> = ({
  pageStrings,
  stringsLang,
  setStringsLang,
  setStringOverride,
  handleSaveStrings,
  savingStrings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const sections = getSections(stringsLang);

  // Count how many keys have overrides for the current language
  const overrideCount = Object.keys(pageStrings[stringsLang] ?? {}).filter(
    (k) => !k.startsWith('_') && (pageStrings[stringsLang]?.[k] ?? '') !== ''
  ).length;

  function getOverrideValue(key: string): string {
    return pageStrings[stringsLang]?.[key] ?? '';
  }

  function clearOverride(key: string) {
    setStringOverride(key, '');
  }

  // Filter entries by search query
  function filterEntries(entries: ReturnType<typeof flattenSection>) {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      ({ key, defaultValue }) =>
        key.toLowerCase().includes(q) ||
        defaultValue.toLowerCase().includes(q) ||
        getOverrideValue(key).toLowerCase().includes(q)
    );
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Localization Editor
                {overrideCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                Edit translations for any language. Overrides are stored in Firestore and applied on top of the built-in defaults. Leave a field blank to use the default.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Select value={stringsLang} onValueChange={(v) => setStringsLang(v as Language)}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LANG_LABELS) as Language[]).map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {LANG_LABELS[lang]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSaveStrings} disabled={savingStrings}>
                {savingStrings
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  : <><Save className="h-4 w-4 mr-2" />Save</>
                }
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search keys or values…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Info banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm space-y-1">
        <p className="font-bold">How overrides work</p>
        <p>The placeholder text shows the current built-in default. Type a new value to override it for <strong>{LANG_LABELS[stringsLang]}</strong>. Clear a field to revert to the default. Changes go live for all users immediately after saving.</p>
      </div>

      {/* Sections as tabs */}
      <Tabs defaultValue={sections[0]?.section ?? 'nav'}>
        <TabsList className="flex-wrap h-auto gap-1 mb-4">
          {sections.map(({ section, entries }) => {
            const filtered = filterEntries(entries);
            const hasOverrides = entries.some(({ key }) => getOverrideValue(key) !== '');
            return (
              <TabsTrigger key={section} value={section} className="relative">
                {SECTION_LABELS[section] ?? section}
                {hasOverrides && (
                  <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                )}
                {searchQuery && filtered.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                    {filtered.length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {sections.map(({ section, entries }) => {
          const filtered = filterEntries(entries);
          return (
            <TabsContent key={section} value={section}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{SECTION_LABELS[section] ?? section}</CardTitle>
                  <CardDescription>
                    {filtered.length} string{filtered.length !== 1 ? 's' : ''}
                    {searchQuery ? ` matching "${searchQuery}"` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No strings match your search.</p>
                  ) : (
                    <div className="space-y-4">
                      {filtered.map(({ key, defaultValue, isLong }) => {
                        const override = getOverrideValue(key);
                        const hasOverride = override !== '';
                        return (
                          <div key={key} className={`p-4 rounded-xl border transition-colors ${hasOverride ? 'border-blue-200 bg-blue-50/50' : 'border-border bg-muted/20'}`}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                  {key}
                                </code>
                                {hasOverride && (
                                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">
                                    overridden
                                  </Badge>
                                )}
                              </div>
                              {hasOverride && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={() => clearOverride(key)}
                                  title="Clear override, revert to default"
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  Reset
                                </Button>
                              )}
                            </div>
                            {isLong ? (
                              <Textarea
                                rows={2}
                                placeholder={defaultValue}
                                value={override}
                                onChange={(e) => setStringOverride(key, e.target.value)}
                                className="text-sm"
                              />
                            ) : (
                              <Input
                                placeholder={defaultValue}
                                value={override}
                                onChange={(e) => setStringOverride(key, e.target.value)}
                                className="text-sm"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Bottom save */}
      <div className="flex justify-end">
        <Button onClick={handleSaveStrings} disabled={savingStrings} size="lg">
          {savingStrings
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
            : <><Save className="h-4 w-4 mr-2" />Save {LANG_LABELS[stringsLang]} Translations</>
          }
        </Button>
      </div>
    </div>
  );
};
