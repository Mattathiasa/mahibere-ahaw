/**
 * The translation dictionary, assembled from one module per section.
 *
 * ## Shape is load-bearing — do not nest deeper than two levels
 *
 * Four consumers walk this tree assuming exactly `section -> key -> string`:
 *
 *   - `flattenSection`      (src/components/LocalizationEditor.tsx)
 *   - `applyStringOverrides` (src/services/pageStrings.ts) — also skips arrays
 *   - `buildFlatMap`        (src/hooks/useTranslation.ts)
 *   - the `"section.key"` override keys stored in Firestore `siteConfig/pageStrings`
 *
 * A nested object or an array is silently dropped by all four, so the string
 * renders but becomes invisible to the admin translation editor. Where a value
 * is naturally a list (a structure node's duties, a dropdown's options), flatten
 * it to indexed keys — `sinodosRole1`, `sinodosRole2` — rather than an array.
 *
 * ## Renaming a key breaks live data
 *
 * Admin overrides are stored against `"section.key"`. Renaming either half
 * orphans every override the church has already saved. Move files freely;
 * never rename keys or sections. If one truly must move, add an alias map in
 * `pageStringsService.get()`.
 *
 * ## No `as const`
 *
 * `Translations` is `typeof translations.en`. Adding `as const` would narrow
 * every value to its literal type (`t.nav.home` would be `'Home'`, not
 * `string`) and break assignment everywhere. `keyof typeof navEn` already
 * gives section modules the key-level type safety they need.
 *
 * ## Amharic is complete by construction
 *
 * Every `*Am` export is typed `Record<keyof typeof *En, string>` rather than
 * `Partial<...>`, so a key added in English without an Amharic translation is a
 * compile error. Amharic is this church's own language and the app default;
 * English exists only as the merge base in `buildLanguage`, for the two
 * languages that are still partial.
 */
import { navEn, navAm, navOm, navTi } from './sections/nav';
import { commonEn, commonAm, commonOm, commonTi } from './sections/common';
import { dashboardEn, dashboardAm, dashboardOm, dashboardTi } from './sections/dashboard';
import { homeEn, homeAm, homeOm, homeTi } from './sections/home';
import { footerEn, footerAm, footerOm, footerTi } from './sections/footer';
import { settingsEn, settingsAm, settingsOm, settingsTi } from './sections/settings';
import { pagesEn, pagesAm, pagesOm, pagesTi } from './sections/pages';
import { signupEn, signupAm, signupOm, signupTi } from './sections/signup';
import { adminEn, adminAm, adminOm, adminTi } from './sections/admin';
import { statusEn, statusAm, statusOm, statusTi } from './sections/status';
import { errorsEn, errorsAm, errorsOm, errorsTi } from './sections/errors';
import { formsEn, formsAm, formsOm, formsTi } from './sections/forms';
import { permissionsEn, permissionsAm, permissionsOm, permissionsTi } from './sections/permissions';
import { structureEn, structureAm, structureOm, structureTi } from './sections/structure';
import { modulesEn, modulesAm, modulesOm, modulesTi } from './sections/modules';
import { financeEn, financeAm, financeOm, financeTi } from './sections/finance';
import { hrEn, hrAm, hrOm, hrTi } from './sections/hr';
import { inventoryEn, inventoryAm, inventoryOm, inventoryTi } from './sections/inventory';
import { peopleEn, peopleAm, peopleOm, peopleTi } from './sections/people';
import { contentEn, contentAm, contentOm, contentTi } from './sections/content';
import { geoEn, geoAm, geoOm, geoTi } from './sections/geo';

export const translations = {
  en: {
    nav: navEn,
    common: commonEn,
    dashboard: dashboardEn,
    home: homeEn,
    footer: footerEn,
    settings: settingsEn,
    pages: pagesEn,
    signup: signupEn,
    admin: adminEn,
    status: statusEn,
    errors: errorsEn,
    forms: formsEn,
    permissions: permissionsEn,
    structure: structureEn,
    modules: modulesEn,
    finance: financeEn,
    hr: hrEn,
    inventory: inventoryEn,
    people: peopleEn,
    content: contentEn,
    geo: geoEn,
  },
  am: {
    nav: navAm,
    common: commonAm,
    dashboard: dashboardAm,
    home: homeAm,
    footer: footerAm,
    settings: settingsAm,
    pages: pagesAm,
    signup: signupAm,
    admin: adminAm,
    status: statusAm,
    errors: errorsAm,
    forms: formsAm,
    permissions: permissionsAm,
    structure: structureAm,
    modules: modulesAm,
    finance: financeAm,
    hr: hrAm,
    inventory: inventoryAm,
    people: peopleAm,
    content: contentAm,
    geo: geoAm,
  },
  om: {
    nav: navOm,
    common: commonOm,
    dashboard: dashboardOm,
    home: homeOm,
    footer: footerOm,
    settings: settingsOm,
    pages: pagesOm,
    signup: signupOm,
    admin: adminOm,
    status: statusOm,
    errors: errorsOm,
    forms: formsOm,
    permissions: permissionsOm,
    structure: structureOm,
    modules: modulesOm,
    finance: financeOm,
    hr: hrOm,
    inventory: inventoryOm,
    people: peopleOm,
    content: contentOm,
    geo: geoOm,
  },
  ti: {
    nav: navTi,
    common: commonTi,
    dashboard: dashboardTi,
    home: homeTi,
    footer: footerTi,
    settings: settingsTi,
    pages: pagesTi,
    signup: signupTi,
    admin: adminTi,
    status: statusTi,
    errors: errorsTi,
    forms: formsTi,
    permissions: permissionsTi,
    structure: structureTi,
    modules: modulesTi,
    finance: financeTi,
    hr: hrTi,
    inventory: inventoryTi,
    people: peopleTi,
    content: contentTi,
    geo: geoTi,
  },
};

export type Language = keyof typeof translations;
export type Translations = typeof translations.en;

/** Every section name, for tests and tooling that walk the tree generically. */
export const SECTION_NAMES = Object.keys(translations.en) as Array<keyof Translations>;
