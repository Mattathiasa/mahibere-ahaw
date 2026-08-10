/**
 * The congregations recorded in the church's paper register,
 * "በማኅበረ አኀው የክርስቶስ ቤተክርስቲያን የአጥቢያዎች ዝርዝር".
 *
 * Transcribed from a photograph of that sheet, so it is offered for REVIEW in
 * the import dialog rather than written straight to Firestore — a
 * mis-transcribed name would be hard to spot once it is live, and congregations
 * are never deleted, only deactivated.
 *
 * Three things below come from the paper itself and are not transcription gaps:
 *   • rows 20, 23 and 26 have no founding date written against them;
 *   • row 9's printed year is overwritten, with "2009" added by hand — that is
 *     the value used here;
 *   • rows 9 and 14 carry the same leader phone number.
 *
 * `name` is the Latin reading and `nameAmharic` the register's own spelling.
 * Both are needed: `name` is required because `getAtbiyas` orders by it and
 * Firestore silently drops documents missing the ordered field.
 */

export interface AtbiyaRegisterRow {
  /** Row number on the register sheet, kept so a reviewer can check against it. */
  no: number;
  name: string;
  nameAmharic: string;
  /** Ethiopian-calendar date as written. Empty where the register leaves it blank. */
  foundedAt: string;
  leaderAm: string;
  phone: string;
}

