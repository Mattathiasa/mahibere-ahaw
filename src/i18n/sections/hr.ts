/**
 * Human resources, payroll and employee record screens.
 *
 * Employment status, type and category are NOT here — they are persisted in
 * Firestore, so their labels live in `status` and resolve through
 * src/i18n/enums.ts.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const hrEn = {
  title: 'Human Resources',
  subtitle: 'Manage church employees, positions, payroll, and staff profiles.',

  totalEmployees: 'Total employees',
  totalActive: 'Active employees',
  totalInactive: 'Inactive employees',

  colEmployeeId: 'Employee ID',
  colName: 'Name',
  colGross: 'Gross',
  colDeduction: 'Deduction',
  colBenefit: 'Benefit',
  colNet: 'Net',
  colStatus: 'Status',
  colDate: 'Date',
  colActions: 'Operations',

  emptyTitle: 'No employees found',
  emptyHint: 'Register your first employee to get started.',

  viewProfile: 'View employee profile',
  editEmployee: 'Edit employee',
  removeEmployee: 'Remove employee',
  registerEmployee: 'Register employee',

  saveFailed: 'Could not save the employee.',
  removed: 'Employee removed.',
  removeFailed: 'Could not remove the employee.',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const hrAm: Record<keyof typeof hrEn, string> = {
  title: 'የሰው ሀብት',
  subtitle: 'የቤተ ክርስቲያኒቱን ሠራተኞች፣ የሥራ መደቦች፣ ደመወዝና የሠራተኛ መገለጫዎች ያስተዳድሩ።',

  totalEmployees: 'ጠቅላላ ሠራተኞች',
  totalActive: 'በሥራ ላይ ያሉ ሠራተኞች',
  totalInactive: 'ከሥራ ውጭ ያሉ ሠራተኞች',

  colEmployeeId: 'የሠራተኛ መለያ',
  colName: 'ስም',
  colGross: 'ጠቅላላ',
  colDeduction: 'ተቀናሽ',
  colBenefit: 'ጥቅማ ጥቅም',
  colNet: 'የተጣራ',
  colStatus: 'ሁኔታ',
  colDate: 'ቀን',
  colActions: 'ተግባራት',

  emptyTitle: 'ምንም ሠራተኛ አልተገኘም',
  emptyHint: 'ለመጀመር የመጀመሪያውን ሠራተኛዎን ይመዝግቡ።',

  viewProfile: 'የሠራተኛ መገለጫ ይመልከቱ',
  editEmployee: 'ሠራተኛ አርትዕ',
  removeEmployee: 'ሠራተኛ አስወግድ',
  registerEmployee: 'ሠራተኛ መዝግብ',

  saveFailed: 'ሠራተኛውን ማስቀመጥ አልተቻለም።',
  removed: 'ሠራተኛው ተወግዷል።',
  removeFailed: 'ሠራተኛውን ማስወገድ አልተቻለም።',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const hrOm: Partial<Record<keyof typeof hrEn, string>> = {};
export const hrTi: Partial<Record<keyof typeof hrEn, string>> = {};
