import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Language } from '@/i18n/translations';

/**
 * The long-form "ስለ እኛ" page: the church's history, its account of orthodoxy,
 * and its institutional structure.
 *
 * Separate from `landingContent` because it is a different kind of thing. The
 * homepage carries what a visitor scanning the page needs — vision, mission,
 * beliefs, values — while this is roughly 1,800 words that somebody has chosen
 * to sit down and read. Putting it on the homepage would push the vision and
 * the mission below the fold, where nobody would reach them.
 *
 * Stored per language in `siteConfig/aboutPage`, editable in Landing Editor,
 * with the bundled text below as the default.
 */

export interface AboutSubsection {
  /** Anchor id, so the page can link straight to a subsection. */
  id: string;
  heading: string;
  /** One string per paragraph. */
  paragraphs: string[];
  /** Optional bullet list rendered after the paragraphs. */
  bullets?: Array<{ title?: string; text: string }>;
}

export interface AboutSection {
  id: string;
  /** Number shown in the section rail, e.g. "1". */
  ordinal: string;
  title: string;
  intro?: string;
  subsections: AboutSubsection[];
}

export interface AboutStructureLevel {
  name: string;
  description: string;
}

export interface AboutContent {
  badge: string;
  title: string;
  subtitle: string;
  sections: AboutSection[];
  structure: {
    id: string;
    ordinal: string;
    title: string;
    intro: string;
    levels: AboutStructureLevel[];
    /**
     * Shown under the level list. The church's own bylaws include a Woreda
     * office that the application's role registry does not yet model, so the
     * page states the structure as the bylaws do and does not pretend the
     * software mirrors it.
     */
    note?: string;
  };
}

