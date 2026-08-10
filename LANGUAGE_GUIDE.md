# Language Guide

## Amharic is the default

`DEFAULT_LANGUAGE` in `src/contexts/LanguageContext.tsx` is `'am'`. A first-time
visitor with empty storage gets Amharic. There is no browser-language detection,
no server-side default and no locale in the URL — the app renders Amharic until
the reader chooses otherwise, and `index.html` ships `<html lang="am">` so that
holds before any JavaScript runs.

The chosen language is stored in `localStorage['app-language']`, per device.
Nothing stores a per-user preference on the account, which is why notifications
written for someone else to read later are pinned to Amharic rather than to the
sender's language.

## The four languages

| Code | Language | Coverage |
|------|----------|----------|
| `am` | አማርኛ | complete, enforced by the type system |
| `en` | English | complete — it is the merge base, not a preference |
| `om` | Afaan Oromoo | partial; falls back to English |
| `ti` | ትግርኛ | partial; falls back to English |

`LANGUAGE_CYCLE` and `LANGUAGE_ENDONYM` in `src/i18n/languages.ts` are the single
source for the switcher. Every language button in the app reads from them.

## Where strings live

`src/i18n/sections/*.ts` — one module per section, each exporting `xEn`, `xAm`
(complete, `Record<>`), `xOm` and `xTi` (partial). `src/i18n/translations.ts`
assembles them.

Two rules the tree cannot bend:

1. **Two levels only** — `section → key → string`. The Localization Editor, the
   Firestore override layer and the flat-map builder all walk exactly that shape
   and silently drop anything deeper or any array. Flatten lists to indexed keys.
2. **Never rename a key or section** — admin overrides are stored against
   `"section.key"` in `siteConfig/pageStrings`. A rename orphans them.

## Values that stay English on purpose

Anything persisted in Firestore keeps its English token and gets a translated
*label*: asset status, employment type, church roles, regions, service types.
See `src/i18n/enums.ts` for the contract and the resolvers. Translating a stored
value would rewrite what existing documents mean and break every comparison.

The same applies to `PermissionMeta.group`, which is a filter predicate and a
React key, and to audit-log descriptions, which are a record rather than copy.

## Reading a string outside React

Services cannot call `useLanguage()`. They throw `AppError('someKey')` and the
catch site resolves it with `errorMessage(t, e)` — see `src/lib/appError.ts`.
Module-scope registries hold translation keys and take `t` as a parameter.

## Checks

`npm run check` runs three gates:

- `typecheck:ratchet` — `tsc` against `tsconfig.app.json`, compared per file
  against `typecheck-baseline.json`. Note that plain `tsc --noEmit` against the
  root config is a **no-op**: it is solution-style, so tsc resolves an empty
  program and exits 0 without reading anything.
- `lint:i18n` — per-file hardcoded-string counts against `i18n-baseline.json`.
- `test:run` — includes `src/test/i18n.test.ts`, which enforces Amharic parity,
  that no Amharic value is still its English text, the two-level shape, that
  every persisted enum value has a label, and that an admin override can reach
  every key in the tree.
