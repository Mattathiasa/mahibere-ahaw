/**
 * Finance, budget, tithe, pledge and voucher screens.
 *
 * Note the income/expense category keys (`cat*`). The category token stored in
 * Firestore — `'Special Gift'`, `'Project Contribution'` — contains spaces, so
 * it cannot be a key suffix the way the `status` enums are; the mapping from
 * token to key lives at the call site instead. The stored token itself is never
 * translated, for the usual reason: it is summed and filtered on.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const financeEn = {
  title: 'Finances',
  subtitle:
    'Comprehensive financial management, member tithes, budget allocations, and reporting.',

  // ── Summary cards ─────────────────────────────────────────────────────────
  totalMembers: 'Total members',
  totalTeams: 'Total teams',
  smsSent: 'SMS sent',
  totalBalance: 'Total balance',
  systemUsers: 'System users',

  // ── Income categories ─────────────────────────────────────────────────────
  catSales: 'Sales',
  catTithe: 'Tithe',
  catSpecialGift: 'Special gift',
  catDonation: 'Donation',
  catProjectContribution: 'Project contribution',

  // ── Expense categories ────────────────────────────────────────────────────
  catPayroll: 'Payroll',
  catPettyCash: 'Petty cash',
  catUtilityFees: 'Utility fees',

  // ── Budget shortcuts ──────────────────────────────────────────────────────
  bankIntegration: 'Bank integration',
  ministryBudget: 'Ministry budget',
  leadershipBudget: 'Leadership budget',
  teamsBudget: 'Teams budget',
  totalChurchBudget: 'Total church budget',

  // ── Report shortcuts ──────────────────────────────────────────────────────
  customReport: 'Custom finance report',
  threeMonthReport: '3-month finance report',
  sixMonthReport: '6-month finance report',
  yearlyReport: 'Yearly finance report',

  // ── Transactions table ────────────────────────────────────────────────────
  colDescription: 'Description',
  colCategory: 'Category',
  colType: 'Type',
  colEthiopianDate: 'Ethiopian date',
  colAmount: 'Amount (ETB)',

  // ── Tithe table ───────────────────────────────────────────────────────────
  colReceiptNo: 'Receipt #',
  colMemberName: 'Member name',
  colMethod: 'Method',

  // ── Budgets ───────────────────────────────────────────────────────────────
  monthlyBudgets: 'Monthly budgets',
  colMonthYear: 'Month / year',
  colPlannedIncome: 'Planned income',
  colPlannedExpenses: 'Planned expenses',
  colStatus: 'Status',

  // ── Reports ───────────────────────────────────────────────────────────────
  financialReports: 'Financial reports',
  noReports: 'No financial reports generated yet.',
  incomeLabel: 'Income:',
  expensesLabel: 'Expenses:',

  // ── Toasts ────────────────────────────────────────────────────────────────
  transactionRecorded: 'Transaction recorded.',
  budgetCreated: 'Budget created.',
  reportGenerated: 'Financial report generated.',

  /** Shown on a bank account card that is in service. */
  accountActive: 'Active',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const financeAm: Record<keyof typeof financeEn, string> = {
  title: 'ገንዘብ',
  subtitle: 'የተሟላ የገንዘብ አስተዳደር፣ የአባላት አሥራት፣ የበጀት ድልድልና ሪፖርት።',

  totalMembers: 'ጠቅላላ አባላት',
  totalTeams: 'ጠቅላላ ቡድኖች',
  smsSent: 'የተላከ አጭር መልእክት',
  totalBalance: 'ጠቅላላ ቀሪ ሒሳብ',
  systemUsers: 'የሥርዓቱ ተጠቃሚዎች',

  catSales: 'ሽያጭ',
  catTithe: 'አሥራት',
  catSpecialGift: 'ልዩ ስጦታ',
  catDonation: 'ልገሳ',
  catProjectContribution: 'የፕሮጀክት መዋጮ',

  catPayroll: 'ደመወዝ',
  catPettyCash: 'ጥቃቅን ወጪ',
  catUtilityFees: 'የመገልገያ ክፍያዎች',

  bankIntegration: 'የባንክ ውሕደት',
  ministryBudget: 'የአገልግሎት በጀት',
  leadershipBudget: 'የአመራር በጀት',
  teamsBudget: 'የቡድኖች በጀት',
  totalChurchBudget: 'የቤተ ክርስቲያኒቱ ጠቅላላ በጀት',

  customReport: 'ልዩ የገንዘብ ሪፖርት',
  threeMonthReport: 'የሦስት ወር የገንዘብ ሪፖርት',
  sixMonthReport: 'የስድስት ወር የገንዘብ ሪፖርት',
  yearlyReport: 'ዓመታዊ የገንዘብ ሪፖርት',

  colDescription: 'መግለጫ',
  colCategory: 'ምድብ',
  colType: 'ዓይነት',
  colEthiopianDate: 'የኢትዮጵያ ቀን',
  colAmount: 'መጠን (ብር)',

  colReceiptNo: 'የደረሰኝ ቁጥር',
  colMemberName: 'የአባል ስም',
  colMethod: 'የክፍያ መንገድ',

  monthlyBudgets: 'ወርኃዊ በጀቶች',
  colMonthYear: 'ወር / ዓመት',
  colPlannedIncome: 'የታቀደ ገቢ',
  colPlannedExpenses: 'የታቀደ ወጪ',
  colStatus: 'ሁኔታ',

  financialReports: 'የገንዘብ ሪፖርቶች',
  noReports: 'እስካሁን የተዘጋጀ የገንዘብ ሪፖርት የለም።',
  incomeLabel: 'ገቢ፦',
  expensesLabel: 'ወጪ፦',

  transactionRecorded: 'ግብይቱ ተመዝግቧል።',
  budgetCreated: 'በጀቱ ተፈጥሯል።',
  reportGenerated: 'የገንዘብ ሪፖርቱ ተዘጋጅቷል።',

  accountActive: 'በሥራ ላይ',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const financeOm: Partial<Record<keyof typeof financeEn, string>> = {};
export const financeTi: Partial<Record<keyof typeof financeEn, string>> = {};
