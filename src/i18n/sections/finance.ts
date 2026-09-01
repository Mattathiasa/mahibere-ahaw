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

  // ── Pledges ───────────────────────────────────────────────────────────────
  totalPledged: 'Total pledged',
  totalCollected: 'Total collected',
  remainingBalance: 'Remaining balance',
  addNewPledge: 'Add new pledge',
  memberNameRequired: 'Member name *',
  campaignTitle: 'Campaign title',
  pledgedAmount: 'Pledged amount (ETB) *',
  initialPaidAmount: 'Initial paid amount (ETB)',
  dueDateEthiopian: 'Due date (Ethiopian calendar)',
  savePledge: 'Save pledge',
  pledgeRecords: 'Pledge records',
  noPledges: 'No pledge records registered yet.',
  pledgedLabel: 'Pledged:',
  paidLabel: 'Paid:',
  remainingLabel: 'Remaining:',
  pledgeMissingFields: 'Please enter a member name and a valid pledged amount.',
  pledgeRecorded: 'Pledge recorded.',
  pledgeFailed: 'Could not record the pledge.',
  pledgePaymentRecorded: 'Pledge payment recorded.',

  // ── Transactions ──────────────────────────────────────────────────────────
  addTransaction: 'Add transaction',
  addTransactionDesc: 'Record a financial transaction with an optional receipt or document.',
  transactionType: 'Transaction type *',
  amountBirr: 'Amount (Birr) *',
  bankToBankTransfer: 'Bank-to-bank transfer',
  fromAccount: 'From account *',
  fromAccountPlaceholder: 'Source account',
  toAccount: 'To account *',
  toAccountPlaceholder: 'Destination account',
  receiptScreenshot: 'Receipt / screenshot',
  attachReceipt: 'Attach receipt',
  descriptionRequired: 'Description *',
  descriptionPlaceholder: 'Enter transaction description',
  categoryOptional: 'Category (optional)',
  categoryPlaceholder: 'e.g., Utilities, Salaries, Donations',
  attachmentsOptional: 'Attachments (optional)',
  sendToOptional: 'Send to (optional)',
  sendToPlaceholder: 'Select Memriyas to send this transaction to...',

  // ── Vouchers ──────────────────────────────────────────────────────────────
  newVoucherRequest: 'New requisition voucher request',
  requestedBy: 'Requested by *',
  requesterNamePlaceholder: 'Requester name',
  purposeDetails: 'Purpose / details *',
  purposePlaceholder: 'Purpose of expenditure',
  amountEtb: 'Amount (ETB) *',
  dateEthiopian: 'Date (Ethiopian calendar)',
  voucherHistory: 'Payment vouchers history',
  noVouchers: 'No requisition vouchers requested yet.',
  voucherMissingFields: 'Please fill in requested by, purpose, and amount.',
  voucherFailed: 'Could not create the requisition.',

  // ── Budget dialog ─────────────────────────────────────────────────────────
  createMonthlyBudget: 'Create monthly budget',
  createMonthlyBudgetDesc: 'Plan your monthly income and expenses.',
  createBudget: 'Create budget',
  monthRequired: 'Month *',
  yearRequired: 'Year *',
  plannedIncomeRequired: 'Planned income (Birr) *',
  plannedExpensesRequired: 'Planned expenses (Birr) *',
  notesOptional: 'Notes (optional)',
  notesPlaceholder: 'Additional notes about this budget',
  sendBudgetPlaceholder: 'Select Memriyas to send this budget to...',
  attachments: 'Attachments',

  // ── Financial report dialog ───────────────────────────────────────────────
  generateFinancialReport: 'Generate financial report',
  generateFinancialReportDesc: 'Create a comprehensive financial report with document attachments.',
  generateReport: 'Generate report',
  reportTitleEn: 'Report title (English) *',
  reportTitleEnPlaceholder: 'e.g., Monthly Financial Report - December 2024',
  reportTitleAm: 'Report title (Amharic) *',
  reportTypeRequired: 'Report type *',
  recipientInfoOptional: 'Recipient information (optional)',
  recipientInfoPlaceholder: 'To whom it may concern — e.g., Atbiya Leadership, Regional Office',
  sendReportPlaceholder: 'Select Memriyas to send this financial report to...',

  // ── Tithe tracker ─────────────────────────────────────────────────────────
  titheMissingFields: 'Please enter a member name and a valid amount.',
  titheFailed: 'Could not record the tithe.',
  bankCbe: 'Commercial Bank of Ethiopia (CBE)',
  bankTelebirr: 'Telebirr',
  bankAwash: 'Awash Bank',
  bankDashen: 'Dashen Bank',
  titheNotePlaceholder: 'Specific notes or intention...',
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

  totalPledged: 'ጠቅላላ ቃል የተገባ',
  totalCollected: 'ጠቅላላ የተሰበሰበ',
  remainingBalance: 'ቀሪ ሒሳብ',
  addNewPledge: 'አዲስ ቃል ኪዳን ጨምር',
  memberNameRequired: 'የአባል ስም *',
  campaignTitle: 'የዘመቻው ርዕስ',
  pledgedAmount: 'ቃል የተገባ መጠን (ብር) *',
  initialPaidAmount: 'የመጀመሪያ የተከፈለ መጠን (ብር)',
  dueDateEthiopian: 'የመክፈያ ቀን (የኢትዮጵያ ዘመን አቆጣጠር)',
  savePledge: 'ቃል ኪዳኑን አስቀምጥ',
  pledgeRecords: 'የቃል ኪዳን መዝገቦች',
  noPledges: 'እስካሁን የተመዘገበ ቃል ኪዳን የለም።',
  pledgedLabel: 'ቃል የተገባ፦',
  paidLabel: 'የተከፈለ፦',
  remainingLabel: 'ቀሪ፦',
  pledgeMissingFields: 'እባክዎ የአባሉን ስምና ትክክለኛ የቃል ኪዳን መጠን ያስገቡ።',
  pledgeRecorded: 'ቃል ኪዳኑ ተመዝግቧል።',
  pledgeFailed: 'ቃል ኪዳኑን መመዝገብ አልተቻለም።',
  pledgePaymentRecorded: 'የቃል ኪዳኑ ክፍያ ተመዝግቧል።',

  addTransaction: 'ግብይት ጨምር',
  addTransactionDesc: 'የገንዘብ ግብይትን ከደረሰኝ ወይም ከሰነድ ጋር ይመዝግቡ።',
  transactionType: 'የግብይት ዓይነት *',
  amountBirr: 'መጠን (ብር) *',
  bankToBankTransfer: 'ከባንክ ወደ ባንክ ዝውውር',
  fromAccount: 'ከሒሳብ ቁጥር *',
  fromAccountPlaceholder: 'የመነሻ ሒሳብ',
  toAccount: 'ወደ ሒሳብ ቁጥር *',
  toAccountPlaceholder: 'የመድረሻ ሒሳብ',
  receiptScreenshot: 'ደረሰኝ / ቅጽበታዊ ገጽ',
  attachReceipt: 'ደረሰኝ አያይዝ',
  descriptionRequired: 'መግለጫ *',
  descriptionPlaceholder: 'የግብይቱን መግለጫ ያስገቡ',
  categoryOptional: 'ምድብ (አማራጭ)',
  categoryPlaceholder: 'ለምሳሌ የመገልገያ ክፍያ፣ ደመወዝ፣ ልገሳ',
  attachmentsOptional: 'አባሪዎች (አማራጭ)',
  sendToOptional: 'ወደ ማን ይላክ (አማራጭ)',
  sendToPlaceholder: 'ይህ ግብይት የሚላክላቸውን መምሪያዎች ይምረጡ...',

  newVoucherRequest: 'አዲስ የግዢ ጥያቄ ሰነድ',
  requestedBy: 'ጠያቂው *',
  requesterNamePlaceholder: 'የጠያቂው ስም',
  purposeDetails: 'ዓላማ / ዝርዝር *',
  purposePlaceholder: 'የወጪው ዓላማ',
  amountEtb: 'መጠን (ብር) *',
  dateEthiopian: 'ቀን (የኢትዮጵያ ዘመን አቆጣጠር)',
  voucherHistory: 'የክፍያ ሰነዶች ታሪክ',
  noVouchers: 'እስካሁን የተጠየቀ የግዢ ሰነድ የለም።',
  voucherMissingFields: 'እባክዎ ጠያቂውን፣ ዓላማውንና መጠኑን ይሙሉ።',
  voucherFailed: 'የግዢ ጥያቄውን መፍጠር አልተቻለም።',

  createMonthlyBudget: 'ወርኃዊ በጀት ፍጠር',
  createMonthlyBudgetDesc: 'ወርኃዊ ገቢዎንና ወጪዎን ያቅዱ።',
  createBudget: 'በጀት ፍጠር',
  monthRequired: 'ወር *',
  yearRequired: 'ዓመት *',
  plannedIncomeRequired: 'የታቀደ ገቢ (ብር) *',
  plannedExpensesRequired: 'የታቀደ ወጪ (ብር) *',
  notesOptional: 'ማስታወሻ (አማራጭ)',
  notesPlaceholder: 'ስለዚህ በጀት ተጨማሪ ማስታወሻ',
  sendBudgetPlaceholder: 'ይህ በጀት የሚላክላቸውን መምሪያዎች ይምረጡ...',
  attachments: 'አባሪዎች',

  generateFinancialReport: 'የገንዘብ ሪፖርት አዘጋጅ',
  generateFinancialReportDesc: 'የተሟላ የገንዘብ ሪፖርት ከሰነድ አባሪዎች ጋር ያዘጋጁ።',
  generateReport: 'ሪፖርት አዘጋጅ',
  reportTitleEn: 'የሪፖርቱ ርዕስ (እንግሊዝኛ) *',
  reportTitleEnPlaceholder: 'ለምሳሌ ወርኃዊ የገንዘብ ሪፖርት - ታኅሣሥ 2024',
  reportTitleAm: 'የሪፖርቱ ርዕስ (አማርኛ) *',
  reportTypeRequired: 'የሪፖርት ዓይነት *',
  recipientInfoOptional: 'የተቀባይ መረጃ (አማራጭ)',
  recipientInfoPlaceholder: 'ለሚመለከተው ሁሉ — ለምሳሌ የአጥቢያ አመራር፣ የክልል ጽ/ቤት',
  sendReportPlaceholder: 'ይህ የገንዘብ ሪፖርት የሚላክላቸውን መምሪያዎች ይምረጡ...',

  titheMissingFields: 'እባክዎ የአባሉን ስምና ትክክለኛ መጠን ያስገቡ።',
  titheFailed: 'አሥራቱን መመዝገብ አልተቻለም።',
  bankCbe: 'የኢትዮጵያ ንግድ ባንክ (ኢንባ)',
  bankTelebirr: 'ቴሌብር',
  bankAwash: 'አዋሽ ባንክ',
  bankDashen: 'ዳሽን ባንክ',
  titheNotePlaceholder: 'የተለየ ማስታወሻ ወይም ዓላማ...',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const financeOm: Partial<Record<keyof typeof financeEn, string>> = {};
export const financeTi: Partial<Record<keyof typeof financeEn, string>> = {};
