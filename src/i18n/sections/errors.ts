/**
 * User-facing error text thrown by service modules.
 *
 * Services run outside React, so they cannot read the reader's language. They
 * throw `new AppError('errWrongPassword')` and the catch site resolves it with
 * `errorMessage(t, e)` — see src/lib/appError.ts. Before this, a failed sign-in
 * showed an English sentence to a reader who had chosen Amharic, and the text
 * was invisible to the admin translation editor.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const errorsEn = {
  /** Last resort when a thrown value carries nothing useful. */
  generic: 'Something went wrong. Please try again.',

  // ── Sign-in ───────────────────────────────────────────────────────────────
  wrongPassword: 'Incorrect password. Please try again.',
  noAccount: 'No account found with this username or email.',
  invalidIdentifier: 'The email or username format is invalid.',
  accountDisabled: 'This account has been disabled. Contact your administrator.',
  tooManyAttempts: 'Too many failed attempts. Please wait a few minutes and try again.',
  tooManyAttemptsShort: 'Too many attempts. Please wait a few minutes and try again.',
  notSignedIn: 'No user is currently signed in.',
  networkProblem: 'Network problem — check your connection and try again.',

  // ── Password ──────────────────────────────────────────────────────────────
  passwordTooShort: 'New password must be at least 6 characters long.',
  currentPasswordWrong: 'Current password is incorrect.',
  passwordTooWeak: 'That password is too weak. Choose something longer or less predictable.',
  reauthRequired: 'For security, please sign out and back in, then change your password.',
  passwordChangeFailed: 'Could not change the password. Please try again.',

  // ── Username ──────────────────────────────────────────────────────────────
  usernameInvalid:
    'A username needs at least 3 characters, and may use only letters, digits, dot, dash or underscore.',
  usernameTaken: 'That username is already taken. Choose another.',
  usernameSaveFailed: 'Could not save the new username. Please try again.',

  // ── Email ─────────────────────────────────────────────────────────────────
  enterIdentifierFirst: 'Enter your username or email address first.',
  emailInvalid: 'That email address is not valid.',
  resetEmailFailed: 'Could not send the reset email. Please try again.',
  emailTaken: 'Another account already uses that email address.',
  emailChangeFailed: 'Could not start the email change. Please try again.',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const errorsAm: Record<keyof typeof errorsEn, string> = {
  generic: 'የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።',

  wrongPassword: 'የይለፍ ቃሉ ትክክል አይደለም። እባክዎ እንደገና ይሞክሩ።',
  noAccount: 'በዚህ የተጠቃሚ ስም ወይም ኢሜይል የተመዘገበ መለያ የለም።',
  invalidIdentifier: 'የኢሜይሉ ወይም የተጠቃሚ ስሙ አጻጻፍ ትክክል አይደለም።',
  accountDisabled: 'ይህ መለያ ታግዷል። አስተዳዳሪዎን ያነጋግሩ።',
  tooManyAttempts: 'በተደጋጋሚ ስህተት ተሞክሯል። እባክዎ ጥቂት ደቂቃዎችን ጠብቀው እንደገና ይሞክሩ።',
  tooManyAttemptsShort: 'በተደጋጋሚ ተሞክሯል። እባክዎ ጥቂት ደቂቃዎችን ጠብቀው እንደገና ይሞክሩ።',
  notSignedIn: 'በአሁኑ ጊዜ የገባ ተጠቃሚ የለም።',
  networkProblem: 'የአውታረ መረብ ችግር — ግንኙነትዎን አረጋግጠው እንደገና ይሞክሩ።',

  passwordTooShort: 'አዲሱ የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት።',
  currentPasswordWrong: 'የአሁኑ የይለፍ ቃል ትክክል አይደለም።',
  passwordTooWeak: 'ይህ የይለፍ ቃል በጣም ደካማ ነው። ረዘም ያለ ወይም ለመገመት የሚያስቸግር ይምረጡ።',
  reauthRequired: 'ለደኅንነት ሲባል እባክዎ ወጥተው እንደገና ይግቡ፤ ከዚያም የይለፍ ቃልዎን ይቀይሩ።',
  passwordChangeFailed: 'የይለፍ ቃሉን መቀየር አልተቻለም። እባክዎ እንደገና ይሞክሩ።',

  usernameInvalid:
    'የተጠቃሚ ስም ቢያንስ 3 ፊደላት ሊኖሩት ይገባል፤ ፊደላትን፣ አኃዞችን፣ ነጥብ፣ ሰረዝ ወይም ከስር መስመር ብቻ መጠቀም ይቻላል።',
  usernameTaken: 'ይህ የተጠቃሚ ስም አስቀድሞ ተይዟል። ሌላ ይምረጡ።',
  usernameSaveFailed: 'አዲሱን የተጠቃሚ ስም ማስቀመጥ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',

  enterIdentifierFirst: 'መጀመሪያ የተጠቃሚ ስምዎን ወይም የኢሜይል አድራሻዎን ያስገቡ።',
  emailInvalid: 'ይህ የኢሜይል አድራሻ ትክክል አይደለም።',
  resetEmailFailed: 'የይለፍ ቃል ማደሻ ኢሜይል መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  emailTaken: 'ሌላ መለያ አስቀድሞ ይህንን የኢሜይል አድራሻ ይጠቀማል።',
  emailChangeFailed: 'የኢሜይል ለውጡን መጀመር አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const errorsOm: Partial<Record<keyof typeof errorsEn, string>> = {};
export const errorsTi: Partial<Record<keyof typeof errorsEn, string>> = {};