const AM: AboutContent = {
  badge: 'ስለ እኛ',
  title: 'አኀው ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን',
  subtitle: 'የተሐድሶ እርምጃዎቻችን፣ የታሪክ መነሻችን እና ኦርቶዶክሳዊነታችን።',
  sections: [
    {
      id: 'history',
      ordinal: '1',
      title: 'የተሐድሶ እርምጃዎቻችን እና የታሪክ መነሻ',
      intro:
        'ጌታችንና መድኃኒታችን ኢየሱስ ክርስቶስ ከትንሣኤው በኋላ በሰጠው ታላቅ ተልዕኮ መሠረት፣ ወንጌል ከኢየሩሳሌም ተነሥቶ በመላው ዓለም ተሰራጭቷል። ወንጌል በቅድሚያ ከደረሳቸው አገሮች መካከልም ኢትዮጵያ ከቀዳሚዎቹ አንዷ ናት።',
      subsections: [
        {
          id: 'gospel-in-ethiopia',
          heading: 'ወንጌል በኢትዮጵያ',
          paragraphs: [
            'በሐዋርያት ሥራ ምዕራፍ 8 እንደተዘገበው፣ ኢትዮጵያዊው ጃንደረባ ወደ ኢየሩሳሌም ሄዶ ከተሳለመ በኋላ ሲመለስ፣ ወንጌላዊው ፊልጶስ በመንፈስ ቅዱስ መሪነት ወንጌልን ሰብኮለት አጥምቆታል። በዚህም መሠረት በአዲስ ኪዳን መጽሐፍ ምስክርነት፣ ወንጌል በመጀመሪያው መቶ ክፍለ ዘመን ወደ ኢትዮጵያ እንደደረሰ እንረዳለን።',
            'በሌሎች የቤተ ክርስቲያን የታሪክ መጻሕፍት እንደተጻፈው፣ ከሐዋርያት መካከልም አንዳንዶቹ ወደዚህ ምድር መጥተው እንደነበር ይነገራል። ክርስትና በኢትዮጵያ ምድር እየተስፋፋ ሄዶ በአራተኛው መቶ ክፍለ ዘመን ብሔራዊ ሃይማኖት እንደሆነ የታሪክ ድርሳናት ያስረዳሉ። ከዚያ ጊዜ ጀምሮ ኦርቶዶክሳዊ ክርስትና በኢትዮጵያ ተስፋፍቶ፣ ጠንካራ ተቋም በመገንባት፣ የምድሪቱን ባህልና እሴት ወርሶ የአገሪቱ መገለጫ እስከመሆን ደርሷል።',
            'የኢትዮጵያ ክርስትና ረጅም ታሪክ ያለው ቢሆንም፣ በየዘመናቱ በርካታ ፈተናዎችን አሳልፏል። ሆኖም በመለኮታዊ ኃይልና በመንፈስ ቅዱስ መሪነት የችግሩን ገጽታ የተረዱ ቀደምት አባቶች በየጊዜው እየተነሡ የተሐድሶ ሥራዎችን ለማከናወን የተቻላቸውን ሁሉ ጥረት አድርገዋል። ተቋሙ ተሐድሶን የመቀበል አወንታዊ ፍላጎት ባያሳይም፣ በ20ኛው መቶ ክፍለ ዘመን የተለያዩ ማኅበራት ለወንጌል አገልግሎት ተመስርተው የተሐድሶን ጥሪና የወንጌልን ሥራ ሲያደራጁ ቆይተዋል። ከእነዚህም መካከል ማኅበረ አኀው አንዱ ነው።',
          ],
        },
        {
          id: 'from-association-to-church',
          heading: 'ከማኅበርነት ወደ ቤተ ክርስቲያንነት የተደረገ ጉዞ',
          paragraphs: [
            'የማኅበሩ አመሠራረት መነሻ በ1980ዎቹ ይንቀሳቀሱ ከነበሩ የትውልድና የጸሎት ማኅበራት እንቅስቃሴዎች ጋር የተያያዘ ነው። በኋላም እነዚህ አነስተኛ ቁጥር ያላቸው የጸሎትና የጽዋ ማኅበራት በ1990ዎቹ አብረው ሲንቀሳቀሱ ቆይተው፣ በ1998 ዓ.ም በአንድነት በመዋሐድ ማኅበረ አኀውን መሥርተዋል።',
            'ማኅበሩ ከተመሠረተበት ጊዜ ጀምሮ እስከ 2011 ዓ.ም ድረስ አገልጋዮች ምንም ዓይነት ደሞዝ ሳይከፈላቸው በትምህርት፣ በሥልጠና፣ በትዳር እና በተለያዩ መንፈሳዊ አገልግሎቶች ሰዎችን ሲያነፁና ሲያገለግሉ ቆይተዋል። በኋላም በሂደት ሙሉ ጊዜ አገልግሎት ለመስጠትና ሰፊውን የወንጌል ተልዕኮ ለመወጣት በቤተ ክርስቲያን ደረጃ ተቋቁሟል።',
          ],
        },
        {
          id: 'exile',
          heading: 'የስደት ምክንያት እና ሕጋዊ ውሳኔዎች',
          paragraphs: [
            'እኛ የአኀው ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን አባላት፣ ቀደም ሲል አባል የነበርንባት የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ወንጌልን ተቀብላ የተመሠረተች ብትሆንም፣ በሂደት ግን የተለያዩ ትምህርቶች እየተቀላቀሉባት መጥተዋል። የወንጌሉን ትምህርት ከመሠረቱ ባታስወግደውም እንኳ፣ እውነቱ ደብዝዞባት ወንጌልን በግልጽ ከመስበክ፣ ከማስተማርና ከማስፋፋት ወጥታ መንፈሳዊ እርጅና የተጫጫናት ሆናለች።',
            'ቤተ ክርስቲያኒቱ ትምህርቷን፣ እምነቷን፣ ሕይወቷን፣ ተልእኮዋን፣ አገልጋዮቿን፣ ተከታዮቿንና አጠቃላይ ሁለንተናዋን በእግዚአብሔር ቃል በመመርመር፣ እንደ ቃሉ ለመገኘትና ለመታረም በሯን መክፈት፣ ጊዜ መስጠትና መታደስ ያስፈልጋታል። ለዚህም ዋና ዋና ምክንያቶች፦',
          ],
          bullets: [
            { title: 'የምንጭና ሚዛን መዛባት', text: 'የትምህርቷ ምንጭና ሚዛን መጽሐፍ ቅዱስ ብቻ መሆን ሲገባው፣ ከመጽሐፍ ቅዱስ ጋር የሚቃረኑ ትምህርቶችን መቀበሏና ማስፋፋቷ፤' },
            { title: 'ከመሠረተ ትምህርት መራቅ', text: 'የተከታዮቿ እምነት ከክርስትና መሠረታዊ ትምህርት ያፈነገጠና የራቀ መሆኑ፤' },
            { title: 'የተሐድሶ ፍላጎትና አቅም ማጣት', text: 'መጻሕፍቶቿ እንዲታረሙ፣ ትምህርቶቿ እንዲስተካከሉ፣ የአገልጋዮቿ የሕይወት ብልሽትና የተቋሙ አሠራር እንዲታደስ በተለያዩ አጋጣሚዎች ጥሪ ቢደረግም፣ ከጊዜያዊ ጥገና ባለፈ ከምንጩ ለማረምና ተሐድሶን በውስጧ ለማምጣት ፍላጎቱም አቅሙም የላትም።' },
            { title: 'ወንጌልን የሚቀበሉትን ማሳደድ', text: 'ወንጌል የልጆቿን ሕይወት ሲለውጥ የመንፈስ ቅዱስን የማዳንና የመለወጥ ኃይል ከመገንዘብ ይልቅ፣ ልጆቿን እንደ ጠላት ቆጥራ ታባርራለች። ሥር ነቀል ተሐድሶ ለማድረግና ወደ እግዚአብሔር ቃል ለመመለስ ፍላጎት አታሳይም። በተጨማሪም ተከታዮቿ ሲጋጩ ሚዛናዊ ፍትሕ ከመስጠት ይልቅ ወንጌልን ለሚቃወሙት አድልታ ትታያለች።' },
          ],
        },
        {
          id: 'legal-steps',
          heading: 'ከስደት በኋላ የተወሰደ ሕጋዊና መንፈሳዊ እርምጃ',
          paragraphs: [
            'ሆኖም ቤተ ክርስቲያኒቱ ከአገልጋይነታቸውና ከአባልነታቸው እስክትለያቸው ድረስ፣ ስለ ተሐድሶዋ በውስጧ ሆነው የሚተጉና የሚጋደሉ ልጆቿ እስከ አሁንም አልጠፉም። ጌታ የራሱ የሆኑትን እያተጋ በእነርሱ ይሠራል፤ ቤቱ የእግዚአብሔር ነውና የተሐድሶንም ዕድል የሰጠው እርሱ ነው።',
            'ቤተ ክርስቲያኒቱ ተሐድሶን በመቃወም ከሳና አውግዛ የለየቻቸው አገልጋዮቿና ልጆቿ ከቤተ ክርስቲያኒቱ ውጪ ሆነው ስለ ተሐድሶዋ የሚሠሩት ሥራ አስቸጋሪ ሆኗል። ምክንያቱም ከቤተ ክርስቲያኒቱ ከተለዩ በኋላ እምነታቸውን ለማስፋፋት በሀገሪቱ ሕግ መሠረት መመዝገብ ነበረባቸው። እንደ አንድ የእምነት ተቋም ከተመዘገቡ በኋላ ደግሞ በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ውስጥ የተሐድሶ ሥራ መሥራትን የሀገሪቱ ሕግ ስለሚከለክል፣ ስለ መታደሷ ያላቸው ሸክም ባይለወጥም የሀገሪቱን ሕግ አክብረው የመንቀሳቀስ ግዴታ አለባቸው። በሕግ፣ በምሥጢራትና በተቋማዊ አደረጃጀት ከተለያዩ በኋላ "እናድሳታለን" ብሎ ማሰብ ትክክለኛ የሕግ አካሄድ አይሆንም።',
            'በመሆኑም በሕጉ መሠረት የራሳቸውን እምነት ለማስፋፋት የሀገሪቱን ሕግ ጠብቀው እንዲንቀሳቀሱ ተገደዋል። ሆኖም ወደ እነዚህ አገልጋዮችና አገልግሎቶች የቤተ ክርስቲያኒቱ አገልጋዮችና ምእመናን ያለ ማቋረጥ ስለሚመጡ፣ እንዲሁም በተሐድሶ አገልጋዮች የሚዘጋጁ መጻሕፍትና ትምህርቶችን ስለሚከታተሉ፣ በተሰደዱትና ባልተሰደዱት ኦርቶዶክሳውያን መካከል ያለው ግንኙነት ቀጥሏል።',
            'በተጨማሪም ቤተ ክርስቲያኒቱ በውስጧ ያሉትን ዘርፈ-ብዙ ችግሮች ከማረም ይልቅ በመድረኮቿ የምታቀርበው ተቃውሞና ጥላቻ፣ ሕዝቡ ስለ ተሐድሶ እንዲያመዛዝንና እውነቱን ከተከሰሱት ሰዎች አንደበት ለመስማት እንዲጓጉ በማድረጉ ተሐድሶው እንዲስፋፋ ትልቅ ማስታወቂያ ሆኗል። በተለይም በማኅበር የተደራጀው የወንጌል ተቃዋሚ አካል የሚያዘጋጃቸው ዶክመንተሪዎች፣ መጻሕፍትና ፀረ-ተሐድሶ ንቅናቄዎች እውነቱን አበላሽተውና አጠልሽተው የሚያቀርቡ በመሆናቸው፣ ሕዝቡ እውነተኛውን ተሐድሶ ከራሳቸው ከተሐድሶ አገልጋዮች ለመስማት እንዲፈልግ አነሣሥቶታል።',
          ],
        },
        {
          id: 'founding-decision',
          heading: 'የስብሰባ ውሳኔ እና የተቋሙ ምስረታ',
          paragraphs: [
            'ከላይ በተጠቀሱት ምክንያቶች፣ እኛ ኦርቶዶክሳውያን የተሐድሶ ራእይ ደጋፊዎችና የወንጌል አገልጋዮች፣ ራሳችንን በመጽሐፍ ቅዱሳዊ እውነት ላይ መሥርተን፣ የእግዚአብሔርን ቃል እስካልተቃረነ ድረስ ኦርቶዶክሳዊ ትውፊትን ተቀብለን በአንዲት ቤተ ክርስቲያን (ኅብረት) ለመደራጀት ወስነናል። ይህንንም ውሳኔ ከጥር 2–4 ቀን 2010 ዓ.ም. በተደረገ አጠቃላይ ስብሰባ አጽድቀናል።',
            'ይህች ቤተ ክርስቲያን ለመመሠረቷ አሳማኝ ምክንያቶች አሏት፦',
          ],
          bullets: [
            { title: 'መጽሐፍ ቅዱሳዊ አቋም', text: 'በክርስቶስ አምነው በመንፈስ ቅዱስ ዳግም የተወለዱ የእግዚአብሔር ልጆች ኅብረት ሁለንተናዊ አገልግሎት ለመስጠት በቤተ ክርስቲያን ደረጃ መደራጀት አስፈላጊ መሆኑን በመጽሐፍ ቅዱስ መርምረን አምነናል።' },
            { title: 'የተጠራንበት ጥሪ', text: 'በክርስቶስ ኢየሱስ በማመን የሚገኘውን ጽድቅና የመንፈስ ቅዱስን የቅድስና ኑሮ ተካፋይ እንድንሆን ተጠርተናል። ወንጌልን ለወገኖቻችን ለመግለጥ፣ ያመኑትን ደቀ መዛሙርት ለማድረግና አምላክን በእውነትና በመንፈስ የሚያመልክ ትውልድ ለማፍራት ወስነናል።' },
            { title: 'ያልተገባ ስደትና የመደራጀት አስፈላጊነት', text: 'በኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን ውስጥ ሆነን መጽሐፍ ቅዱሳዊውን እውነት ስንከተልና ስንመሰክር፣ "ተሐድሶ" የሚል ስም እየተሰጠብን ያለ አግባብ ከቤተ ክርስቲያን እንድንፈናቀል ተደርገናል። ይህም መንፈሳዊና ማኅበራዊ አገልግሎት እንዳናገኝ ስላደረገን በሕግ መደራጀታችን አስፈላጊ ሆኗል።' },
          ],
        },
        {
          id: 'naming',
          heading: 'የስም አሰያየም ሂደት',
          paragraphs: [
            'በስደት ወቅት አሳዳጆቻችን ያወጡልንን ስም መቀበል አያሳፍረንም በሚልና ቤተ ክርስቲያኒቱ ወደ እግዚአብሔር ቃል መመለስ አለባት ብለን ስለምናምን፣ እኛም የእግዚአብሔር የተሐድሶ ፍሬዎች በመሆናችን “የኢትዮጵያ ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን” በሚል ስም እንድትመዘገብ በሙሉ ድምፅ ተስማምተናል።',
            'ይህ ውሳኔ በወቅቱ በመንግሥት አካላት በኩል በሂደት ላይ ስለነበር፣ ቤተ ክርስቲያኒቱ ወደ ቤተ ክርስቲያንነት ከመሸጋገሯ በፊት ለ12 ዓመታት ስታገለግልበት በነበረው “ማኅበረ አኀው መንፈሳዊ” ከሚለው ስም በመነሣት “ማኅበረ አኀው የክርስቶስ ቤተ ክርስቲያን” ተብላ ስትጠራ ቆይታለች። በቅርቡ ደግሞ ሲኖዶስ ዘአኀው በወሰነው ውሳኔ መሠረት “አኀው ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን” የሚለውን ስም ለመንግሥት በድጋሚ አቅርባ ሂደቱን ቀጥላለች።',
            'ከቤተ ክርስቲያኒቱ የተሰደዱ በክርስቶስ ያመኑ ኦርቶዶክሳውያንን ሁሉ በሰፊ ልብ በመቀበል፣ ወንጌልን ለሰዎች በማድረስ፣ ያመኑትን በማስተማርና ለተልእኮ በመላክ ለኦርቶዶክሳዊ ተሐድሶ ራእይ ማሳያ የሆነች ቤተ ክርስቲያን በመሆን በማገልገል ላይ እንገኛለን።',
          ],
        },
      ],
    },
    {
      id: 'orthodoxy',
      ordinal: '2',
      title: 'ኦርቶዶክሳዊነታችን እና ኦርቶዶክሳዊ ተሐድሶ',
      intro:
        'የአኀው ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን መሥራች አባላት ስደት የገጠማቸው ኦርቶዶክሳውያን የክርስቶስ አገልጋዮችና ምእመናን ናቸው። በመሆኑም ኦርቶዶክሳዊነትን የምንረዳው በሁለት መልኩ ነው፦',
      subsections: [
        {
          id: 'historical-orthodoxy',
          heading: 'ሀ. ታሪካዊ ኦርቶዶክሳዊነት',
          paragraphs: [
            'በክርስትና እምነት ታሪክ ውስጥ መሠረታዊ እውነቶች የተላለፉበት መስመር "ታሪካዊ ኦርቶዶክሳዊነት" ይባላል። ይህ መስመር ከነቢያት፣ ከክርስቶስ፣ ከሐዋርያትና ከእውነተኛ የቤተ ክርስቲያን አባቶች የተቀበልነው ትክክለኛ (ኦርቶዶክሳዊ) የትምህርት መስመር ነው።',
            'ይህ ትምህርት በኦርቶዶክስ ብቻ ሳይሆን በካቶሊክና በወንጌላውያን አብያተ ክርስቲያናትም ዘንድ የታመነና የተቀበሉት የጋራ እውነት ነው። ይህን ትምህርት የመውረስ፣ የማስተማርና የመጠበቅ ኃላፊነት የሁሉም ክርስቲያኖች ነው።',
          ],
        },
        {
          id: 'institutional-orthodoxy',
          heading: 'ለ. ተቋማዊ ኦርቶዶክሳዊነት',
          paragraphs: [
            'ምሥራቃውያኑ ለመሠረቷቸው አብያተ ክርስቲያናት መጠሪያ አድርገው የተጠቀሙበት ስም ሲሆን፣ ይህም የምሥራቅ ኦርቶዶክስ እና የኦሬንታል አኃት ኦርቶዶክስ አብያተ ክርስቲያናትን ያመለክታል።',
            'እኛ ከኦሬንታል ኦርቶዶክስ አብያተ ክርስቲያናት አንዷ ከሆነችው ከኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን የተገኘን በመሆናችን፣ ለተሐድሶው ታሪካዊ መነሻችን አባ እስጢፋኖስና ተከታዮቹ በመሆናቸው፣ ኦርቶዶክሳዊ ትውፊትንና ኢትዮጵያዊ ባህልን ስለምንከተል፣ እንዲሁም የምሥራቃውያኑን የትምህርት ባህል ስለምንከተል — ኢየሱስ አድኖናል ብለን በመመስከራችን ከተሰደድንበት ጊዜ ጀምሮ መንፈሳዊ እንቅስቃሴያችን ወደ ተቋማዊ አገልግሎት መሸጋገር ስላለበት “አኀው ኦርቶዶክሳዊት ተሐድሶ ቤተ ክርስቲያን” ተብለን እንድንጠራ ተስማምተናል።',
          ],
        },
      ],
    },
  ],
  structure: {
    id: 'structure',
    ordinal: '3',
    title: 'ተቋማዊ መዋቅር',
    intro: 'የቤተ ክርስቲያኒቱ አገልግሎት በሰባት እርከኖች የተደራጀ ነው።',
    levels: [
      { name: 'ሲኖዶስ', description: 'የቀሳውስት ጉባኤ ሆኖ በዓመት ሁለት ጊዜ የሚሰበሰብና የቤተ ክርስቲያኒቱን ሁለንተናዊ እንቅስቃሴ የሚገመግም የመጨረሻው ውሳኔ ሰጪ አካል ነው።' },
      { name: 'ቋሚ ሲኖዶስ', description: 'በሲኖዶስ ከአባላት መካከል የሚመረጡ 9 አባላት ያሉትና የዕለት ተዕለት ሥራዎችን የሚከታተል አካል ነው።' },
      { name: 'ጠቅላይ ጽሕፈት ቤት', description: 'በጠቅላይ ሥራ አስኪያጅ የሚመራና አጠቃላይ ሥራዎችን የሚያንቀሳቅስ ጽሕፈት ቤት ነው።' },
      { name: 'የዞን ሀገረ ስብከት ጽሕፈት ቤት', description: 'በዞን ደረጃ ሥራዎችን የሚያደራጅና የሚመራ ነው።' },
      { name: 'የወረዳ ሰበካ ጉባኤ ጽሕፈት ቤት', description: 'በወረዳ ደረጃ ሥራዎችን የሚያደራጅና የሚያስተባብር ነው።' },
      { name: 'አጥቢያ ሰበካ ጉባኤ ጽሕፈት ቤት', description: 'በአጥቢያ ደረጃ አገልግሎቶችን የሚያደራጅና የሚመራ ነው።' },
      { name: 'ሕያዋን ማኅደራት', description: 'ከአጥቢያ በታች ምእመናን ተደራጅተው መጽሐፍ ቅዱስ የሚያጠናው፣ የሚጸልዩበትና ወንጌል የሚያሰራጩበት የኅብረት እርከን ነው።' },
    ],
  },
};

/**
 * The other three languages fall back to Amharic rather than to invented
 * translations. This is the church's own account of itself, and putting
 * unreviewed words in its mouth would be worse than showing the original —
 * the same reasoning `featuresContent.ts` gives for its English fallback.
 * An administrator can translate it in the Landing Editor.
 */
export const DEFAULT_ABOUT_CONTENT: Record<Language, AboutContent> = {
  am: AM,
  en: AM,
  om: AM,
  ti: AM,
};

const ref = doc(db, 'siteConfig', 'aboutPage');

export type MultiLangAboutContent = Partial<Record<Language, AboutContent>> & {
  meta?: { updatedAt?: string; updatedBy?: string };
};

export const aboutContentService = {
  /** Never writes — the page is public and a visitor cannot create siteConfig. */
  async get(): Promise<MultiLangAboutContent> {
    try {
      const snap = await getDoc(ref);
      return snap.exists() ? (snap.data() as MultiLangAboutContent) : {};
    } catch {
      return {};
    }
  },

  async save(content: MultiLangAboutContent, updatedBy: string): Promise<void> {
    await setDoc(ref, {
      ...content,
      meta: { updatedAt: new Date().toISOString(), updatedBy },
    });
  },
};
