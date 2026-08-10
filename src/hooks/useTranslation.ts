import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations, type Translations } from '../i18n/translations';

/**
 * The function-style translation API: `t('nav.plans')`.
 *
 * Prefer `useLanguage().t.nav.plans` in new code. That form is checked against
 * the `Translations` type, so a typo is a build error; this one can only fail
 * at runtime. These call sites are migrated opportunistically as their files
 * are touched, and this module goes away once the last one is gone.
 *
 * It reads the tree from `LanguageContext` rather than importing
 * `translations[lang]` directly. That matters: the context is what layers the
 * English merge base and both Firestore override documents
 * (`translations_overrides` and `pageStrings`) on top of the static strings.
 * Reading the static tree directly — as this hook used to — meant admin edits
 * silently had no effect on any string reached through `t()`, and kept a
 * second, independently-cached copy of the overrides that could disagree with
 * the context's.
 */

/**
 * Sections that predate dotted keys and may still be reached by a bare leaf.
 *
 * Frozen deliberately. The bare alias is ambiguous — the tree has both
 * `nav.plans` and `pages.plans`, and whichever section is walked first wins —
 * so it exists only to keep already-written call sites working. New sections
 * are dotted-only, otherwise every key added from here on would be a fresh
 * chance to collide (`status.active` vs `admin.active`) and the winner would
 * depend on section order.
 */
const BARE_LEAF_SECTIONS = new Set([
  'nav',
  'common',
  'dashboard',
  'home',
  'footer',
  'settings',
  'pages',
  'signup',
  'admin',
]);

/** Flatten a `section -> key -> string` tree to `"section.key"` (plus legacy bare leaves). */
function buildFlatMap(tree: Translations): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [section, value] of Object.entries(tree as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const allowBare = BARE_LEAF_SECTIONS.has(section);
    for (const [key, leaf] of Object.entries(value as Record<string, unknown>)) {
      if (typeof leaf !== 'string') continue;
      flat[`${section}.${key}`] = leaf;
      if (allowBare && !(key in flat)) flat[key] = leaf;
    }
  }
  return flat;
}

/** English fallback map. Static, so it is built once for the whole session. */
let englishFlat: Record<string, string> | null = null;
function getEnglishFlat(): Record<string, string> {
  englishFlat ??= buildFlatMap(translations.en);
  return englishFlat;
}

export const useTranslation = () => {
  const { t: tree, language } = useLanguage();

  // Was rebuilt on every single t() call — an 884-entry walk per string
  // rendered. The tree identity only changes when the language changes or an
  // admin saves, which is exactly when the map should be rebuilt.
  const flat = useMemo(() => buildFlatMap(tree), [tree]);

  const t = (key: string): string => flat[key] ?? getEnglishFlat()[key] ?? key;

  return { t, language };
};
