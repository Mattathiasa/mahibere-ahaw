import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { localeFor } from '@/lib/ethiopian-calendar';

/**
 * Date, time and number formatting that follows the app's language.
 *
 * Nearly every call site used to be a bare `d.toLocaleDateString()` — no locale
 * argument at all — which formats using the *browser's* locale. An Amharic
 * reader on a phone sold with an en-US system locale saw `3/14/2025` in the
 * middle of an otherwise Amharic page, and switching the app to Amharic changed
 * nothing. Passing the reader's chosen language fixes that.
 *
 * A few sites passed `'en-US'` explicitly, which was worse: it pinned US
 * formatting for every reader regardless of language or region.
 *
 * These render *Gregorian* dates, localised. Rendering Ethiopian calendar dates
 * for am/ti readers is a separate, larger question — the conversion helpers for
 * it already exist in `./ethiopian-calendar` and `EthiopianDatePicker` uses
 * them. Nothing here forecloses that.
 */

type DateInput = Date | string | number | null | undefined;

/** Coerce the shapes that reach these helpers — Firestore returns ISO strings. */
function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function useFormatters() {
  const { language } = useLanguage();

  return useMemo(() => {
    const locale = localeFor(language);

    // Intl objects are expensive to construct and are the reason this is a
    // hook rather than a set of free functions: they are built once per
    // language, not once per row rendered.
    const dateShort = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
    const dateLong = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
    const dateNumeric = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateTime = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const timeOnly = new Intl.DateTimeFormat(locale, { timeStyle: 'short' });
    const number = new Intl.NumberFormat(locale);
    const decimal = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    /** Empty rather than "Invalid Date" — these land in table cells. */
    const guard =
      (fmt: Intl.DateTimeFormat) =>
      (value: DateInput, fallback = ''): string => {
        const d = toDate(value);
        return d ? fmt.format(d) : fallback;
      };

    return {
      locale,
      /** 14 Mar 2025 */
      formatDate: guard(dateShort),
      /** 14 March 2025 */
      formatDateLong: guard(dateLong),
      /** 14/03/2025 */
      formatDateNumeric: guard(dateNumeric),
      /** 14 Mar 2025, 09:30 */
      formatDateTime: guard(dateTime),
      /** 09:30 */
      formatTime: guard(timeOnly),
      /** 1,234 */
      formatNumber: (n: number | null | undefined): string =>
        typeof n === 'number' && Number.isFinite(n) ? number.format(n) : '',
      /**
       * 1,234.00 — money. Deliberately not `style: 'currency'`: the church
       * accounts in birr and the screens already label the unit themselves
       * ("Total Value Of Asset (ETB)"), so a second symbol would double it up.
       */
      formatAmount: (n: number | null | undefined): string =>
        typeof n === 'number' && Number.isFinite(n) ? decimal.format(n) : '',
    };
  }, [language]);
}

/**
 * Non-React callers (service modules, notification builders) that already know
 * the language. Components should use `useFormatters` so the Intl objects are
 * memoised rather than rebuilt per call.
 */
export function formatDateIn(lang: string, value: DateInput, fallback = ''): string {
  const d = toDate(value);
  if (!d) return fallback;
  return new Intl.DateTimeFormat(localeFor(lang), { dateStyle: 'medium' }).format(d);
}
