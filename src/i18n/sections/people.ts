/**
 * Members, congregation, user management and membership request screens.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const peopleEn = {
  ministrySundaySchool: 'Sunday school',
  ministryYouthMinistry: 'Youth ministry',
  ministryWomenMinistry: 'Women ministry',
  ministryChoir: 'Choir',
  ministryDeaconService: 'Deacon service',
  ministryPrayerTeam: 'Prayer team',
  ministryMediaMinistry: 'Media ministry',

  // ── Invite / role options ─────────────────────────────────────────────────
  roleSystemOwner: 'System owner',
  roleSystemAdmin: 'System admin',
  roleFinanceManager: 'Finance manager',
  roleHrManager: 'HR manager',
  roleMember: 'Member',
  inviteMissingContact: 'Please provide an email or a phone number.',
  emailExamplePlaceholder: 'user@example.com',

  // ── Parish registry examples ──────────────────────────────────────────────
  parishNameExample: 'Bishoftu Congregation',
  cityExample: 'Bishoftu',
  addressExample: 'Around Zikuala roundabout, in front of Awash Hotel, about 100m',
  adminNameExample: 'Addishiwot Teshome Worku',
  adminEmailExample: 'addishiwot@example.com',
  bankExample: 'Birhan Bank',
  personNameExample: 'Abebe Kebede Worku',
  usernameExample: 'abebe.k',
  personEmailExample: 'abebe@example.com',

  // ── Membership decision notifications ─────────────────────────────────────
  approvedTitle: 'Your membership was approved',
  approvedMessage: 'You can now sign in and use the system. Welcome!',
  rejectedTitle: 'Your membership request was not approved',
  rejectedNoReason: 'Please contact your parish for details.',

  // ── User management: role options (persisted) ─────────────────────────────
  roleAdministrator: 'Administrator',
  roleSecretary: 'Secretary',
  roleFinanceHead: 'Finance head',
  roleDepartmentHead: 'Department head',
  roleStaff: 'Staff',
  rolePriest: 'Priest',
  roleDeacon: 'Deacon',
  roleSundaySchoolTeacher: 'Sunday school teacher',
  roleChoirMember: 'Choir member',
  roleYouthLeader: 'Youth leader',
  roleWomenMinistry: 'Women ministry',
  roleMenMinistry: 'Men ministry',
  roleElder: 'Elder',
  roleGeneralMember: 'General member',

  // ── User management: table & form ─────────────────────────────────────────
  umSubtitle: 'Create and manage system users',
  umColName: 'Name',
  umColRole: 'Role',
  umColActive: 'Active',
  umFullNameEnRequired: 'Full name (English) *',
  umProfilePictureOptional: 'Profile picture (optional)',
  umPreview: 'Preview',
  dioceseExample: 'East Shewa Diocese',
  addressExampleShort: 'Addis Ababa, Bole',
  usernameExampleShort: 'john.doe',
  professionPlaceholder: 'Teacher, Engineer...',
  interestsPlaceholder: 'Music, IT, Painting...',
  woredaExample: 'Bole',
  subCityExample: 'Bole Sub City',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const peopleAm: Record<keyof typeof peopleEn, string> = {
  ministrySundaySchool: 'ሰንበት ትምህርት ቤት',
  ministryYouthMinistry: 'የወጣቶች አገልግሎት',
  ministryWomenMinistry: 'የሴቶች አገልግሎት',
  ministryChoir: 'መዘምራን',
  ministryDeaconService: 'የዲያቆናት አገልግሎት',
  ministryPrayerTeam: 'የጸሎት ቡድን',
  ministryMediaMinistry: 'የሚዲያ አገልግሎት',

  roleSystemOwner: 'የሥርዓቱ ባለቤት',
  roleSystemAdmin: 'የሥርዓቱ አስተዳዳሪ',
  roleFinanceManager: 'የገንዘብ ኃላፊ',
  roleHrManager: 'የሰው ሀብት ኃላፊ',
  roleMember: 'አባል',
  inviteMissingContact: 'እባክዎ ኢሜይል ወይም የስልክ ቁጥር ያስገቡ።',
  emailExamplePlaceholder: 'user@example.com',

  parishNameExample: 'የቢሾፍቱ ጉባኤ',
  cityExample: 'ቢሾፍቱ',
  addressExample: 'ዝቋላ አደባባይ አካባቢ፣ ከአዋሽ ሆቴል ፊት ለፊት፣ 100 ሜትር ገደማ',
  adminNameExample: 'አዲስሕይወት ተሾመ ወርቁ',
  adminEmailExample: 'addishiwot@example.com',
  bankExample: 'ብርሃን ባንክ',
  personNameExample: 'አበበ ከበደ ወርቁ',
  usernameExample: 'abebe.k',
  personEmailExample: 'abebe@example.com',

  approvedTitle: 'አባልነትዎ ጸድቋል',
  approvedMessage: 'አሁን መግባትና ሥርዓቱን መጠቀም ይችላሉ። እንኳን ደህና መጡ!',
  rejectedTitle: 'የአባልነት ጥያቄዎ አልጸደቀም',
  rejectedNoReason: 'ለዝርዝሩ እባክዎ አጥቢያዎን ያነጋግሩ።',

  roleAdministrator: 'አስተዳዳሪ',
  roleSecretary: 'ጸሐፊ',
  roleFinanceHead: 'የገንዘብ ኃላፊ',
  roleDepartmentHead: 'የመምሪያ ኃላፊ',
  roleStaff: 'ሠራተኛ',
  rolePriest: 'ካህን',
  roleDeacon: 'ዲያቆን',
  roleSundaySchoolTeacher: 'የሰንበት ትምህርት ቤት አስተማሪ',
  roleChoirMember: 'የመዘምራን አባል',
  roleYouthLeader: 'የወጣቶች መሪ',
  roleWomenMinistry: 'የሴቶች አገልግሎት',
  roleMenMinistry: 'የወንዶች አገልግሎት',
  roleElder: 'ሽማግሌ',
  roleGeneralMember: 'መደበኛ አባል',

  umSubtitle: 'የሥርዓቱን ተጠቃሚዎች ይፍጠሩና ያስተዳድሩ',
  umColName: 'ስም',
  umColRole: 'ኃላፊነት',
  umColActive: 'ንቁ',
  umFullNameEnRequired: 'ሙሉ ስም (እንግሊዝኛ) *',
  umProfilePictureOptional: 'የመገለጫ ፎቶ (አማራጭ)',
  umPreview: 'ቅድመ ዕይታ',
  dioceseExample: 'የምሥራቅ ሸዋ ሀገረ ስብከት',
  addressExampleShort: 'አዲስ አበባ፣ ቦሌ',
  usernameExampleShort: 'john.doe',
  professionPlaceholder: 'አስተማሪ፣ መሐንዲስ...',
  interestsPlaceholder: 'ሙዚቃ፣ አይቲ፣ ሥዕል...',
  woredaExample: 'ቦሌ',
  subCityExample: 'ቦሌ ክፍለ ከተማ',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const peopleOm: Partial<Record<keyof typeof peopleEn, string>> = {};
export const peopleTi: Partial<Record<keyof typeof peopleEn, string>> = {};
