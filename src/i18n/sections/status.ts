/**
 * Labels for values PERSISTED in Firestore (asset status, teaching status,
 * employment status). The stored value is the key suffix, spelled verbatim —
 * never re-spell it, and never translate a value that is compared, filtered, or
 * written. See src/i18n/enums.ts for the full contract and the resolvers.
 *
 * Wording here deliberately matches strings the app already shipped, so the
 * same concept does not appear two ways on one screen: `ሳምንታዊ / ወርኃዊ / ዓመታዊ`
 * come from `pages`, and `ያላገባ / ያገባ / የተፋታ / የሞተበት-የሞተባት` from `signup`.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const statusEn = {
  // ── Asset status — services/inventory.ts ──────────────────────────────────
  assetStatusInUse: 'In use',
  assetStatusInStorage: 'In storage',
  assetStatusMaintenance: 'Under maintenance',
  assetStatusRetired: 'Retired',
  assetStatusDisposed: 'Disposed',

  // ── Asset condition ───────────────────────────────────────────────────────
  assetConditionNew: 'New',
  assetConditionGood: 'Good',
  assetConditionFair: 'Fair',
  assetConditionPoor: 'Poor',

  // ── How an asset was acquired ─────────────────────────────────────────────
  acquisitionTypePurchased: 'Purchased',
  acquisitionTypeRented: 'Rented',

  // ── Employment status — services/hr.ts ────────────────────────────────────
  employmentStatusActive: 'Active',
  employmentStatusOnLeave: 'On leave',
  employmentStatusTerminated: 'Terminated',
  employmentStatusInactive: 'Inactive',

  // ── Employment type ───────────────────────────────────────────────────────
  employmentTypeFullTime: 'Full time',
  employmentTypePartTime: 'Part time',
  employmentTypeContract: 'Contract',
  employmentTypeVolunteer: 'Volunteer',

  // ── Employee category ─────────────────────────────────────────────────────
  employeeCategoryPriest: 'Priest',
  employeeCategoryStaff: 'Staff',

  // ── Teaching status — types/index.ts ──────────────────────────────────────
  teachingStatusDraft: 'Draft',
  teachingStatusPublished: 'Published',
  teachingStatusArchived: 'Archived',

  // ── Budget status — services/finance.ts ───────────────────────────────────
  budgetStatusActive: 'Active',
  budgetStatusCompleted: 'Completed',

  // ── Voucher / requisition status ──────────────────────────────────────────
  voucherStatusPending: 'Pending',
  voucherStatusApproved: 'Approved',
  voucherStatusPaid: 'Paid',
  voucherStatusRejected: 'Rejected',

  // ── Plan and report timeframe ─────────────────────────────────────────────
  timeframeWeekly: 'Weekly',
  timeframeMonthly: 'Monthly',
  timeframeAnnually: 'Annually',

  // ── Reporting tier ────────────────────────────────────────────────────────
  reportOptionMemriya: 'Memriya',
  reportOptionKifil: 'Kifil',
  reportOptionZerf: 'Zerf',

  // ── Marital status ────────────────────────────────────────────────────────
  maritalStatusSingle: 'Single',
  maritalStatusMarried: 'Married',
  maritalStatusDivorced: 'Divorced',
  maritalStatusWidowed: 'Widowed',

  // ── Gender ────────────────────────────────────────────────────────────────
  genderMale: 'Male',
  genderFemale: 'Female',
  genderOther: 'Other',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const statusAm: Record<keyof typeof statusEn, string> = {
  assetStatusInUse: 'በአገልግሎት ላይ',
  assetStatusInStorage: 'በመጋዘን ውስጥ',
  assetStatusMaintenance: 'በጥገና ላይ',
  assetStatusRetired: 'ከአገልግሎት የወጣ',
  assetStatusDisposed: 'የተወገደ',

  assetConditionNew: 'አዲስ',
  assetConditionGood: 'ጥሩ',
  assetConditionFair: 'መካከለኛ',
  assetConditionPoor: 'ደካማ',

  acquisitionTypePurchased: 'የተገዛ',
  acquisitionTypeRented: 'የተከራየ',

  employmentStatusActive: 'በሥራ ላይ',
  employmentStatusOnLeave: 'በፈቃድ ላይ',
  employmentStatusTerminated: 'ሥራው የተቋረጠ',
  employmentStatusInactive: 'ከሥራ ውጭ',

  employmentTypeFullTime: 'ሙሉ ጊዜ',
  employmentTypePartTime: 'ትርፍ ጊዜ',
  employmentTypeContract: 'በውል',
  employmentTypeVolunteer: 'በጎ ፈቃደኛ',

  // REVIEW: ካህን is the ordained priest; ሠራተኛ the lay employee. Confirm this
  // matches how the church names the two payroll categories.
  employeeCategoryPriest: 'ካህን',
  employeeCategoryStaff: 'ሠራተኛ',

  teachingStatusDraft: 'ረቂቅ',
  teachingStatusPublished: 'የታተመ',
  teachingStatusArchived: 'በማህደር የተቀመጠ',

  budgetStatusActive: 'በሥራ ላይ',
  budgetStatusCompleted: 'የተጠናቀቀ',

  voucherStatusPending: 'በመጠባበቅ ላይ',
  voucherStatusApproved: 'የጸደቀ',
  voucherStatusPaid: 'የተከፈለ',
  voucherStatusRejected: 'ውድቅ የተደረገ',

  // Matches `pages.weekly/monthly/annually`, already shipped.
  timeframeWeekly: 'ሳምንታዊ',
  timeframeMonthly: 'ወርኃዊ',
  timeframeAnnually: 'ዓመታዊ',

  // REVIEW: the three reporting tiers. መምሪያ matches `pages.memriya`, already
  // shipped. ክፍል and ዘርፍ are the natural readings of Kifil and Zerf, but these
  // are structural terms from the bylaws — confirm against the church's usage.
  reportOptionMemriya: 'መምሪያ',
  reportOptionKifil: 'ክፍል',
  reportOptionZerf: 'ዘርፍ',

  // Matches `signup.single/married/divorced/widowed`, already shipped.
  maritalStatusSingle: 'ያላገባ',
  maritalStatusMarried: 'ያገባ',
  maritalStatusDivorced: 'የተፋታ',
  maritalStatusWidowed: 'የሞተበት/የሞተባት',

  // Matches `pages.male/female`, already shipped.
  genderMale: 'ወንድ',
  genderFemale: 'ሴት',
  genderOther: 'ሌላ',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const statusOm: Partial<Record<keyof typeof statusEn, string>> = {};
export const statusTi: Partial<Record<keyof typeof statusEn, string>> = {};
