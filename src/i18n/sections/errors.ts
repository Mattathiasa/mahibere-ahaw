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
  /**
   * Shown instead of `wrongPassword` when a USERNAME was typed. An account that
   * has attached a recovery email signs in with that email, not its username, and
   * "incorrect password" sent those people round in circles retrying a password
   * that was in fact correct.
   */
  wrongPasswordTryEmail:
    'Incorrect password. If you registered with an email address, sign in with that address instead of your username.',
  noAccount: 'No account found with this username or email.',
  invalidIdentifier: 'The email or username format is invalid.',
  accountDisabled: 'This account has been disabled. Contact your administrator.',
  tooManyAttempts: 'Too many failed attempts. Please wait a few minutes and try again.',
  tooManyAttemptsShort: 'Too many attempts. Please wait a few minutes and try again.',
  notSignedIn: 'No user is currently signed in.',
  cannotDeleteSelf: 'You cannot delete the account you are signed in with.',
  cannotDeleteLastAdmin: 'This is the only account left with administrator access. Give someone else admin first, or the organisation would be locked out of its own settings.',
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
  /** `{detail}` carries the Firebase message for an error we have no wording for. */
  loginFailedDetail: 'Sign-in failed: {detail}',
  /**
   * Shown when a USERNAME was typed. `usernames/{name}` may only carry `uid`,
   * so a name can no longer be resolved to a real inbox — an account created
   * with an email is perfectly recoverable, we simply cannot tell from the name
   * alone. Saying "this account has no email address" was therefore wrong for
   * exactly the parish administrators being onboarded, and sent them to ask for
   * a new password when their own inbox would have worked. Same ambiguity, and
   * the same remedy, as `wrongPasswordTryEmail`.
   */
  noEmailOnAccount:
    'A reset link cannot be sent to a username. If your account has an email address, type that address here instead. If it signs in by username only, ask your parish administrator to issue you a new password.',
  emailTaken: 'Another account already uses that email address.',
  emailChangeFailed: 'Could not start the email change. Please try again.',

  // ── Parish administration ─────────────────────────────────────────────────
  adminNoEmailOnAccount:
    'This account signs in with a username, not a real email address, so no reset link can be sent. Create a replacement administrator account instead.',
  rolesChangedElsewhere:
    'These roles were changed in another tab or by another admin. Reload before saving so you do not overwrite their edits.',
  passwordRequired: 'A password is required.',

  // ── Membership requests ───────────────────────────────────────────────────
  requestGone: 'This request no longer exists.',
  requestAlreadyDecided: 'This request was already decided by someone else.',
  transactionNotFound: 'That transaction no longer exists.',
  budgetNotFound: 'That budget no longer exists.',
  announcementNotFound: 'That announcement no longer exists.',
  meetingNotFound: 'That meeting no longer exists.',
  planNotFound: 'That plan no longer exists.',
  reportNotFound: 'That report no longer exists.',
  reportBackNotFound: 'That feedback no longer exists.',
  teachingNotFound: 'That teaching no longer exists.',
  cloudinaryNotConfigured: 'Image uploads are not set up yet. An administrator needs to add the Cloudinary cloud name and upload preset first.',

  // ── Homepage suggestion box ───────────────────────────────────────────────
  suggestionFailed: 'Your suggestion could not be sent. Please try again.',
  /**
   * Anonymous sign-in is a per-project console setting, and the suggestion box
   * cannot write without it. Named separately from `suggestionFailed` because
   * this one is a configuration fault, not a transient one — every submission
   * fails this way until someone enables it, and "please try again" would send
   * visitors round in circles.
   */
  suggestionAnonDisabled:
    'The suggestion box is not accepting messages yet. Please tell an administrator, or use the contact details above.',
  suggestionTooShort: 'Please write a little more so we can understand your suggestion.',
  suggestionTooLong: 'That message is too long. Please shorten it and try again.',
  suggestionCooldown: 'You have just sent a suggestion. Please wait a moment before sending another.',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const errorsAm: Record<keyof typeof errorsEn, string> = {
  generic: 'የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።',

  wrongPassword: 'የይለፍ ቃሉ ትክክል አይደለም። እባክዎ እንደገና ይሞክሩ።',
  wrongPasswordTryEmail:
    'የይለፍ ቃሉ ትክክል አይደለም። በኢሜይል አድራሻ ተመዝግበው ከሆነ በተጠቃሚ ስምዎ ፋንታ በዚያ ኢሜይል ይግቡ።',
  noAccount: 'በዚህ የተጠቃሚ ስም ወይም ኢሜይል የተመዘገበ መለያ የለም።',
  invalidIdentifier: 'የኢሜይሉ ወይም የተጠቃሚ ስሙ አጻጻፍ ትክክል አይደለም።',
  accountDisabled: 'ይህ መለያ ታግዷል። አስተዳዳሪዎን ያነጋግሩ።',
  tooManyAttempts: 'በተደጋጋሚ ስህተት ተሞክሯል። እባክዎ ጥቂት ደቂቃዎችን ጠብቀው እንደገና ይሞክሩ።',
  tooManyAttemptsShort: 'በተደጋጋሚ ተሞክሯል። እባክዎ ጥቂት ደቂቃዎችን ጠብቀው እንደገና ይሞክሩ።',
  notSignedIn: 'በአሁኑ ጊዜ የገባ ተጠቃሚ የለም።',
  cannotDeleteSelf: 'እርስዎ የገቡበትን መለያ መሰረዝ አይችሉም።',
  cannotDeleteLastAdmin: 'የአስተዳዳሪ ፈቃድ ያለው የቀረ ብቸኛ መለያ ይህ ነው። መጀመሪያ ለሌላ ሰው የአስተዳዳሪ ፈቃድ ይስጡ፤ አለበለዚያ ድርጅቱ ከራሱ ቅንብሮች ውጭ ይሆናል።',
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
  loginFailedDetail: 'መግባት አልተሳካም፦ {detail}',
  noEmailOnAccount:
    'በተጠቃሚ ስም የማደሻ አገናኝ መላክ አይቻልም። መለያዎ የኢሜይል አድራሻ ካለው በዚህ ቦታ ስምዎን ሳይሆን ኢሜይልዎን ያስገቡ። መለያዎ የሚገባው በተጠቃሚ ስም ብቻ ከሆነ አዲስ የይለፍ ቃል እንዲሰጥዎ የአጥቢያዎን አስተዳዳሪ ይጠይቁ።',
  emailTaken: 'ሌላ መለያ አስቀድሞ ይህንን የኢሜይል አድራሻ ይጠቀማል።',
  emailChangeFailed: 'የኢሜይል ለውጡን መጀመር አልተቻለም። እባክዎ እንደገና ይሞክሩ።',

  adminNoEmailOnAccount:
    'ይህ መለያ የሚገባው በተጠቃሚ ስም እንጂ በእውነተኛ የኢሜይል አድራሻ ስላልሆነ የማደሻ አገናኝ መላክ አይቻልም። በምትኩ ሌላ የአስተዳዳሪ መለያ ይፍጠሩ።',
  rolesChangedElsewhere:
    'እነዚህ ኃላፊነቶች በሌላ ትር ወይም በሌላ አስተዳዳሪ ተለውጠዋል። የእነሱን ለውጥ እንዳይሽሩ ከማስቀመጥዎ በፊት ገጹን እንደገና ይጫኑ።',
  passwordRequired: 'የይለፍ ቃል ያስፈልጋል።',

  requestGone: 'ይህ ጥያቄ ከእንግዲህ የለም።',
  requestAlreadyDecided: 'በዚህ ጥያቄ ላይ ሌላ ሰው አስቀድሞ ወስኗል።',
  transactionNotFound: 'ያ ግብይት ከእንግዲህ የለም።',
  budgetNotFound: 'ያ በጀት ከእንግዲህ የለም።',
  announcementNotFound: 'ያ ማስታወቂያ ከእንግዲህ የለም።',
  meetingNotFound: 'ያ ስብሰባ ከእንግዲህ የለም።',
  planNotFound: 'ያ ዕቅድ ከእንግዲህ የለም።',
  reportNotFound: 'ያ ሪፖርት ከእንግዲህ የለም።',
  reportBackNotFound: 'ያ አስተያየት ከእንግዲህ የለም።',
  teachingNotFound: 'ያ ትምህርት ከእንግዲህ የለም።',
  cloudinaryNotConfigured: 'የምስል መጫኛ ገና አልተዘጋጀም። አስተዳዳሪ መጀመሪያ የCloudinary የክላውድ ስምና የመጫኛ ቅድመ ቅንብር መጨመር አለበት።',

  suggestionFailed: 'አስተያየትዎን መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
  suggestionAnonDisabled:
    'የአስተያየት ሳጥኑ ገና መልእክት አይቀበልም። እባክዎ ለአስተዳዳሪ ያሳውቁ፣ ወይም ከላይ ያለውን አድራሻ ይጠቀሙ።',
  suggestionTooShort: 'አስተያየትዎን እንድንረዳው እባክዎ ትንሽ ጨማሪ ይጻፉ።',
  suggestionTooLong: 'መልእክቱ በጣም ረጅም ነው። እባክዎ አሳጥረው እንደገና ይሞክሩ።',
  suggestionCooldown: 'አሁን አስተያየት ልከዋል። ሌላ ከመላክዎ በፊት እባክዎ ትንሽ ይጠብቁ።',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const errorsOm: Partial<Record<keyof typeof errorsEn, string>> = {};
export const errorsTi: Partial<Record<keyof typeof errorsEn, string>> = {};
