/**
 * The church organisational structure — body names and their duties (ሥልጣንና
 * ተግባር), transcribed from the bylaws ("መተዳደሪያ ደንብ" 5th revision, ቁ. 001/2018).
 *
 * Duties are flattened to indexed keys (`sinodosRole1`, `sinodosRole2`) rather
 * than kept as an array, because `applyStringOverrides` skips arrays — an array
 * here would render but be invisible to the admin translation editor.
 *
 * `<id>Name` holds the body's name in each language: the bylaw Amharic in
 * `structureAm`, the English rendering in `structureEn`. The Amharic spelling
 * also stays on the node itself in src/data/churchStructure.ts, so a reader in
 * any language can still see the name as the bylaws write it.
 *
 * REVIEW: these are the church's own governing documents in translation. The
 * duty text is a faithful rendering of the English summaries that were in the
 * source, not a fresh reading of the bylaws — worth checking against the
 * original ደንብ before it is treated as authoritative.
 *
 * Two levels only: this file supplies one flat `key -> string` object per
 * language. See src/i18n/translations.ts for why that shape is load-bearing.
 */

export const structureEn = {
  /** Prefix for a bylaw citation; the number itself stays on the node. */
  articlePrefix: "Article",
  /** Heading over a body's list of powers and duties. */
  dutiesHeading: "Powers & Duties (ሥልጣንና ተግባር)",
  /** Button that opens the duties dialog. `{count}` is how many there are. */
  dutiesButton: "Duties ({count})",

  // ሲኖዶስ ዘአኀው — Synod of Ahaw
  sinodosName: "Synod of Ahaw",
  sinodosRole1: "Supreme general assembly and final decision-making body of the church.",
  sinodosRole2: "Approves the appointment of the General Manager and institution managers.",
  sinodosRole3: "Decides the policy direction of the church.",
  sinodosRole4: "Approves new members and removes membership; full authority to ordain priests.",
  sinodosRole5: "Amends the bylaws and other regulations as the church grows.",
  sinodosRole6: "Approves the strategic plan; reviews service and performance against it.",
  sinodosRole7: "Reviews and approves the annual work and audit reports.",
  sinodosRole8: "Meets in regular session twice a year, plus emergency sessions.",

  // ሰብሳቢ ቄስ — Chairman Priest
  chairmanPriestName: "Chairman Priest",
  chairmanPriestRole1: "Serves as chairman of both the Synod and the Standing Synod.",
  chairmanPriestRole2: "Delivers opening/closing addresses and exhortation at church programs.",
  chairmanPriestRole3: "Oversees the life and service of Synod members.",
  chairmanPriestRole4: "Ensures Synod directives, policies and decisions are properly implemented.",
  chairmanPriestRole5: "Safeguards the foundational faith and represents the church externally.",

  // የሲኖዶስ ጸሐፊ — Synod Secretary
  synodSecretaryName: "Synod Secretary",
  synodSecretaryRole1: "Prepares agendas for the Synod and Standing Synod with the chairman and manager.",
  synodSecretaryRole2: "Records, reads, ratifies and archives meeting minutes.",
  synodSecretaryRole3: "Transmits ratified decisions to the relevant bodies.",
  synodSecretaryRole4: "Receives and routes correspondence; calls regular and emergency meetings.",

  // ኦዲትና የሥራ ምርመራ ኮሚቴ — Audit & Work Inspection Committee
  auditCommitteeName: "Audit & Work Inspection Committee",
  auditCommitteeRole1: "Audits the accuracy of the church's finance and property administration.",
  auditCommitteeRole2: "Verifies operations are carried out per the bylaws, Synod decisions and approved plan.",
  auditCommitteeRole3: "Confirms the existence and condition of church assets.",
  auditCommitteeRole4: "Accountable directly to the Synod.",

  // ቋሚ ሲኖዶስ — Standing Synod
  standingSynodName: "Standing Synod",
  standingSynodRole1: "Nine-member executive leadership council elected from the Synod.",
  standingSynodRole2: "Directs and closely monitors the executive and institutions to implement Synod decisions.",
  standingSynodRole3: "Issues directives to the General Manager and institution leaders; supervises execution.",
  standingSynodRole4: "Nominates diocese office managers for appointment.",
  standingSynodRole5: "Meets accountable to the Synod; plays the strategic leadership role.",

  // የነገረ ሃይማኖት መማክርት ጉባኤ — Theological Advisory Council
  theologicalCouncilName: "Theological Advisory Council",
  theologicalCouncilRole1: "Advises the Standing Synod on doctrine and matters of faith.",
  theologicalCouncilRole2: "Reviews teachings, books and faith declarations for doctrinal soundness.",

  // ጠቅላይ ጽ/ቤት — General Secretariat (Head Office)
  generalOfficeName: "General Secretariat (Head Office)",
  generalOfficeRole1: "Chief executive (service-delivery) body of the church, led by the General Manager.",
  generalOfficeRole2: "Organised into an administrative council, departments and various sections.",

  // ጠቅላይ ሥራ አስኪያጅ — General Manager
  generalManagerName: "General Manager",
  generalManagerRole1: "Appointed by the Synod; accountable to the Standing Synod.",
  generalManagerRole2: "Leads the day-to-day execution of all church services and administration.",
  generalManagerRole3: "Implements Synod and Standing Synod decisions across the structure.",

  // ምክትል ሥራ አስኪያጅ — Deputy General Manager
  deputyManagerName: "Deputy General Manager",
  deputyManagerRole1: "Serves as secretary of the administrative council.",
  deputyManagerRole2: "Carries out duties delegated by the General Manager and acts in his absence.",

  // አጠቃላይ ቁጥጥርና ክትትል — General Control & Follow-up
  controlFollowupName: "General Control & Follow-up",
  controlFollowupRole1: "Monitors overall execution and compliance across the office.",

  // ስልታዊ እቅድ፣ በጀትና ፕሮጀክት — Strategic Plan, Budget & Project
  strategicPlanBudgetName: "Strategic Plan, Budget & Project",
  strategicPlanBudgetRole1: "Coordinates strategic planning, budgeting and projects.",

  // ሕግ ክፍል — Legal Section
  legalSectionName: "Legal Section",
  legalSectionRole1: "Handles legal affairs and compliance.",

  // የጠቅላይ ጽ/ቤት አስተዳደር ጉባኤ — General Office Administrative Council
  adminCouncilName: "General Office Administrative Council",
  adminCouncilRole1: "Chaired by the General Manager with the Deputy as secretary; the department heads are members.",
  adminCouncilRole2: "Takes administrative decisions and reviews execution capacity.",
  adminCouncilRole3: "Sets strategic direction for departmental services; reviews and approves work & finance plans.",
  adminCouncilRole4: "Meets regularly every fifteen days, plus emergency sessions.",

  // የስብከተ ወንጌል መምሪያ — Evangelism Department
  deptEvangelismName: "Evangelism Department",
  deptEvangelismRole1: "Leads gospel preaching and outreach across the church.",
  deptEvangelismRole2: "Coordinates evangelists and apostolic mission work.",

  // ሐዋርያዊ ተልዕኮ ክፍል — Apostolic Mission Section
  secApostolicMissionName: "Apostolic Mission Section",
  secApostolicMissionRole1: "Leads evangelism and mission outreach.",

  // ጉባኤና አምልኮ ክፍል — Assembly & Worship Section
  secAssemblyWorshipName: "Assembly & Worship Section",
  secAssemblyWorshipRole1: "Organises congregational assembly and worship.",

  // የትምህርትና ሥልጠና መምሪያ — Education & Training Department
  deptEducationName: "Education & Training Department",
  deptEducationRole1: "Prepares and oversees teaching materials and curricula.",
  deptEducationRole2: "Coordinates leaders' and servants' training.",
  deptEducationRole3: "Guards the faith and reviews books/literature for doctrinal soundness.",

  // የትምህርት ዝግጅትና ክትትል — Education Preparation & Follow-up
  secEduPrepName: "Education Preparation & Follow-up",
  secEduPrepRole1: "Prepares curricula and follows up on teaching.",

  // የመሪዎችና የስልጠና ማስተባበሪያ — Leaders & Training Coordination
  secLeadersTrainingName: "Leaders & Training Coordination",
  secLeadersTrainingRole1: "Coordinates leadership and servant training.",

  // አቅበተ እምነትና የመጻሕፍት ግምገማ — Faith Defense & Book Review
  secFaithDefenseName: "Faith Defense & Book Review",
  secFaithDefenseRole1: "Defends the faith and reviews books/literature.",

  // የአገልግሎቶች ማደራጃ መምሪያ — Services Coordination Department
  deptServicesName: "Services Coordination Department",
  deptServicesRole1: "Organises archive (Mahder) services and miscellaneous ministries.",
  deptServicesRole2: "Coordinates document and protocol organisation and parish follow-up.",

  // የሰነዶችና ፕሮቶኮል ማደራጃ — Documents & Protocol Organisation
  secDocumentsProtocolName: "Documents & Protocol Organisation",
  secDocumentsProtocolRole1: "Organises documents and protocol.",

  // የአጥቢያዎች ክትትል — Parishes Follow-up
  secParishesFollowupName: "Parishes Follow-up",
  secParishesFollowupRole1: "Follows up on local parishes.",

  // የማኅደር አገልግሎቶች ማደራጃ — Archive (Mahder) Services Organisation
  secArchiveServicesName: "Archive (Mahder) Services Organisation",
  secArchiveServicesRole1: "Organises archive/Mahder services.",

  // የልዩ ልዩ አገልግሎቶች ማደራጃ — Miscellaneous Services Organisation
  secVariousServicesName: "Miscellaneous Services Organisation",
  secVariousServicesRole1: "Coordinates miscellaneous ministries.",

  // አስተዳደርና ፋይናንስ መምሪያ — Administration & Finance Department
  deptAdminFinanceName: "Administration & Finance Department",
  deptAdminFinanceRole1: "Manages human resources, records and archives.",
  deptAdminFinanceRole2: "Runs the finance section, property and general services.",
  deptAdminFinanceRole3: "Oversees the church's income-generating institutions.",

  // የገቢ ተቋማት — Income-generating Institutions
  secIncomeInstitutionsName: "Income-generating Institutions",
  secIncomeInstitutionsRole1: "Runs the church's income institutions.",

  // የሰው ኃይል አስተዳደር — Human Resources Administration
  secHrAdminName: "Human Resources Administration",
  secHrAdminRole1: "Manages employee records and staffing.",

  // ሪከርድና ማኅደር — Records & Archive
  secRecordArchiveName: "Records & Archive",
  secRecordArchiveRole1: "Maintains records and archives.",

  // የፋይናንስ ክፍል — Finance Section
  secFinanceName: "Finance Section",
  secFinanceRole1: "Handles finance and accounting.",

  // ንብረትና ጠቅላላ አገልግሎት — Property & General Services
  secPropertyGeneralName: "Property & General Services",
  secPropertyGeneralRole1: "Manages property and general services.",

  // የሕዝብና የውጭ ግንኙነት መምሪያ — Public & External Relations Department
  deptPublicRelationsName: "Public & External Relations Department",
  deptPublicRelationsRole1: "Manages public and external relations of the church.",
  deptPublicRelationsRole2: "Oversees printing & literature, and media coordination.",

  // ሕዝብና የውጭ ግንኙነት — Public & External Relations
  secPublicRelationsName: "Public & External Relations",
  secPublicRelationsRole1: "Handles public and external relations.",

  // ኅትመትና ሥነ ጽሑፍ — Printing & Literature
  secPrintingLiteratureName: "Printing & Literature",
  secPrintingLiteratureRole1: "Manages printing and literature.",

  // የሚዲያዎች ማስተባበሪያ — Media Coordination
  secMediaCoordinationName: "Media Coordination",
  secMediaCoordinationRole1: "Coordinates the church's media.",

  // የወጣቶችና የሕጻናት መምሪያ — Youth & Children Department
  deptYouthChildrenName: "Youth & Children Department",
  deptYouthChildrenRole1: "Leads children's ministry, youth ministry and the students' union.",
  deptYouthChildrenRole2: "Coordinates youth/children service follow-up and training.",

  // የሕጻናት አገልግሎት — Children Service
  secChildrenServiceName: "Children Service",
  secChildrenServiceRole1: "Runs children's ministry.",

  // የወጣቶች አገልግሎት — Youth Service
  secYouthServiceName: "Youth Service",
  secYouthServiceRole1: "Runs youth ministry.",

  // የተማሪዎች ኅብረት — Students' Union
  secStudentsUnionName: "Students' Union",
  secStudentsUnionRole1: "Coordinates the students' union.",

  // ሀገረ ስብከት ጽ/ቤት — Diocese Office
  dioceseOfficeName: "Diocese Office",
  dioceseOfficeRole1: "Executive body accountable to the General Office, led by the Diocese Manager Priest.",
  dioceseOfficeRole2: "Organises Woreda parish offices to reach all local churches.",
  dioceseOfficeRole3: "Has its own administrative council, departments and sections mirroring the head office.",

  // የሀገረ ስብከት ጠቅላላ ሰበካ ጉባኤ — Diocese General Parish Council
  dioceseParishCouncilName: "Diocese General Parish Council",
  dioceseParishCouncilRole1: "General parish council at the diocese level; governed by internal regulations.",

  // የወረዳ ሰበካ ጽ/ቤት — Woreda Parish Office
  woredaOfficeName: "Woreda Parish Office",
  woredaOfficeRole1: "Intermediate office under the diocese for reaching local parishes.",
  woredaOfficeRole2: "Governed by detailed internal regulations (ውስጠ ደንብ).",

  // አጥቢያ ቤተ ክርስቲያን — Local (Parish) Church
  atbiyaName: "Local (Parish) Church",
  atbiyaRole1: "The local congregation — base unit of the church structure.",
  atbiyaRole2: "May arise through gospel messengers, families, or a nearby parish.",
  atbiyaRole3: "Organised under a general parish council, administrative council and lead priest.",

  // ጠቅላላ ሰበካ ጉባኤ — General Parish Council
  generalParishCouncilName: "General Parish Council",
  generalParishCouncilRole1: "Highest decision-making body over all affairs of the local church.",
  generalParishCouncilRole2: "Voting members are the full members defined in Article 9.",

  // የሰበካ አስተዳደር ጉባኤ — Parish Administrative Council
  parishAdminCouncilName: "Parish Administrative Council",
  parishAdminCouncilRole1: "Executive administration of the local church between general council sessions.",
  parishAdminCouncilRole2: "Implements decisions and oversees the parish sections.",

  // ኦዲት ኮሚቴ — Parish Audit Committee
  parishAuditName: "Parish Audit Committee",
  parishAuditRole1: "Audits the local church's finance and property.",
  parishAuditRole2: "Verifies activities follow the bylaws and approved plans.",

  // መሪ ቄስ — Lead Priest
  leadPriestName: "Lead Priest",
  leadPriestRole1: "Spiritual leader of the local church.",
  leadPriestRole2: "Leads worship and sacraments; shepherds the congregation.",
  leadPriestRole3: "Oversees the parish sections and their servants.",

  // የአስተዳደርና ፋይናንስ ክፍል — Administration & Finance Section
  parishAdminFinanceName: "Administration & Finance Section",
  parishAdminFinanceRole1: "Manages the local church's administration, finance and property.",

  // የትምህርትና ሥልጠና ክፍል — Education & Training Section
  parishEducationName: "Education & Training Section",
  parishEducationRole1: "Delivers teaching, Bible study and training at the local church.",

  // ሐዋርያዊ ተልእኮ ክፍል — Apostolic Mission Section
  parishMissionName: "Apostolic Mission Section",
  parishMissionRole1: "Leads evangelism and outreach from the local church.",

  // የጉባኤና አምልኮ ክፍል — Assembly & Worship Section
  parishWorshipName: "Assembly & Worship Section",
  parishWorshipRole1: "Organises congregational assembly and worship services.",

  // የሕያዋን ማኅደራት ማስተባበሪያ ክፍል — Living Mahderat (Small Groups) Coordination Section
  parishMahderatName: "Living Mahderat (Small Groups) Coordination Section",
  parishMahderatRole1: "Coordinates the living small-groups (Mahderat) of believers.",

  // የወጣቶችና ሕፃናት አገልግሎት ክፍል — Youth & Children Service Section
  parishYouthName: "Youth & Children Service Section",
  parishYouthRole1: "Runs youth and children ministry at the local church.",

  // ማኅደር — Mahder (Local Archive)
  parishMahderName: "Mahder (Local Archive)",
  parishMahderRole1: "The local parish archive / treasury.",

  // ሐዋርያዊ ተቋማት — Apostolic Institutions
  apostolicInstitutionsName: "Apostolic Institutions",
  apostolicInstitutionsRole1: "Mission-focused institutions established under the Standing Synod.",

  // የትምህርትና ስልጠና ተቋማት — Education & Training Institutions
  educationInstitutionsName: "Education & Training Institutions",
  educationInstitutionsRole1: "Includes the research institute and Bible school.",
  educationInstitutionsRole2: "Provide formal theological education and training.",

  // ጥናትና ምርምር ተቋም — Research Institute
  researchInstituteName: "Research Institute",
  researchInstituteRole1: "Conducts theological study and research.",

  // መጽሐፍ ቅዱስ ት/ቤት — Bible School
  bibleSchoolName: "Bible School",
  bibleSchoolRole1: "Provides Bible education.",

  // የበጎ አድራጎት ድርጅት — Charity Organization
  charityOrgName: "Charity Organization",
  charityOrgRole1: "Charitable arm of the church serving the community.",
};

