import type { Translations } from './translations';

/**
 * Display labels for values that are PERSISTED in Firestore.
 *
 * These are the one category of string that must not simply be translated in
 * place. `asset.status` is written to the database as the literal `'InUse'`,
 * queried against, filtered on, and compared in a dozen places. Replacing the
 * literal with Amharic would rewrite every document's meaning and break every
 * comparison — so the stored token stays English forever and only its *display*
 * is translated.
 *
 * The contract, in four rules:
 *
 *   1. The stored value is the key suffix, spelled verbatim: `'InUse'` is
 *      rendered from `status.assetStatusInUse`. Never re-spell or re-case it —
 *      the i18n test derives the expected keys from these arrays, so a typo is
 *      a failing test rather than a silently-English label.
 *   2. `<SelectItem value={v}>` keeps the English token; only the child text is
 *      translated.
 *   3. An unknown value falls back to itself, so a legacy document with a
 *      status nobody remembers still renders something rather than a blank.
 *   4. Never translate a value that is compared, filtered, sorted or written.
 *
 * The option arrays live here rather than in the dialogs that render them so a
 * picker's choices and a badge's labels cannot drift apart — they did, before:
 * `Inventory.tsx` special-cased `'InUse'` to display `'ACTIVE'`, a word that
 * appeared nowhere else in the app.
 */

// ─── Persisted value sets ─────────────────────────────────────────────────────
// Each mirrors a union in the service layer. Keep them in sync; the i18n test
// only checks that every member listed here has a label, not that the list is
// complete, because TypeScript already enforces that at the assignment site.

/** `AssetRecord.status` — src/services/inventory.ts */
export const ASSET_STATUSES = ['InUse', 'InStorage', 'Maintenance', 'Retired', 'Disposed'] as const;

/** `AssetRecord.condition` */
export const ASSET_CONDITIONS = ['New', 'Good', 'Fair', 'Poor'] as const;

/** `AssetRecord.acquisitionType` */
export const ACQUISITION_TYPES = ['Purchased', 'Rented'] as const;

/** `Employee.status` — src/services/hr.ts */
export const EMPLOYMENT_STATUSES = ['Active', 'OnLeave', 'Terminated', 'Inactive'] as const;

/** `Employee.employmentType` */
export const EMPLOYMENT_TYPES = ['FullTime', 'PartTime', 'Contract', 'Volunteer'] as const;

/** `Employee.category` */
export const EMPLOYEE_CATEGORIES = ['Priest', 'Staff'] as const;

/** `TeachingRecord.status` — src/types/index.ts */
export const TEACHING_STATUSES = ['Draft', 'Published', 'Archived'] as const;

/** `Budget.status` — src/services/finance.ts */
export const BUDGET_STATUSES = ['Active', 'Completed'] as const;

/** `Voucher.status` — also used by missionary applications */
export const VOUCHER_STATUSES = ['Pending', 'Approved', 'Paid', 'Rejected'] as const;

/** `Plan.timeframe` / `Report.timeframe` */
export const TIMEFRAMES = ['Weekly', 'Monthly', 'Annually'] as const;

/** `Report.option` — the reporting tier */
export const REPORT_OPTIONS = ['Memriya', 'Kifil', 'Zerf'] as const;

/** `Member.maritalStatus` */
export const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

/** `Member.gender` */
export const GENDERS = ['Male', 'Female', 'Other'] as const;

// ─── Resolution ───────────────────────────────────────────────────────────────

/**
 * The `status` section is typed from its English module, which starts empty and
 * fills up as each phase lands. Indexing it by a computed key needs a widened
 * view; the `?? value` fallback is what makes that safe at runtime.
 */
function label(t: Translations, prefix: string, value: string): string {
  const section = t.status as unknown as Record<string, string | undefined>;
  return section[`${prefix}${value}`] ?? value;
}

/** Translation key for a stored value. Exported so tests can derive the key set. */
export function statusKey(prefix: string, value: string): string {
  return `${prefix}${value}`;
}

export const assetStatusLabel = (t: Translations, v: string) => label(t, 'assetStatus', v);
export const assetConditionLabel = (t: Translations, v: string) => label(t, 'assetCondition', v);
export const acquisitionTypeLabel = (t: Translations, v: string) => label(t, 'acquisitionType', v);
export const employmentStatusLabel = (t: Translations, v: string) => label(t, 'employmentStatus', v);
export const employmentTypeLabel = (t: Translations, v: string) => label(t, 'employmentType', v);
export const employeeCategoryLabel = (t: Translations, v: string) => label(t, 'employeeCategory', v);
export const teachingStatusLabel = (t: Translations, v: string) => label(t, 'teachingStatus', v);
export const budgetStatusLabel = (t: Translations, v: string) => label(t, 'budgetStatus', v);
export const voucherStatusLabel = (t: Translations, v: string) => label(t, 'voucherStatus', v);
export const timeframeLabel = (t: Translations, v: string) => label(t, 'timeframe', v);
export const reportOptionLabel = (t: Translations, v: string) => label(t, 'reportOption', v);
export const maritalStatusLabel = (t: Translations, v: string) => label(t, 'maritalStatus', v);
export const genderLabel = (t: Translations, v: string) => label(t, 'gender', v);

/**
 * Every (prefix, values) pair, so the i18n test can assert that each persisted
 * value has a label in English and Amharic without restating the list.
 */
export const ENUM_REGISTRY: ReadonlyArray<{ prefix: string; values: readonly string[] }> = [
  { prefix: 'assetStatus', values: ASSET_STATUSES },
  { prefix: 'assetCondition', values: ASSET_CONDITIONS },
  { prefix: 'acquisitionType', values: ACQUISITION_TYPES },
  { prefix: 'employmentStatus', values: EMPLOYMENT_STATUSES },
  { prefix: 'employmentType', values: EMPLOYMENT_TYPES },
  { prefix: 'employeeCategory', values: EMPLOYEE_CATEGORIES },
  { prefix: 'teachingStatus', values: TEACHING_STATUSES },
  { prefix: 'budgetStatus', values: BUDGET_STATUSES },
  { prefix: 'voucherStatus', values: VOUCHER_STATUSES },
  { prefix: 'timeframe', values: TIMEFRAMES },
  { prefix: 'reportOption', values: REPORT_OPTIONS },
  { prefix: 'maritalStatus', values: MARITAL_STATUSES },
  { prefix: 'gender', values: GENDERS },
];
