// Official organizational structure of the Ahaw Orthodox Tehadiso Church,
// constructed from the church bylaws ("መተዳደሪያ ደንብ" 5th revision, ቁ. 001/2018,
// Article 10 — መዋቅር, and the powers & duties in Articles 11–15).
//
// Each node carries the Amharic structure name, an English rendering, the
// governing bylaw article, and that body's key roles/responsibilities.

export interface StructureNode {
  id: string;
  /** Amharic structure name as written in the bylaws. */
  name: string;
  /** English rendering for non-Amharic readers. */
  nameEn: string;
  /** Bylaw article/section this structure is defined in. */
  article?: string;
  /** Key powers & duties (ሥልጣንና ተግባር) summarised from the bylaws. */
  roles: string[];
  children?: StructureNode[];
}

export const CHURCH_STRUCTURE: StructureNode = {
  id: 'sinodos',
  name: 'ሲኖዶስ ዘአኀው',
  nameEn: 'Synod of Ahaw',
  article: 'Article 11',
  roles: [
    'Supreme general assembly and final decision-making body of the church.',
    'Approves the appointment of the General Manager and institution managers.',
    'Decides the policy direction of the church.',
    'Approves new members and removes membership; full authority to ordain priests.',
    'Amends the bylaws and other regulations as the church grows.',
    'Approves the strategic plan; reviews service and performance against it.',
    'Reviews and approves the annual work and audit reports.',
    'Meets in regular session twice a year, plus emergency sessions.',
  ],
  children: [
    {
      id: 'chairman-priest',
      name: 'ሰብሳቢ ቄስ',
      nameEn: 'Chairman Priest',
      article: 'Article 11.3',
      roles: [
        'Serves as chairman of both the Synod and the Standing Synod.',
        'Delivers opening/closing addresses and exhortation at church programs.',
        'Oversees the life and service of Synod members.',
        'Ensures Synod directives, policies and decisions are properly implemented.',
        'Safeguards the foundational faith and represents the church externally.',
      ],
    },
    {
      id: 'synod-secretary',
      name: 'የሲኖዶስ ጸሐፊ',
      nameEn: 'Synod Secretary',
      article: 'Article 11.4',
      roles: [
        'Prepares agendas for the Synod and Standing Synod with the chairman and manager.',
        'Records, reads, ratifies and archives meeting minutes.',
        'Transmits ratified decisions to the relevant bodies.',
        'Receives and routes correspondence; calls regular and emergency meetings.',
      ],
    },
    {
      id: 'audit-committee',
      name: 'ኦዲትና የሥራ ምርመራ ኮሚቴ',
      nameEn: 'Audit & Work Inspection Committee',
      article: 'Article 11.5',
      roles: [
        'Audits the accuracy of the church\'s finance and property administration.',
        'Verifies operations are carried out per the bylaws, Synod decisions and approved plan.',
        'Confirms the existence and condition of church assets.',
        'Accountable directly to the Synod.',
      ],
    },
    {
      id: 'standing-synod',
      name: 'ቋሚ ሲኖዶስ',
      nameEn: 'Standing Synod',
      article: 'Article 12',
      roles: [
        'Nine-member executive leadership council elected from the Synod.',
        'Directs and closely monitors the executive and institutions to implement Synod decisions.',
        'Issues directives to the General Manager and institution leaders; supervises execution.',
        'Nominates diocese office managers for appointment.',
        'Meets accountable to the Synod; plays the strategic leadership role.',
      ],
      children: [
        {
          id: 'theological-council',
          name: 'የነገረ ሃይማኖት መማክርት ጉባኤ',
          nameEn: 'Theological Advisory Council',
          roles: [
            'Advises the Standing Synod on doctrine and matters of faith.',
            'Reviews teachings, books and faith declarations for doctrinal soundness.',
          ],
        },
        {
          id: 'general-office',
          name: 'ጠቅላይ ጽ/ቤት',
          nameEn: 'General Secretariat (Head Office)',
          article: 'Article 13',
          roles: [
            'Chief executive (service-delivery) body of the church, led by the General Manager.',
            'Organised into an administrative council, departments and various sections.',
          ],
          children: [
            {
              id: 'general-manager',
              name: 'ጠቅላይ ሥራ አስኪያጅ',
              nameEn: 'General Manager',
              article: 'Article 13.3',
              roles: [
                'Appointed by the Synod; accountable to the Standing Synod.',
                'Leads the day-to-day execution of all church services and administration.',
                'Implements Synod and Standing Synod decisions across the structure.',
              ],
            },
            {
              id: 'deputy-manager',
              name: 'ምክትል ሥራ አስኪያጅ',
              nameEn: 'Deputy General Manager',
              article: 'Article 13.4',
              roles: [
                'Serves as secretary of the administrative council.',
                'Carries out duties delegated by the General Manager and acts in his absence.',
              ],
            },
            {
              id: 'admin-council',
              name: 'የጠቅላይ ጽ/ቤት አስተዳደር ጉባኤ',
              nameEn: 'General Office Administrative Council',
              article: 'Article 13.2',
              roles: [
                'Chaired by the General Manager with the Deputy as secretary; the department heads are members.',
                'Takes administrative decisions and reviews execution capacity.',
                'Sets strategic direction for departmental services; reviews and approves work & finance plans.',
                'Meets regularly every fifteen days, plus emergency sessions.',
              ],
            },
            {
              id: 'dept-evangelism',
              name: 'የስብከተ ወንጌል መምሪያ',
              nameEn: 'Evangelism Department',
              roles: [
                'Leads gospel preaching and outreach across the church.',
                'Coordinates evangelists and apostolic mission work.',
              ],
            },
            {
              id: 'dept-education',
              name: 'የትምህርትና ሥልጠና መምሪያ',
              nameEn: 'Education & Training Department',
              article: 'Article 13.5',
              roles: [
                'Prepares and oversees teaching materials and curricula.',
                'Coordinates leaders\' and servants\' training.',
                'Guards the faith and reviews books/literature for doctrinal soundness.',
              ],
            },
            {
              id: 'dept-services',
              name: 'የአገልግሎቶች ማደራጃ መምሪያ',
              nameEn: 'Services Coordination Department',
              article: 'Article 13.8',
              roles: [
                'Organises archive (Mahder) services and miscellaneous ministries.',
                'Coordinates document and protocol organisation and parish follow-up.',
              ],
            },
            {
              id: 'dept-admin-finance',
              name: 'አስተዳደርና ፋይናንስ መምሪያ',
              nameEn: 'Administration & Finance Department',
              article: 'Article 13.7',
              roles: [
                'Manages human resources, records and archives.',
                'Runs the finance section, property and general services.',
                'Oversees the church\'s income-generating institutions.',
              ],
            },
            {
              id: 'dept-public-relations',
              name: 'የሕዝብና የውጭ ግንኙነት መምሪያ',
              nameEn: 'Public & External Relations Department',
              article: 'Article 13.6',
              roles: [
                'Manages public and external relations of the church.',
                'Oversees printing & literature, and media coordination.',
              ],
            },
            {
              id: 'dept-youth-children',
              name: 'የወጣቶችና የሕጻናት መምሪያ',
              nameEn: 'Youth & Children Department',
              article: 'Article 13.10',
              roles: [
                'Leads children\'s ministry, youth ministry and the students\' union.',
                'Coordinates youth/children service follow-up and training.',
              ],
            },
          ],
        },
        {
          id: 'diocese-office',
          name: 'ሀገረ ስብከት ጽ/ቤት',
          nameEn: 'Diocese Office',
          article: 'Article 14',
          roles: [
            'Executive body accountable to the General Office, led by the Diocese Manager Priest.',
            'Organises Woreda parish offices to reach all local churches.',
            'Has its own administrative council, departments and sections mirroring the head office.',
          ],
          children: [
            {
              id: 'woreda-office',
              name: 'የወረዳ ሰበካ ጽ/ቤት',
              nameEn: 'Woreda Parish Office',
              article: 'Article 14.1.4',
              roles: [
                'Intermediate office under the diocese for reaching local parishes.',
                'Governed by detailed internal regulations (ውስጠ ደንብ).',
              ],
            },
            {
              id: 'atbiya',
              name: 'አጥቢያ ቤተ ክርስቲያን',
              nameEn: 'Local (Parish) Church',
              article: 'Article 15',
              roles: [
                'The local congregation — base unit of the church structure.',
                'May arise through gospel messengers, families, or a nearby parish.',
                'Organised under a general parish council, administrative council and lead priest.',
              ],
              children: [
                {
                  id: 'general-parish-council',
                  name: 'ጠቅላላ ሰበካ ጉባኤ',
                  nameEn: 'General Parish Council',
                  article: 'Article 15.4',
                  roles: [
                    'Highest decision-making body over all affairs of the local church.',
                    'Voting members are the full members defined in Article 9.',
                  ],
                },
                {
                  id: 'parish-admin-council',
                  name: 'የሰበካ አስተዳደር ጉባኤ',
                  nameEn: 'Parish Administrative Council',
                  article: 'Article 15.7',
                  roles: [
                    'Executive administration of the local church between general council sessions.',
                    'Implements decisions and oversees the parish sections.',
                  ],
                },
                {
                  id: 'parish-audit',
                  name: 'ኦዲት ኮሚቴ',
                  nameEn: 'Parish Audit Committee',
                  article: 'Article 15.5',
                  roles: [
                    'Audits the local church\'s finance and property.',
                    'Verifies activities follow the bylaws and approved plans.',
                  ],
                },
                {
                  id: 'lead-priest',
                  name: 'መሪ ቄስ',
                  nameEn: 'Lead Priest',
                  article: 'Article 15.8',
                  roles: [
                    'Spiritual leader of the local church.',
                    'Leads worship and sacraments; shepherds the congregation.',
                    'Oversees the parish sections and their servants.',
                  ],
                },
                {
                  id: 'parish-admin-finance',
                  name: 'የአስተዳደርና ፋይናንስ ክፍል',
                  nameEn: 'Administration & Finance Section',
                  article: 'Article 15.9',
                  roles: ['Manages the local church\'s administration, finance and property.'],
                },
                {
                  id: 'parish-education',
                  name: 'የትምህርትና ሥልጠና ክፍል',
                  nameEn: 'Education & Training Section',
                  article: 'Article 15.10',
                  roles: ['Delivers teaching, Bible study and training at the local church.'],
                },
                {
                  id: 'parish-mission',
                  name: 'ሐዋርያዊ ተልእኮ ክፍል',
                  nameEn: 'Apostolic Mission Section',
                  article: 'Article 15.11',
                  roles: ['Leads evangelism and outreach from the local church.'],
                },
                {
                  id: 'parish-worship',
                  name: 'የጉባኤና አምልኮ ክፍል',
                  nameEn: 'Assembly & Worship Section',
                  article: 'Article 15.12',
                  roles: ['Organises congregational assembly and worship services.'],
                },
                {
                  id: 'parish-mahderat',
                  name: 'የሕያዋን ማኅደራት ማስተባበሪያ ክፍል',
                  nameEn: 'Living Mahderat (Small Groups) Coordination Section',
                  article: 'Article 15.13',
                  roles: ['Coordinates the living small-groups (Mahderat) of believers.'],
                },
                {
                  id: 'parish-youth',
                  name: 'የወጣቶችና ሕፃናት አገልግሎት ክፍል',
                  nameEn: 'Youth & Children Service Section',
                  article: 'Article 15.14',
                  roles: ['Runs youth and children ministry at the local church.'],
                },
              ],
            },
          ],
        },
        {
          id: 'apostolic-institutions',
          name: 'ሐዋርያዊ ተቋማት',
          nameEn: 'Apostolic Institutions',
          roles: ['Mission-focused institutions established under the Standing Synod.'],
        },
        {
          id: 'education-institutions',
          name: 'የትምህርትና ስልጠና ተቋማት',
          nameEn: 'Education & Training Institutions',
          roles: [
            'Includes the research institute and Bible school.',
            'Provide formal theological education and training.',
          ],
        },
        {
          id: 'charity-org',
          name: 'የበጎ አድራጎት ድርጅት',
          nameEn: 'Charity Organization',
          roles: ['Charitable arm of the church serving the community.'],
        },
      ],
    },
  ],
};
