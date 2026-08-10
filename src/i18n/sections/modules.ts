/**
 * Per-module admin configuration labels.
 *
 * Two registries live here, both of which are admin-facing lists keyed by
 * module:
 *
 *   - `el*` — the toggleable UI elements in Software Control
 *     (src/services/softwareControl.ts). The element's own key
 *     (`announcements.create`) is its identity and is persisted in
 *     `siteConfig/softwareControl`; only its label is translated.
 *   - the built-in defaults for the module registry
 *     (src/services/moduleConfig.ts), added in a later phase. An admin's saved
 *     override wins; a blank override falls back to these.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const modulesEn = {
  // ── Software Control: toggleable UI elements ──────────────────────────────
  elAnnouncementsCreate: 'New Announcement button',
  elPlansCreate: 'New Plan button',
  elReportsCreate: 'New Report button',
  elMembersAdd: 'Add Member button',
  elMembersExport: 'Export button',
  elMeetingsSchedule: 'Schedule Meeting button',
  elFinanceAddTransaction: 'Add Transaction button',
  elFinanceCreateBudget: 'Create Budget button',
  elFinanceGenerateReport: 'Generate Report button',
  elHrAdd: 'Add Employee button',
  elHrDelete: 'Delete Employee button',
  elInventoryAdd: 'Add Asset button',
  elInventoryDelete: 'Delete Asset button',
  elTeachingsCreate: 'Create Teaching button',
  elNewsCreate: 'New Post button',
  elAtbiyaAdd: 'Register Atbiya button',
  elAtbiyaAddAdmin: 'Add Administrator button',
  elMembersApprove: 'Approve / Reject buttons',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const modulesAm: Record<keyof typeof modulesEn, string> = {
  elAnnouncementsCreate: 'የአዲስ ማስታወቂያ ቁልፍ',
  elPlansCreate: 'የአዲስ ዕቅድ ቁልፍ',
  elReportsCreate: 'የአዲስ ሪፖርት ቁልፍ',
  elMembersAdd: 'አባል የመጨመሪያ ቁልፍ',
  elMembersExport: 'የማውጫ ቁልፍ',
  elMeetingsSchedule: 'ስብሰባ የመያዣ ቁልፍ',
  elFinanceAddTransaction: 'ግብይት የመጨመሪያ ቁልፍ',
  elFinanceCreateBudget: 'በጀት የመፍጠሪያ ቁልፍ',
  elFinanceGenerateReport: 'ሪፖርት የማዘጋጃ ቁልፍ',
  elHrAdd: 'ሠራተኛ የመጨመሪያ ቁልፍ',
  elHrDelete: 'ሠራተኛ የመሰረዣ ቁልፍ',
  elInventoryAdd: 'ንብረት የመጨመሪያ ቁልፍ',
  elInventoryDelete: 'ንብረት የመሰረዣ ቁልፍ',
  elTeachingsCreate: 'ትምህርት የመፍጠሪያ ቁልፍ',
  elNewsCreate: 'የአዲስ ጽሑፍ ቁልፍ',
  elAtbiyaAdd: 'አጥቢያ የመመዝገቢያ ቁልፍ',
  elAtbiyaAddAdmin: 'አስተዳዳሪ የመጨመሪያ ቁልፍ',
  elMembersApprove: 'የማጽደቅ / ውድቅ የማድረጊያ ቁልፎች',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const modulesOm: Partial<Record<keyof typeof modulesEn, string>> = {};
export const modulesTi: Partial<Record<keyof typeof modulesEn, string>> = {};
