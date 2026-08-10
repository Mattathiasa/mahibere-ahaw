/**
 * Field labels, placeholders and validation messages shared across forms,
 * wizards and dialogs.
 *
 * The most reused section in the app — check here before adding a key
 * elsewhere. A label like "Phone number" appears in the employee wizard, the
 * member wizard, the partner form and the parish registry; one key serves all
 * of them, and an admin retranslating it fixes every screen at once.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const formsEn = {
  // ── Wizard steps ──────────────────────────────────────────────────────────
  stepEmployerInfo: 'Employer information',
  stepPersonalInfo: 'Personal info',
  stepFamilyInfo: 'Family information',
  stepEducation: 'Education background',
  stepJob: 'Job',
  stepBankTin: 'Bank and TIN',
  stepEmergencyContact: 'Emergency contact',

  // ── Employer ──────────────────────────────────────────────────────────────
  employerName: 'Employer name (church name)',
  employerNamePlaceholder: 'Mahibere Ahaw Church',
  houseNumber: 'House number',
  houseNumberPlaceholder: 'House No.',

  // ── Person ────────────────────────────────────────────────────────────────
  fullName: 'Full name',
  fullNameRequired: 'Full name *',
  fullNamePlaceholder: 'e.g. Abebe Bikila',
  firstName: 'First name',
  middleName: 'Middle name',
  lastName: 'Last name',
  salutation: 'Salutation',
  salutationPlaceholder: 'Mr., Mrs., Dr.',
  gender: 'Gender',
  phoneNumber: 'Phone number',
  email: 'Email',
  emailPlaceholder: 'you@example.com',
  location: 'Location',
  locationPlaceholder: 'Addis Ababa, Ethiopia',
  residentialAddress: 'Residential address',
  address: 'Address',
  relationship: 'Relationship',
  relationshipPlaceholder: 'e.g. Spouse, Brother, Sister',

  // ── Family ────────────────────────────────────────────────────────────────
  spouseFullName: 'Spouse full name',
  spousePhone: 'Spouse phone number',
  childrenCount: 'Number of children',

  // ── Education ─────────────────────────────────────────────────────────────
  cvDocument: 'CV document',
  academicStatus: 'Academic status',
  academicStatusPlaceholder: 'e.g. Bachelor Degree',
  institution: 'Institution',
  institutionPlaceholder: 'e.g. Addis Ababa University',
  fieldOfStudy: 'Field of study',
  fieldOfStudyPlaceholder: 'e.g. Accounting, Theology',
  graduationDate: 'Graduation date (EC — YYYY)',
  graduationDatePlaceholder: 'EC — 2014',

  // ── Employment ────────────────────────────────────────────────────────────
  currentPosition: 'Current position *',
  currentPositionPlaceholder: 'e.g. Accountant, Priest, Administrator',
  employmentDate: 'Employment date (EC — YYYY)',
  employmentDatePlaceholder: 'EC — 2016',
  employmentType: 'Employment type',
  haveWorkExperience: 'Have work experience?',
  yes: 'Yes',
  no: 'No',

  // ── Bank & tax ────────────────────────────────────────────────────────────
  salaryBankName: 'Salary bank name',
  salaryBankAccount: 'Salary bank account',
  pfBankName: 'PF bank name',
  pfBankAccount: 'PF bank account',
  socialIdNumber: 'Social identification number',
  tinNumber: 'Tax identification number (TIN)',

  // ── Payroll ───────────────────────────────────────────────────────────────
  grossSalary: 'Gross salary (ETB) *',
  overtime: 'Overtime (ETB)',
  transportAllowance: 'Transport allowance',
  houseAllowance: 'House allowance',
  taxDeduction: 'Tax deduction (ETB)',
  pensionDeduction: 'Pension deduction (7%)',
  netSalary: 'Net salary',

  // ── Report dialog ─────────────────────────────────────────────────────────
  submitReport: 'Submit report',
  submitReportDesc: 'Submit a report with optional document attachments.',
  selectPlanRequired: 'Select plan *',
  selectPlanPlaceholder: 'Select a plan',
  reportOptionRequired: 'Report option *',
  timeframeRequired: 'Timeframe *',
  workDone: 'Work done *',
  workDonePlaceholder: 'Describe the work completed',
  result: 'Result *',
  resultPlaceholder: 'Describe the results achieved',
  attachments: 'Attachments (optional)',
  department: 'Department',

  // ── Member wizard ─────────────────────────────────────────────────────────
  namePlaceholder: 'John Doe',
  occupationPlaceholder: 'Occupation or institution',
  subCityPlaceholder: 'e.g. Sub City',
  woredaPlaceholder: 'e.g. Bole',
  personalArchive: 'Personal archive',
  username: 'Username',
  born: 'Born',
  memberStatus: 'Status',
  divineAssignment: 'Divine assignment',
  region: 'Region',
  profession: 'Profession',
  assignedRoles: 'Assigned roles',

  // ── Plan dialog ───────────────────────────────────────────────────────────
  createNewPlan: 'Create new plan',
  createNewPlanDesc: 'Add a new plan with optional document attachments.',
  planNameRequired: 'Plan name *',
  planNamePlaceholder: 'Enter plan name',
  detailsRequired: 'Details *',
  detailsPlaceholder: 'Enter plan details',

  // ── Employee details ──────────────────────────────────────────────────────
  position: 'Position',
  totalBenefits: 'Total benefits',
  totalDeductions: 'Total deductions',
  nameLabel: 'Name:',
  relationshipLabel: 'Relationship:',
  phoneLabel: 'Phone:',
  addressLabel: 'Address:',

  // ── Search ────────────────────────────────────────────────────────────────
  searchTypeToSearch: 'Type to search...',
  searchNoResults: 'No results found.',
  searchPagesHeading: 'Pages',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const formsAm: Record<keyof typeof formsEn, string> = {
  stepEmployerInfo: 'የቀጣሪ መረጃ',
  stepPersonalInfo: 'የግል መረጃ',
  stepFamilyInfo: 'የቤተሰብ መረጃ',
  stepEducation: 'የትምህርት ዳራ',
  stepJob: 'ሥራ',
  stepBankTin: 'ባንክና ቲን',
  stepEmergencyContact: 'የአደጋ ጊዜ አድራሻ',

  employerName: 'የቀጣሪ ስም (የቤተ ክርስቲያን ስም)',
  employerNamePlaceholder: 'ማኅበረ አኀው ቤተ ክርስቲያን',
  houseNumber: 'የቤት ቁጥር',
  houseNumberPlaceholder: 'የቤት ቁ.',

  fullName: 'ሙሉ ስም',
  fullNameRequired: 'ሙሉ ስም *',
  fullNamePlaceholder: 'ለምሳሌ አበበ ቢቂላ',
  firstName: 'የመጀመሪያ ስም',
  middleName: 'የአባት ስም',
  lastName: 'የአያት ስም',
  salutation: 'ማዕረግ',
  salutationPlaceholder: 'አቶ፣ ወ/ሮ፣ ዶ/ር',
  gender: 'ጾታ',
  phoneNumber: 'የስልክ ቁጥር',
  email: 'ኢሜይል',
  emailPlaceholder: 'you@example.com',
  location: 'ቦታ',
  locationPlaceholder: 'አዲስ አበባ፣ ኢትዮጵያ',
  residentialAddress: 'የመኖሪያ አድራሻ',
  address: 'አድራሻ',
  relationship: 'ዝምድና',
  relationshipPlaceholder: 'ለምሳሌ የትዳር አጋር፣ ወንድም፣ እህት',

  spouseFullName: 'የትዳር አጋር ሙሉ ስም',
  spousePhone: 'የትዳር አጋር ስልክ ቁጥር',
  childrenCount: 'የልጆች ብዛት',

  cvDocument: 'የሕይወት ታሪክ ሰነድ',
  academicStatus: 'የትምህርት ደረጃ',
  academicStatusPlaceholder: 'ለምሳሌ የመጀመሪያ ዲግሪ',
  institution: 'ተቋም',
  institutionPlaceholder: 'ለምሳሌ አዲስ አበባ ዩኒቨርሲቲ',
  fieldOfStudy: 'የትምህርት ዘርፍ',
  fieldOfStudyPlaceholder: 'ለምሳሌ አካውንቲንግ፣ ነገረ መለኮት',
  graduationDate: 'የምረቃ ቀን (ዓ.ም — ዓዓዓዓ)',
  graduationDatePlaceholder: 'ዓ.ም — 2014',

  currentPosition: 'የአሁኑ የሥራ መደብ *',
  currentPositionPlaceholder: 'ለምሳሌ ሒሳብ ሠራተኛ፣ ካህን፣ አስተዳዳሪ',
  employmentDate: 'የቅጥር ቀን (ዓ.ም — ዓዓዓዓ)',
  employmentDatePlaceholder: 'ዓ.ም — 2016',
  employmentType: 'የቅጥር ዓይነት',
  haveWorkExperience: 'የሥራ ልምድ አለዎት?',
  yes: 'አዎ',
  no: 'የለም',

  salaryBankName: 'የደመወዝ ባንክ ስም',
  salaryBankAccount: 'የደመወዝ ባንክ ሒሳብ ቁጥር',
  pfBankName: 'የፕሮቪደንት ፈንድ ባንክ ስም',
  pfBankAccount: 'የፕሮቪደንት ፈንድ ሒሳብ ቁጥር',
  socialIdNumber: 'የማኅበራዊ መለያ ቁጥር',
  tinNumber: 'የግብር ከፋይ መለያ ቁጥር (ቲን)',

  grossSalary: 'ጠቅላላ ደመወዝ (ብር) *',
  overtime: 'የትርፍ ሰዓት ክፍያ (ብር)',
  transportAllowance: 'የትራንስፖርት አበል',
  houseAllowance: 'የቤት አበል',
  taxDeduction: 'የግብር ተቀናሽ (ብር)',
  pensionDeduction: 'የጡረታ ተቀናሽ (7%)',
  netSalary: 'የተጣራ ደመወዝ',

  submitReport: 'ሪፖርት አስገባ',
  submitReportDesc: 'ሪፖርትዎን ከሰነድ አባሪ ጋር ያስገቡ።',
  selectPlanRequired: 'ዕቅድ ይምረጡ *',
  selectPlanPlaceholder: 'ዕቅድ ይምረጡ',
  reportOptionRequired: 'የሪፖርት ደረጃ *',
  timeframeRequired: 'የጊዜ ገደብ *',
  workDone: 'የተሠራ ሥራ *',
  workDonePlaceholder: 'የተጠናቀቀውን ሥራ ይግለጹ',
  result: 'ውጤት *',
  resultPlaceholder: 'የተገኘውን ውጤት ይግለጹ',
  attachments: 'አባሪዎች (አማራጭ)',
  department: 'መምሪያ',

  namePlaceholder: 'አበበ ከበደ',
  occupationPlaceholder: 'ሙያ ወይም ተቋም',
  subCityPlaceholder: 'ለምሳሌ ክፍለ ከተማ',
  woredaPlaceholder: 'ለምሳሌ ቦሌ',
  personalArchive: 'የግል መዝገብ',
  username: 'የተጠቃሚ ስም',
  born: 'የተወለደበት',
  memberStatus: 'ሁኔታ',
  divineAssignment: 'መንፈሳዊ ኃላፊነት',
  region: 'ክልል',
  profession: 'ሙያ',
  assignedRoles: 'የተሰጡ ኃላፊነቶች',

  createNewPlan: 'አዲስ ዕቅድ ፍጠር',
  createNewPlanDesc: 'አዲስ ዕቅድ ከሰነድ አባሪዎች ጋር ይጨምሩ።',
  planNameRequired: 'የዕቅዱ ስም *',
  planNamePlaceholder: 'የዕቅዱን ስም ያስገቡ',
  detailsRequired: 'ዝርዝር *',
  detailsPlaceholder: 'የዕቅዱን ዝርዝር ያስገቡ',

  position: 'የሥራ መደብ',
  totalBenefits: 'ጠቅላላ ጥቅማ ጥቅም',
  totalDeductions: 'ጠቅላላ ተቀናሽ',
  nameLabel: 'ስም፦',
  relationshipLabel: 'ዝምድና፦',
  phoneLabel: 'ስልክ፦',
  addressLabel: 'አድራሻ፦',

  searchTypeToSearch: 'ለመፈለግ ይተይቡ...',
  searchNoResults: 'ምንም ውጤት አልተገኘም።',
  searchPagesHeading: 'ገጾች',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const formsOm: Partial<Record<keyof typeof formsEn, string>> = {};
export const formsTi: Partial<Record<keyof typeof formsEn, string>> = {};
