/**
 * Asset register and inventory screens.
 *
 * Status, condition, type and acquisition values are NOT here — they are
 * persisted in Firestore, so their labels live in `status` and are resolved
 * through src/i18n/enums.ts. See that file for why.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */
export const inventoryEn = {
  title: 'Asset Management',
  subtitle: 'Track church assets, equipment, property, and valuations.',
  badge: 'Assets',

  // ── Summary cards ─────────────────────────────────────────────────────────
  totalAssets: 'Total assets',
  totalValue: 'Total value of assets (ETB)',
  totalDisposed: 'Total disposed',

  // ── Table ─────────────────────────────────────────────────────────────────
  colId: 'Asset ID',
  colName: 'Asset name',
  colType: 'Asset type',
  colQuantity: 'Quantity',
  colStatus: 'Status',
  colCondition: 'Condition',
  colActions: 'Operations',

  emptyTitle: 'No assets found',
  emptyHint: 'Register your first asset to get started.',

  // ── Row actions ───────────────────────────────────────────────────────────
  viewDetails: 'View details',
  editAsset: 'Edit asset',
  deleteAsset: 'Delete asset',
  registerAsset: 'Register asset',
  saveChanges: 'Save changes',

  // ── Form ──────────────────────────────────────────────────────────────────
  fieldIdCode: 'Asset ID code',
  fieldIdCodePlaceholder: 'e.g. MA-EQU-220',
  fieldName: 'Asset name',
  fieldNamePlaceholder: 'e.g. Computer',
  fieldType: 'Asset type',
  fieldQuantity: 'Quantity',
  fieldLocation: 'Location',
  fieldAssignedTo: 'Assigned to',
  fieldCondition: 'Condition',
  fieldStatus: 'Status',
  fieldAcquisition: 'Acquisition',
  fieldUnitValue: 'Unit value (ETB)',
  fieldNotes: 'Notes',

  // ── Toasts ────────────────────────────────────────────────────────────────
  saveFailed: 'Could not save the asset.',
  removed: 'Asset removed.',
  removeFailed: 'Could not remove the asset.',
  assetUpdated: 'Asset updated.',
  assetRegistered: 'Asset registered.',
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const inventoryAm: Record<keyof typeof inventoryEn, string> = {
  title: 'የንብረት አስተዳደር',
  subtitle: 'የቤተ ክርስቲያኒቱን ንብረት፣ መሣሪያ፣ ሕንፃና ግምት ይከታተሉ።',
  badge: 'ንብረት',

  totalAssets: 'ጠቅላላ ንብረት',
  totalValue: 'የንብረት ጠቅላላ ግምት (ብር)',
  totalDisposed: 'ጠቅላላ የተወገደ',

  colId: 'የንብረት መለያ',
  colName: 'የንብረት ስም',
  colType: 'የንብረት ዓይነት',
  colQuantity: 'ብዛት',
  colStatus: 'ሁኔታ',
  colCondition: 'ደረጃ',
  colActions: 'ተግባራት',

  emptyTitle: 'ምንም ንብረት አልተገኘም',
  emptyHint: 'ለመጀመር የመጀመሪያውን ንብረትዎን ይመዝግቡ።',

  viewDetails: 'ዝርዝር ይመልከቱ',
  editAsset: 'ንብረት አርትዕ',
  deleteAsset: 'ንብረት ሰርዝ',
  registerAsset: 'ንብረት መዝግብ',
  saveChanges: 'ለውጦችን አስቀምጥ',

  fieldIdCode: 'የንብረት መለያ ኮድ',
  fieldIdCodePlaceholder: 'ለምሳሌ MA-EQU-220',
  fieldName: 'የንብረት ስም',
  fieldNamePlaceholder: 'ለምሳሌ ኮምፒውተር',
  fieldType: 'የንብረት ዓይነት',
  fieldQuantity: 'ብዛት',
  fieldLocation: 'ቦታ',
  fieldAssignedTo: 'የተሰጠው ለ',
  fieldCondition: 'ደረጃ',
  fieldStatus: 'ሁኔታ',
  fieldAcquisition: 'የተገኘበት መንገድ',
  fieldUnitValue: 'የነጠላ ዋጋ (ብር)',
  fieldNotes: 'ማስታወሻ',

  saveFailed: 'ንብረቱን ማስቀመጥ አልተቻለም።',
  removed: 'ንብረቱ ተወግዷል።',
  removeFailed: 'ንብረቱን ማስወገድ አልተቻለም።',
  assetUpdated: 'ንብረቱ ተስተካክሏል።',
  assetRegistered: 'ንብረቱ ተመዝግቧል።',
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const inventoryOm: Partial<Record<keyof typeof inventoryEn, string>> = {};
export const inventoryTi: Partial<Record<keyof typeof inventoryEn, string>> = {};