/**
 * Amharic is the default language, so a missing key here is a bug, not a
 * fallback. `Record` rather than `Partial<Record>` makes that a compile error.
 */
export const structureAm: Record<keyof typeof structureEn, string> = {
  articlePrefix: "አንቀጽ",
  dutiesHeading: "ሥልጣንና ተግባር",
  dutiesButton: "ተግባራት ({count})",

  // ሲኖዶስ ዘአኀው — Synod of Ahaw
  sinodosName: "ሲኖዶስ ዘአኀው",
  sinodosRole1: "የቤተ ክርስቲያኒቱ የበላይ ጠቅላላ ጉባኤና የመጨረሻ ውሳኔ ሰጪ አካል ነው።",
  sinodosRole2: "የጠቅላይ ሥራ አስኪያጁንና የተቋማት ኃላፊዎችን ሹመት ያጸድቃል።",
  sinodosRole3: "የቤተ ክርስቲያኒቱን የፖሊሲ አቅጣጫ ይወስናል።",
  sinodosRole4: "አዲስ አባላትን ያጸድቃል፤ አባልነትን ይሰርዛል፤ ካህናትን የመሾም ሙሉ ሥልጣን አለው።",
  sinodosRole5: "ቤተ ክርስቲያኒቱ ስታድግ መተዳደሪያ ደንቡንና ሌሎች ደንቦችን ያሻሽላል።",
  sinodosRole6: "ስትራቴጂያዊ ዕቅዱን ያጸድቃል፤ አገልግሎትንና አፈጻጸምን በእሱ ልክ ይገመግማል።",
  sinodosRole7: "ዓመታዊ የሥራና የኦዲት ሪፖርቶችን ይገመግማል፤ ያጸድቃል።",
  sinodosRole8: "በዓመት ሁለት ጊዜ መደበኛ ስብሰባ ያደርጋል፤ ከዚህ በተጨማሪ አስቸኳይ ስብሰባዎችን ያካሂዳል።",

  // ሰብሳቢ ቄስ — Chairman Priest
  chairmanPriestName: "ሰብሳቢ ቄስ",
  chairmanPriestRole1: "የሲኖዶሱም የቋሚ ሲኖዶሱም ሰብሳቢ ሆኖ ያገለግላል።",
  chairmanPriestRole2: "በቤተ ክርስቲያኒቱ መርሐ ግብራት ላይ የመክፈቻና የመዝጊያ ንግግርና ምዕዳን ያቀርባል።",
  chairmanPriestRole3: "የሲኖዶስ አባላትን ኑሮና አገልግሎት ይቆጣጠራል።",
  chairmanPriestRole4: "የሲኖዶሱ መመሪያዎች፣ ፖሊሲዎችና ውሳኔዎች በአግባቡ መፈጸማቸውን ያረጋግጣል።",
  chairmanPriestRole5: "የመሠረታዊ እምነቱን ጠባቂ ሆኖ ቤተ ክርስቲያኒቱን በውጭ ይወክላል።",

  // የሲኖዶስ ጸሐፊ — Synod Secretary
  synodSecretaryName: "የሲኖዶስ ጸሐፊ",
  synodSecretaryRole1: "ከሰብሳቢውና ከሥራ አስኪያጁ ጋር ሆኖ ለሲኖዶሱና ለቋሚ ሲኖዶሱ አጀንዳ ያዘጋጃል።",
  synodSecretaryRole2: "የስብሰባ ቃለ ጉባኤዎችን ይመዘግባል፣ ያነባል፣ ያጸድቃል፤ በማኅደር ያስቀምጣል።",
  synodSecretaryRole3: "የጸደቁ ውሳኔዎችን ለሚመለከታቸው አካላት ያስተላልፋል።",
  synodSecretaryRole4: "ደብዳቤዎችን ተቀብሎ ያደርሳል፤ መደበኛና አስቸኳይ ስብሰባዎችን ይጠራል።",

  // ኦዲትና የሥራ ምርመራ ኮሚቴ — Audit & Work Inspection Committee
  auditCommitteeName: "ኦዲትና የሥራ ምርመራ ኮሚቴ",
  auditCommitteeRole1: "የቤተ ክርስቲያኒቱ የገንዘብና የንብረት አስተዳደር ትክክለኛነት ኦዲት ያደርጋል።",
  auditCommitteeRole2: "ሥራዎች በመተዳደሪያ ደንቡ፣ በሲኖዶስ ውሳኔዎችና በጸደቀው ዕቅድ መሠረት መከናወናቸውን ያረጋግጣል።",
  auditCommitteeRole3: "የቤተ ክርስቲያኒቱ ንብረቶች መኖራቸውንና ያሉበትን ሁኔታ ያረጋግጣል።",
  auditCommitteeRole4: "በቀጥታ ለሲኖዶሱ ተጠሪ ነው።",

  // ቋሚ ሲኖዶስ — Standing Synod
  standingSynodName: "ቋሚ ሲኖዶስ",
  standingSynodRole1: "ከሲኖዶሱ የተመረጠ ዘጠኝ አባላት ያሉት የሥራ አስፈጻሚ አመራር ጉባኤ ነው።",
  standingSynodRole2: "የሲኖዶስ ውሳኔዎች እንዲፈጸሙ ሥራ አስፈጻሚውንና ተቋማቱን ይመራል፤ በቅርበት ይከታተላል።",
  standingSynodRole3: "ለጠቅላይ ሥራ አስኪያጁና ለተቋማት አመራሮች መመሪያ ይሰጣል፤ አፈጻጸሙን ይቆጣጠራል።",
  standingSynodRole4: "የሀገረ ስብከት ጽ/ቤት ሥራ አስኪያጆችን ለሹመት ያቀርባል።",
  standingSynodRole5: "ለሲኖዶሱ ተጠሪ ሆኖ ይሰበሰባል፤ የስትራቴጂያዊ አመራር ሚና ይጫወታል።",

  // የነገረ ሃይማኖት መማክርት ጉባኤ — Theological Advisory Council
  theologicalCouncilName: "የነገረ ሃይማኖት መማክርት ጉባኤ",
  theologicalCouncilRole1: "በነገረ ሃይማኖትና በእምነት ጉዳዮች ላይ ለቋሚ ሲኖዶሱ ምክር ይሰጣል።",
  theologicalCouncilRole2: "ትምህርቶች፣ መጻሕፍትና የእምነት መግለጫዎች ከሃይማኖት አንጻር ትክክል መሆናቸውን ይገመግማል።",

  // ጠቅላይ ጽ/ቤት — General Secretariat (Head Office)
  generalOfficeName: "ጠቅላይ ጽ/ቤት",
  generalOfficeRole1: "በጠቅላይ ሥራ አስኪያጅ የሚመራ የቤተ ክርስቲያኒቱ ዋና ሥራ አስፈጻሚ (አገልግሎት ሰጪ) አካል ነው።",
  generalOfficeRole2: "በአስተዳደር ጉባኤ፣ በመምሪያዎችና በተለያዩ ክፍሎች የተደራጀ ነው።",

  // ጠቅላይ ሥራ አስኪያጅ — General Manager
  generalManagerName: "ጠቅላይ ሥራ አስኪያጅ",
  generalManagerRole1: "በሲኖዶሱ ይሾማል፤ ለቋሚ ሲኖዶሱ ተጠሪ ነው።",
  generalManagerRole2: "የቤተ ክርስቲያኒቱን አጠቃላይ አገልግሎትና አስተዳደር ዕለታዊ አፈጻጸም ይመራል።",
  generalManagerRole3: "የሲኖዶስና የቋሚ ሲኖዶስ ውሳኔዎችን በመዋቅሩ ሁሉ ያስፈጽማል።",

  // ምክትል ሥራ አስኪያጅ — Deputy General Manager
  deputyManagerName: "ምክትል ሥራ አስኪያጅ",
  deputyManagerRole1: "የአስተዳደር ጉባኤው ጸሐፊ ሆኖ ያገለግላል።",
  deputyManagerRole2: "ከጠቅላይ ሥራ አስኪያጁ የተሰጡትን ተግባራት ይፈጽማል፤ በሌለበትም ተክቶ ይሠራል።",

  // አጠቃላይ ቁጥጥርና ክትትል — General Control & Follow-up
  controlFollowupName: "አጠቃላይ ቁጥጥርና ክትትል",
  controlFollowupRole1: "በጽ/ቤቱ ውስጥ ያለውን አጠቃላይ አፈጻጸምና ደንብ መከበር ይከታተላል።",

  // ስልታዊ እቅድ፣ በጀትና ፕሮጀክት — Strategic Plan, Budget & Project
  strategicPlanBudgetName: "ስልታዊ እቅድ፣ በጀትና ፕሮጀክት",
  strategicPlanBudgetRole1: "ስትራቴጂያዊ ዕቅድን፣ በጀትንና ፕሮጀክቶችን ያስተባብራል።",

  // ሕግ ክፍል — Legal Section
  legalSectionName: "ሕግ ክፍል",
  legalSectionRole1: "የሕግ ጉዳዮችንና ደንብ መከበርን ይከታተላል።",

  // የጠቅላይ ጽ/ቤት አስተዳደር ጉባኤ — General Office Administrative Council
  adminCouncilName: "የጠቅላይ ጽ/ቤት አስተዳደር ጉባኤ",
  adminCouncilRole1: "በጠቅላይ ሥራ አስኪያጁ የሚመራ ሲሆን ምክትሉ ጸሐፊ ነው፤ የመምሪያ ኃላፊዎች አባላት ናቸው።",
  adminCouncilRole2: "የአስተዳደር ውሳኔዎችን ይሰጣል፤ የአፈጻጸም አቅምን ይገመግማል።",
  adminCouncilRole3: "ለመምሪያ አገልግሎቶች ስትራቴጂያዊ አቅጣጫ ያስቀምጣል፤ የሥራና የገንዘብ ዕቅዶችን ገምግሞ ያጸድቃል።",
  adminCouncilRole4: "በየአሥራ አምስት ቀኑ በመደበኛነት ይሰበሰባል፤ አስቸኳይ ስብሰባዎችንም ያካሂዳል።",

  // የስብከተ ወንጌል መምሪያ — Evangelism Department
  deptEvangelismName: "የስብከተ ወንጌል መምሪያ",
  deptEvangelismRole1: "በቤተ ክርስቲያኒቱ ሁሉ የስብከተ ወንጌልንና የተልእኮ ሥራን ይመራል።",
  deptEvangelismRole2: "ሰባክያንንና ሐዋርያዊ የተልእኮ ሥራን ያስተባብራል።",

  // ሐዋርያዊ ተልዕኮ ክፍል — Apostolic Mission Section
  secApostolicMissionName: "ሐዋርያዊ ተልዕኮ ክፍል",
  secApostolicMissionRole1: "የስብከተ ወንጌልንና የተልእኮ ሥራን ይመራል።",

  // ጉባኤና አምልኮ ክፍል — Assembly & Worship Section
  secAssemblyWorshipName: "ጉባኤና አምልኮ ክፍል",
  secAssemblyWorshipRole1: "የጉባኤና የአምልኮ ሥርዓትን ያደራጃል።",

  // የትምህርትና ሥልጠና መምሪያ — Education & Training Department
  deptEducationName: "የትምህርትና ሥልጠና መምሪያ",
  deptEducationRole1: "የትምህርት ማስተማሪያዎችንና ሥርዓተ ትምህርትን ያዘጋጃል፤ ይከታተላል።",
  deptEducationRole2: "የመሪዎችንና የአገልጋዮችን ሥልጠና ያስተባብራል።",
  deptEducationRole3: "እምነትን ይጠብቃል፤ መጻሕፍትንና ጽሑፎችን ከሃይማኖት አንጻር ይገመግማል።",

  // የትምህርት ዝግጅትና ክትትል — Education Preparation & Follow-up
  secEduPrepName: "የትምህርት ዝግጅትና ክትትል",
  secEduPrepRole1: "ሥርዓተ ትምህርት ያዘጋጃል፤ የማስተማሩን ሂደት ይከታተላል።",

  // የመሪዎችና የስልጠና ማስተባበሪያ — Leaders & Training Coordination
  secLeadersTrainingName: "የመሪዎችና የስልጠና ማስተባበሪያ",
  secLeadersTrainingRole1: "የአመራርና የአገልጋዮች ሥልጠናን ያስተባብራል።",

  // አቅበተ እምነትና የመጻሕፍት ግምገማ — Faith Defense & Book Review
  secFaithDefenseName: "አቅበተ እምነትና የመጻሕፍት ግምገማ",
  secFaithDefenseRole1: "እምነትን ይከላከላል፤ መጻሕፍትንና ጽሑፎችን ይገመግማል።",

  // የአገልግሎቶች ማደራጃ መምሪያ — Services Coordination Department
  deptServicesName: "የአገልግሎቶች ማደራጃ መምሪያ",
  deptServicesRole1: "የማኅደር አገልግሎቶችንና ልዩ ልዩ አገልግሎቶችን ያደራጃል።",
  deptServicesRole2: "የሰነድና የፕሮቶኮል አደረጃጀትንና የአጥቢያዎችን ክትትል ያስተባብራል።",

  // የሰነዶችና ፕሮቶኮል ማደራጃ — Documents & Protocol Organisation
  secDocumentsProtocolName: "የሰነዶችና ፕሮቶኮል ማደራጃ",
  secDocumentsProtocolRole1: "ሰነዶችንና ፕሮቶኮልን ያደራጃል።",

  // የአጥቢያዎች ክትትል — Parishes Follow-up
  secParishesFollowupName: "የአጥቢያዎች ክትትል",
  secParishesFollowupRole1: "የአጥቢያ አብያተ ክርስቲያናትን ይከታተላል።",

  // የማኅደር አገልግሎቶች ማደራጃ — Archive (Mahder) Services Organisation
  secArchiveServicesName: "የማኅደር አገልግሎቶች ማደራጃ",
  secArchiveServicesRole1: "የማኅደር አገልግሎቶችን ያደራጃል።",

  // የልዩ ልዩ አገልግሎቶች ማደራጃ — Miscellaneous Services Organisation
  secVariousServicesName: "የልዩ ልዩ አገልግሎቶች ማደራጃ",
  secVariousServicesRole1: "ልዩ ልዩ አገልግሎቶችን ያስተባብራል።",

  // አስተዳደርና ፋይናንስ መምሪያ — Administration & Finance Department
  deptAdminFinanceName: "አስተዳደርና ፋይናንስ መምሪያ",
  deptAdminFinanceRole1: "የሰው ሀብትን፣ ሪከርድንና ማኅደርን ያስተዳድራል።",
  deptAdminFinanceRole2: "የፋይናንስ ክፍሉን፣ ንብረትንና ጠቅላላ አገልግሎትን ይመራል።",
  deptAdminFinanceRole3: "የቤተ ክርስቲያኒቱን ገቢ ሰብሳቢ ተቋማት ይቆጣጠራል።",

  // የገቢ ተቋማት — Income-generating Institutions
  secIncomeInstitutionsName: "የገቢ ተቋማት",
  secIncomeInstitutionsRole1: "የቤተ ክርስቲያኒቱን የገቢ ተቋማት ያስተዳድራል።",

  // የሰው ኃይል አስተዳደር — Human Resources Administration
  secHrAdminName: "የሰው ኃይል አስተዳደር",
  secHrAdminRole1: "የሠራተኞችን ሪከርድና የሰው ኃይል ምደባ ያስተዳድራል።",

  // ሪከርድና ማኅደር — Records & Archive
  secRecordArchiveName: "ሪከርድና ማኅደር",
  secRecordArchiveRole1: "ሪከርዶችንና ማኅደሮችን ይይዛል።",

  // የፋይናንስ ክፍል — Finance Section
  secFinanceName: "የፋይናንስ ክፍል",
  secFinanceRole1: "የገንዘብና የሒሳብ ሥራን ያከናውናል።",

  // ንብረትና ጠቅላላ አገልግሎት — Property & General Services
  secPropertyGeneralName: "ንብረትና ጠቅላላ አገልግሎት",
  secPropertyGeneralRole1: "ንብረትንና ጠቅላላ አገልግሎትን ያስተዳድራል።",

  // የሕዝብና የውጭ ግንኙነት መምሪያ — Public & External Relations Department
  deptPublicRelationsName: "የሕዝብና የውጭ ግንኙነት መምሪያ",
  deptPublicRelationsRole1: "የቤተ ክርስቲያኒቱን የሕዝብና የውጭ ግንኙነት ያስተዳድራል።",
  deptPublicRelationsRole2: "ኅትመትንና ሥነ ጽሑፍን እንዲሁም የሚዲያ ማስተባበርን ይቆጣጠራል።",

  // ሕዝብና የውጭ ግንኙነት — Public & External Relations
  secPublicRelationsName: "ሕዝብና የውጭ ግንኙነት",
  secPublicRelationsRole1: "የሕዝብና የውጭ ግንኙነትን ያከናውናል።",

  // ኅትመትና ሥነ ጽሑፍ — Printing & Literature
  secPrintingLiteratureName: "ኅትመትና ሥነ ጽሑፍ",
  secPrintingLiteratureRole1: "ኅትመትንና ሥነ ጽሑፍን ያስተዳድራል።",

  // የሚዲያዎች ማስተባበሪያ — Media Coordination
  secMediaCoordinationName: "የሚዲያዎች ማስተባበሪያ",
  secMediaCoordinationRole1: "የቤተ ክርስቲያኒቱን ሚዲያዎች ያስተባብራል።",

  // የወጣቶችና የሕጻናት መምሪያ — Youth & Children Department
  deptYouthChildrenName: "የወጣቶችና የሕጻናት መምሪያ",
  deptYouthChildrenRole1: "የሕጻናት አገልግሎትን፣ የወጣቶች አገልግሎትንና የተማሪዎች ኅብረትን ይመራል።",
  deptYouthChildrenRole2: "የወጣቶችና የሕጻናት አገልግሎት ክትትልንና ሥልጠናን ያስተባብራል።",

  // የሕጻናት አገልግሎት — Children Service
  secChildrenServiceName: "የሕጻናት አገልግሎት",
  secChildrenServiceRole1: "የሕጻናት አገልግሎትን ያካሂዳል።",

  // የወጣቶች አገልግሎት — Youth Service
  secYouthServiceName: "የወጣቶች አገልግሎት",
  secYouthServiceRole1: "የወጣቶች አገልግሎትን ያካሂዳል።",

  // የተማሪዎች ኅብረት — Students' Union
  secStudentsUnionName: "የተማሪዎች ኅብረት",
  secStudentsUnionRole1: "የተማሪዎችን ኅብረት ያስተባብራል።",

  // ሀገረ ስብከት ጽ/ቤት — Diocese Office
  dioceseOfficeName: "ሀገረ ስብከት ጽ/ቤት",
  dioceseOfficeRole1: "በሀገረ ስብከቱ ሥራ አስኪያጅ ቄስ የሚመራ፣ ለጠቅላይ ጽ/ቤቱ ተጠሪ የሆነ ሥራ አስፈጻሚ አካል ነው።",
  dioceseOfficeRole2: "ሁሉንም አጥቢያ አብያተ ክርስቲያናት ለመድረስ የወረዳ ሰበካ ጽ/ቤቶችን ያደራጃል።",
  dioceseOfficeRole3: "እንደ ጠቅላይ ጽ/ቤቱ ሁሉ የራሱ የአስተዳደር ጉባኤ፣ መምሪያዎችና ክፍሎች አሉት።",

  // የሀገረ ስብከት ጠቅላላ ሰበካ ጉባኤ — Diocese General Parish Council
  dioceseParishCouncilName: "የሀገረ ስብከት ጠቅላላ ሰበካ ጉባኤ",
  dioceseParishCouncilRole1: "በሀገረ ስብከት ደረጃ ያለ ጠቅላላ ሰበካ ጉባኤ ነው፤ በውስጠ ደንብ ይመራል።",

  // የወረዳ ሰበካ ጽ/ቤት — Woreda Parish Office
  woredaOfficeName: "የወረዳ ሰበካ ጽ/ቤት",
  woredaOfficeRole1: "አጥቢያ አብያተ ክርስቲያናትን ለመድረስ ከሀገረ ስብከቱ በታች ያለ መካከለኛ ጽ/ቤት ነው።",
  woredaOfficeRole2: "በዝርዝር ውስጠ ደንብ ይመራል።",

  // አጥቢያ ቤተ ክርስቲያን — Local (Parish) Church
  atbiyaName: "አጥቢያ ቤተ ክርስቲያን",
  atbiyaRole1: "የአጥቢያው ጉባኤ — የቤተ ክርስቲያኒቱ መዋቅር መሠረታዊ ክፍል ነው።",
  atbiyaRole2: "በወንጌል መልእክተኞች፣ በቤተሰቦች ወይም በአቅራቢያ ባለ አጥቢያ አማካኝነት ሊቋቋም ይችላል።",
  atbiyaRole3: "በጠቅላላ ሰበካ ጉባኤ፣ በአስተዳደር ጉባኤና በመሪ ቄስ ሥር የተደራጀ ነው።",

  // ጠቅላላ ሰበካ ጉባኤ — General Parish Council
  generalParishCouncilName: "ጠቅላላ ሰበካ ጉባኤ",
  generalParishCouncilRole1: "በአጥቢያ ቤተ ክርስቲያኗ ጉዳዮች ሁሉ ላይ የበላይ ውሳኔ ሰጪ አካል ነው።",
  generalParishCouncilRole2: "ድምፅ የመስጠት መብት ያላቸው በአንቀጽ 9 የተገለጹት ሙሉ አባላት ናቸው።",

  // የሰበካ አስተዳደር ጉባኤ — Parish Administrative Council
  parishAdminCouncilName: "የሰበካ አስተዳደር ጉባኤ",
  parishAdminCouncilRole1: "በጠቅላላ ጉባኤ ስብሰባዎች መካከል የአጥቢያዋ ሥራ አስፈጻሚ አስተዳደር ነው።",
  parishAdminCouncilRole2: "ውሳኔዎችን ያስፈጽማል፤ የአጥቢያውን ክፍሎች ይቆጣጠራል።",

  // ኦዲት ኮሚቴ — Parish Audit Committee
  parishAuditName: "ኦዲት ኮሚቴ",
  parishAuditRole1: "የአጥቢያ ቤተ ክርስቲያኗን ገንዘብና ንብረት ኦዲት ያደርጋል።",
  parishAuditRole2: "ተግባራት በመተዳደሪያ ደንቡና በጸደቁ ዕቅዶች መሠረት መከናወናቸውን ያረጋግጣል።",

  // መሪ ቄስ — Lead Priest
  leadPriestName: "መሪ ቄስ",
  leadPriestRole1: "የአጥቢያ ቤተ ክርስቲያኗ መንፈሳዊ መሪ ነው።",
  leadPriestRole2: "አምልኮንና ምሥጢራትን ይመራል፤ ምእመናኑን ይጠብቃል።",
  leadPriestRole3: "የአጥቢያውን ክፍሎችና አገልጋዮቻቸውን ይቆጣጠራል።",

  // የአስተዳደርና ፋይናንስ ክፍል — Administration & Finance Section
  parishAdminFinanceName: "የአስተዳደርና ፋይናንስ ክፍል",
  parishAdminFinanceRole1: "የአጥቢያ ቤተ ክርስቲያኗን አስተዳደር፣ ገንዘብና ንብረት ያስተዳድራል።",

  // የትምህርትና ሥልጠና ክፍል — Education & Training Section
  parishEducationName: "የትምህርትና ሥልጠና ክፍል",
  parishEducationRole1: "በአጥቢያ ቤተ ክርስቲያኗ ትምህርትን፣ የመጽሐፍ ቅዱስ ጥናትንና ሥልጠናን ይሰጣል።",

  // ሐዋርያዊ ተልእኮ ክፍል — Apostolic Mission Section
  parishMissionName: "ሐዋርያዊ ተልእኮ ክፍል",
  parishMissionRole1: "ከአጥቢያ ቤተ ክርስቲያኗ የሚደረግ ስብከተ ወንጌልንና ተልእኮን ይመራል።",

  // የጉባኤና አምልኮ ክፍል — Assembly & Worship Section
  parishWorshipName: "የጉባኤና አምልኮ ክፍል",
  parishWorshipRole1: "የጉባኤ አምልኮና የአገልግሎት ሥርዓቶችን ያደራጃል።",

  // የሕያዋን ማኅደራት ማስተባበሪያ ክፍል — Living Mahderat (Small Groups) Coordination Section
  parishMahderatName: "የሕያዋን ማኅደራት ማስተባበሪያ ክፍል",
  parishMahderatRole1: "የምእመናንን የሕያዋን ማኅደራት (ንዑሳን ቡድኖች) ያስተባብራል።",

  // የወጣቶችና ሕፃናት አገልግሎት ክፍል — Youth & Children Service Section
  parishYouthName: "የወጣቶችና ሕፃናት አገልግሎት ክፍል",
  parishYouthRole1: "በአጥቢያ ቤተ ክርስቲያኗ የወጣቶችና የሕጻናት አገልግሎትን ያካሂዳል።",

  // ማኅደር — Mahder (Local Archive)
  parishMahderName: "ማኅደር",
  parishMahderRole1: "የአጥቢያው ማኅደር / ግምጃ ቤት ነው።",

  // ሐዋርያዊ ተቋማት — Apostolic Institutions
  apostolicInstitutionsName: "ሐዋርያዊ ተቋማት",
  apostolicInstitutionsRole1: "በቋሚ ሲኖዶሱ ሥር የተቋቋሙ በተልእኮ ላይ ያተኮሩ ተቋማት ናቸው።",

  // የትምህርትና ስልጠና ተቋማት — Education & Training Institutions
  educationInstitutionsName: "የትምህርትና ስልጠና ተቋማት",
  educationInstitutionsRole1: "የጥናትና ምርምር ተቋሙንና የመጽሐፍ ቅዱስ ትምህርት ቤቱን ያካትታል።",
  educationInstitutionsRole2: "መደበኛ የሃይማኖት ትምህርትና ሥልጠና ይሰጣሉ።",

  // ጥናትና ምርምር ተቋም — Research Institute
  researchInstituteName: "ጥናትና ምርምር ተቋም",
  researchInstituteRole1: "የሃይማኖት ጥናትና ምርምር ያካሂዳል።",

  // መጽሐፍ ቅዱስ ት/ቤት — Bible School
  bibleSchoolName: "መጽሐፍ ቅዱስ ት/ቤት",
  bibleSchoolRole1: "የመጽሐፍ ቅዱስ ትምህርት ይሰጣል።",

  // የበጎ አድራጎት ድርጅት — Charity Organization
  charityOrgName: "የበጎ አድራጎት ድርጅት",
  charityOrgRole1: "ማኅበረሰቡን የሚያገለግል የቤተ ክርስቲያኒቱ የበጎ አድራጎት ክንፍ ነው።",
};

/** Afaan Oromoo and Tigrinya fall through to English until translated. */
export const structureOm: Partial<Record<keyof typeof structureEn, string>> = {};
export const structureTi: Partial<Record<keyof typeof structureEn, string>> = {};