export const ATBIYA_REGISTER: AtbiyaRegisterRow[] = [
  { no: 1,  name: 'Mizan Debre Medhanit',          nameAmharic: 'የሚዛን ደብረ መድኃኒት አጥቢያ',        foundedAt: 'ነሐሴ 25/2008 ዓ.ም.',    leaderAm: 'ማስረሻ ማሞ',            phone: '0931538890' },
  { no: 2,  name: 'Laha Debre Tehadiso',           nameAmharic: 'የላሃ ደብረ ተሐድሶ አጥቢያ',          foundedAt: 'ነሐሴ 24/2008 ዓ.ም.',    leaderAm: 'ታረቀኝ',              phone: '0915994834' },
  { no: 3,  name: 'Assosa Fnote Tsdk',             nameAmharic: 'አሶሳ ፍኖተ ጽድቅ አጥቢያ',           foundedAt: 'ታኅሣሥ 10/2009 ዓ.ም.',   leaderAm: 'ደሳለኝ ግዛቸው',          phone: '0917710424' },
  { no: 4,  name: 'Arba Minch Debre Mihret',       nameAmharic: 'የአርባምንጭ ደብረ ምሕረት አጥቢያ',      foundedAt: 'ሐምሌ 4/11/2009 ዓ.ም.',  leaderAm: 'እንዳሻው ለበኔ',          phone: '0925231236' },
  { no: 5,  name: 'Bonga Town',                    nameAmharic: 'የቦንጋ ከተማ አጥቢያ',              foundedAt: 'ሐምሌ 10/11/2009 ዓ.ም.', leaderAm: 'ፍጥረቱ አሸናፉ',          phone: '0910893427' },
  { no: 6,  name: 'Ameya',                         nameAmharic: 'የአመያ አጥቢያ',                   foundedAt: 'ኅዳር 3/2010 ዓ.ም.',      leaderAm: 'በላይ ከበደ',            phone: '0917111103' },
  { no: 7,  name: 'Harar Mekane Hitsanat',         nameAmharic: 'የሐረር መካነ ሕፃናት አጥቢያ',         foundedAt: 'ሰኔ 2/2010 ዓ.ም.',       leaderAm: 'ቄስ ዘሪሁን ጌትዬ',        phone: '0912953964' },
  { no: 8,  name: 'Negele Arsi',                   nameAmharic: 'ነገሌ አርሲ አጥቢያ',                foundedAt: 'መስከረም 27/2011 ዓ.ም.',  leaderAm: 'ቄስ ተዘራወርቅ ለማ',       phone: '0949016310' },
  { no: 9,  name: 'Bishoftu Town',                 nameAmharic: 'የቢሾፍቱ ከተማ አጥቢያ',             foundedAt: 'ሰኔ 27/2009 ዓ.ም.',      leaderAm: 'አዲስሕይወት ተሾመ',        phone: '0938714929' },
  { no: 10, name: 'Sheger Town Galan Guda Wacho',  nameAmharic: 'ሸገር ከተማ ጋላን ጉዳ ዋቾ አጥቢያ',     foundedAt: 'ጥቅምት 30/2011 ዓ.ም.',   leaderAm: 'ቄስ ደረጀ ገብርኤል',       phone: '0912963346' },
  { no: 11, name: 'Addis Ababa',                   nameAmharic: 'የአዲስ አበባ አጥቢያ',               foundedAt: 'የካቲት 25/2011 ዓ.ም.',   leaderAm: 'ቄስ አበበ አሸቱ',         phone: '0911454769' },
  { no: 12, name: 'Bambasi Fnote Selam',           nameAmharic: 'ባንባሲ ፍኖተ ሰላም አጥቢያ',          foundedAt: 'ግንቦት 8/2011 ዓ.ም.',    leaderAm: 'ቄስ ገ/ኪዳን ስጦዬ',       phone: '0917423316' },
  { no: 13, name: 'Shewa Robit',                   nameAmharic: 'ሸዋሮቢት አጥቢያ',                  foundedAt: 'ነሐሴ 3/2011 ዓ.ም.',      leaderAm: 'ቄስ ጎርፉ ሸዋሠማ ትርፌ',    phone: '0913496701' },
  { no: 14, name: 'Ziway (Batu)',                  nameAmharic: 'ዝዋይ /ባቱ/ አጥቢያ',               foundedAt: 'መስከረም 15/2012 ዓ.ም.',  leaderAm: 'ተሠራወርቅ ፈቃዱ',         phone: '0938714929' },
  { no: 15, name: 'Axum (Siguh)',                  nameAmharic: 'አክሱም (ስጉሕ) አጥቢያ',             foundedAt: 'መስከረም 20/2012 ዓ.ም.',  leaderAm: 'ቄስ ዳዊት ኃይላይ',        phone: '0927741181' },
  { no: 16, name: 'Biftu Mekane Hiwot',            nameAmharic: 'ቢፍቱ መካነ ሕይወት አጥቢያ',          foundedAt: 'መስከረም 8/2012 ዓ.ም.',   leaderAm: 'ቄስ ልሳነወርቅ ገረመው',     phone: '0917015351' },
  { no: 17, name: 'Tore',                          nameAmharic: 'ቶሬ አጥቢያ',                     foundedAt: 'ጥቅምት 27/2013 ዓ.ም.',   leaderAm: 'መከብብ ሸብሩ',           phone: '0912986174' },
  { no: 18, name: 'Chole',                         nameAmharic: 'ጮሌ አጥቢያ',                     foundedAt: 'ኅዳር 25/2013 ዓ.ም.',     leaderAm: 'ቄስ ዮናስ ታፈሰ',         phone: '0920404139' },
  { no: 19, name: 'Uki',                           nameAmharic: 'ኡኪ አጥቢያ',                     foundedAt: 'ጥር 01/5/2013 ዓ.ም.',    leaderAm: 'ቄስ መልካሙ ነጋሽ',        phone: '0969187687' },
  { no: 20, name: 'Mije',                          nameAmharic: 'ምጀ አጥቢያ',                     foundedAt: '',                      leaderAm: 'ምትኪ የሐንስ',           phone: '0963198667' },
  { no: 21, name: 'Lantu Debre Selam',             nameAmharic: 'ላንቱ ደብረ ሰላም አጥቢያ',           foundedAt: 'ግንቦት 6/2013 ዓ.ም.',    leaderAm: 'መንግስቱ መንዶ',          phone: '0926863710' },
  { no: 22, name: 'Nekemte',                       nameAmharic: 'ነቀምቴ አጥቢያ',                   foundedAt: 'ጥቅምት 22/2014 ዓ.ም.',   leaderAm: 'ስዩም ስንታየሁ',          phone: '0913725188' },
  { no: 23, name: 'Wolaita Sodo Debre Bisrat',     nameAmharic: 'ወላይታ ሶዶ ከተማ ደብረ ብስራት አጥቢያ',  foundedAt: '',                      leaderAm: 'ማቲዎስ ወ/ማር',          phone: '0917759330' },
  { no: 24, name: 'Mekelle Tsirha Iyesus',         nameAmharic: 'መቐለ ጽርሐ ኢየሱስ አጥቢያ',          foundedAt: 'ሐምሌ 2015 ዓ.ም.',        leaderAm: 'ቄስ ልሳነወርቅ ገ/ኪዳን',    phone: '0934026240' },
  { no: 25, name: 'Dila Town',                     nameAmharic: 'ዲላ ከተማ አጥቢያ',                 foundedAt: 'ሐምሌ 25/2016 ዓ.ም.',    leaderAm: 'ማሙሽ ታመነ',            phone: '0926493959' },
  { no: 26, name: 'Welmeta',                       nameAmharic: 'ወልመጣ አጥቢያ',                   foundedAt: '',                      leaderAm: 'ለገሰ አርፈ',            phone: '0906363941' },
  { no: 27, name: 'Limu Genet',                    nameAmharic: 'ሊሙ ገነት አጥቢያ',                 foundedAt: 'መስከረም 15/2017 ዓ.ም.',  leaderAm: 'ተመስገን ቸቸ',           phone: '0983576479' },
  { no: 28, name: 'Jimma',                         nameAmharic: 'ጅማ አጥቢያ',                     foundedAt: 'ጥር 19/2017 ዓ.ም.',      leaderAm: 'አክሊሉ',               phone: '0911813969' },
  { no: 29, name: 'Koye Feche',                    nameAmharic: 'ኮዬ ፈጨጭ አጥቢያ',                 foundedAt: 'መጋቢት 22/2017 ዓ.ም.',   leaderAm: 'ቄስ ሙሉአለም ተስፋይ',      phone: '0932052951' },
  { no: 30, name: 'Kombolcha',                     nameAmharic: 'ኮምቦልቻ አጥቢያ',                  foundedAt: 'ሚያዝያ 03/2017 ዓ.ም.',   leaderAm: 'ዳዊት ለገሰ',            phone: '0983185830' },
];
