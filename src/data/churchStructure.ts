// Official organizational structure of the Ahaw Orthodox Tehadiso Church,
// constructed from the church bylaws ("መተዳደሪያ ደንብ" 5th revision, ቁ. 001/2018,
// Article 10 — መዋቅር, and the powers & duties in Articles 11–15).
//
// Each node carries the Amharic structure name, an English rendering, the
// governing bylaw article, and that body's key roles/responsibilities.

import type { Translations } from '@/i18n/translations';

export interface StructureNode {
  /**
   * Stable identity. Also the prefix of this body's translation keys —
   * `sinodos` -> `structure.sinodosName`, `structure.sinodosRole1..N` — with
   * kebab-case converted to camelCase.
   */
  id: string;
  /**
   * Amharic structure name as written in the bylaws.
   *
   * Kept on the node, not only in the dictionary, because it is a citation from
   * the መተዳደሪያ ደንብ rather than UI copy: a reader in any language should be able
   * to see the name the bylaws actually use.
   */
  name: string;
  /** English rendering for non-Amharic readers. */
  nameEn: string;
  /** Bylaw article number, e.g. '11' or '11.3'. The word "Article" is translated. */
  article?: string;
  /**
   * How many powers & duties (ሥልጣንና ተግባር) this body has.
   *
   * The duty text itself lives in the `structure` translation section as
   * `<id>Role1`..`<id>RoleN`. It used to be a `string[]` of English sentences
   * here, which rendered straight onto the Hierarchy page in English and — being
   * an array — could not have been translated by an admin even if it had been in
   * the dictionary, since `applyStringOverrides` skips arrays.
   */
  roleCount: number;
  children?: StructureNode[];
}

/** `sec-apostolic-mission` -> `secApostolicMission`, the translation key prefix. */
function keyPrefix(id: string): string {
  return id.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** This body's name in the reader's language, falling back to the bylaw Amharic. */
export function structureName(t: Translations, node: StructureNode): string {
  const section = t.structure as unknown as Record<string, string | undefined>;
  return section[`${keyPrefix(node.id)}Name`] ?? node.name;
}

/** This body's powers & duties in the reader's language. */
export function structureRoles(t: Translations, node: StructureNode): string[] {
  const section = t.structure as unknown as Record<string, string | undefined>;
  const prefix = keyPrefix(node.id);
  return Array.from({ length: node.roleCount }, (_, i) => section[`${prefix}Role${i + 1}`]).filter(
    (v): v is string => Boolean(v)
  );
}

/** A bylaw citation, e.g. "አንቀጽ 11.3". */
export function structureArticle(t: Translations, node: StructureNode): string | undefined {
  return node.article ? `${t.structure.articlePrefix} ${node.article}` : undefined;
}

export const CHURCH_STRUCTURE: StructureNode = {
  id: 'sinodos',
  name: 'ሲኖዶስ ዘአኀው',
  nameEn: 'Synod of Ahaw',
  article: '11',
  roleCount: 8,
  children: [
    {
      id: 'chairman-priest',
      name: 'ሰብሳቢ ቄስ',
      nameEn: 'Chairman Priest',
      article: '11.3',
      roleCount: 5,
    },
    {
      id: 'synod-secretary',
      name: 'የሲኖዶስ ጸሐፊ',
      nameEn: 'Synod Secretary',
      article: '11.4',
      roleCount: 4,
    },
    {
      id: 'audit-committee',
      name: 'ኦዲትና የሥራ ምርመራ ኮሚቴ',
      nameEn: 'Audit & Work Inspection Committee',
      article: '11.5',
      roleCount: 4,
    },
    {
      id: 'standing-synod',
      name: 'ቋሚ ሲኖዶስ',
      nameEn: 'Standing Synod',
      article: '12',
      roleCount: 5,
      children: [
        {
          id: 'theological-council',
          name: 'የነገረ ሃይማኖት መማክርት ጉባኤ',
          nameEn: 'Theological Advisory Council',
          roleCount: 2,
        },
        {
          id: 'general-office',
          name: 'ጠቅላይ ጽ/ቤት',
          nameEn: 'General Secretariat (Head Office)',
          article: '13',
          roleCount: 2,
          children: [
            {
              id: 'general-manager',
              name: 'ጠቅላይ ሥራ አስኪያጅ',
              nameEn: 'General Manager',
              article: '13.3',
              roleCount: 3,
            },
            {
              id: 'deputy-manager',
              name: 'ምክትል ሥራ አስኪያጅ',
              nameEn: 'Deputy General Manager',
              article: '13.4',
              roleCount: 2,
              children: [
                {
                  id: 'control-followup',
                  name: 'አጠቃላይ ቁጥጥርና ክትትል',
                  nameEn: 'General Control & Follow-up',
                  roleCount: 1,
                },
                {
                  id: 'strategic-plan-budget',
                  name: 'ስልታዊ እቅድ፣ በጀትና ፕሮጀክት',
                  nameEn: 'Strategic Plan, Budget & Project',
                  roleCount: 1,
                },
                {
                  id: 'legal-section',
                  name: 'ሕግ ክፍል',
                  nameEn: 'Legal Section',
                  roleCount: 1,
                },
              ],
            },
            {
              id: 'admin-council',
              name: 'የጠቅላይ ጽ/ቤት አስተዳደር ጉባኤ',
              nameEn: 'General Office Administrative Council',
              article: '13.2',
              roleCount: 4,
            },
            {
              id: 'dept-evangelism',
              name: 'የስብከተ ወንጌል መምሪያ',
              nameEn: 'Evangelism Department',
              roleCount: 2,
              children: [
                { id: 'sec-apostolic-mission', name: 'ሐዋርያዊ ተልዕኮ ክፍል', nameEn: 'Apostolic Mission Section', roleCount: 1 },
                { id: 'sec-assembly-worship', name: 'ጉባኤና አምልኮ ክፍል', nameEn: 'Assembly & Worship Section', roleCount: 1 },
              ],
            },
            {
              id: 'dept-education',
              name: 'የትምህርትና ሥልጠና መምሪያ',
              nameEn: 'Education & Training Department',
              article: '13.5',
              roleCount: 3,
              children: [
                { id: 'sec-edu-prep', name: 'የትምህርት ዝግጅትና ክትትል', nameEn: 'Education Preparation & Follow-up', roleCount: 1 },
                { id: 'sec-leaders-training', name: 'የመሪዎችና የስልጠና ማስተባበሪያ', nameEn: 'Leaders & Training Coordination', roleCount: 1 },
                { id: 'sec-faith-defense', name: 'አቅበተ እምነትና የመጻሕፍት ግምገማ', nameEn: 'Faith Defense & Book Review', roleCount: 1 },
              ],
            },
            {
              id: 'dept-services',
              name: 'የአገልግሎቶች ማደራጃ መምሪያ',
              nameEn: 'Services Coordination Department',
              article: '13.8',
              roleCount: 2,
              children: [
                { id: 'sec-documents-protocol', name: 'የሰነዶችና ፕሮቶኮል ማደራጃ', nameEn: 'Documents & Protocol Organisation', roleCount: 1 },
                { id: 'sec-parishes-followup', name: 'የአጥቢያዎች ክትትል', nameEn: 'Parishes Follow-up', roleCount: 1 },
                { id: 'sec-archive-services', name: 'የማኅደር አገልግሎቶች ማደራጃ', nameEn: 'Archive (Mahder) Services Organisation', roleCount: 1 },
                { id: 'sec-various-services', name: 'የልዩ ልዩ አገልግሎቶች ማደራጃ', nameEn: 'Miscellaneous Services Organisation', roleCount: 1 },
              ],
            },
            {
              id: 'dept-admin-finance',
              name: 'አስተዳደርና ፋይናንስ መምሪያ',
              nameEn: 'Administration & Finance Department',
              article: '13.7',
              roleCount: 3,
              children: [
                { id: 'sec-income-institutions', name: 'የገቢ ተቋማት', nameEn: 'Income-generating Institutions', roleCount: 1 },
                { id: 'sec-hr-admin', name: 'የሰው ኃይል አስተዳደር', nameEn: 'Human Resources Administration', roleCount: 1 },
                { id: 'sec-record-archive', name: 'ሪከርድና ማኅደር', nameEn: 'Records & Archive', roleCount: 1 },
                { id: 'sec-finance', name: 'የፋይናንስ ክፍል', nameEn: 'Finance Section', roleCount: 1 },
                { id: 'sec-property-general', name: 'ንብረትና ጠቅላላ አገልግሎት', nameEn: 'Property & General Services', roleCount: 1 },
              ],
            },
            {
              id: 'dept-public-relations',
              name: 'የሕዝብና የውጭ ግንኙነት መምሪያ',
              nameEn: 'Public & External Relations Department',
              article: '13.6',
              roleCount: 2,
              children: [
                { id: 'sec-public-relations', name: 'ሕዝብና የውጭ ግንኙነት', nameEn: 'Public & External Relations', roleCount: 1 },
                { id: 'sec-printing-literature', name: 'ኅትመትና ሥነ ጽሑፍ', nameEn: 'Printing & Literature', roleCount: 1 },
                { id: 'sec-media-coordination', name: 'የሚዲያዎች ማስተባበሪያ', nameEn: 'Media Coordination', roleCount: 1 },
              ],
            },
            {
              id: 'dept-youth-children',
              name: 'የወጣቶችና የሕጻናት መምሪያ',
              nameEn: 'Youth & Children Department',
              article: '13.10',
              roleCount: 2,
              children: [
                { id: 'sec-children-service', name: 'የሕጻናት አገልግሎት', nameEn: 'Children Service', roleCount: 1 },
                { id: 'sec-youth-service', name: 'የወጣቶች አገልግሎት', nameEn: 'Youth Service', roleCount: 1 },
                { id: 'sec-students-union', name: 'የተማሪዎች ኅብረት', nameEn: 'Students\' Union', roleCount: 1 },
              ],
            },
          ],
        },
        {
          id: 'diocese-office',
          name: 'ሀገረ ስብከት ጽ/ቤት',
          nameEn: 'Diocese Office',
          article: '14',
          roleCount: 3,
          children: [
            {
              id: 'diocese-parish-council',
              name: 'የሀገረ ስብከት ጠቅላላ ሰበካ ጉባኤ',
              nameEn: 'Diocese General Parish Council',
              article: '14.3',
              roleCount: 1,
            },
            {
              id: 'woreda-office',
              name: 'የወረዳ ሰበካ ጽ/ቤት',
              nameEn: 'Woreda Parish Office',
              article: '14.1.4',
              roleCount: 2,
              children: [
            {
              id: 'atbiya',
              name: 'አጥቢያ ቤተ ክርስቲያን',
              nameEn: 'Local (Parish) Church',
              article: '15',
              roleCount: 3,
              children: [
                {
                  id: 'general-parish-council',
                  name: 'ጠቅላላ ሰበካ ጉባኤ',
                  nameEn: 'General Parish Council',
                  article: '15.4',
                  roleCount: 2,
                },
                {
                  id: 'parish-admin-council',
                  name: 'የሰበካ አስተዳደር ጉባኤ',
                  nameEn: 'Parish Administrative Council',
                  article: '15.7',
                  roleCount: 2,
                },
                {
                  id: 'parish-audit',
                  name: 'ኦዲት ኮሚቴ',
                  nameEn: 'Parish Audit Committee',
                  article: '15.5',
                  roleCount: 2,
                },
                {
                  id: 'lead-priest',
                  name: 'መሪ ቄስ',
                  nameEn: 'Lead Priest',
                  article: '15.8',
                  roleCount: 3,
                },
                {
                  id: 'parish-admin-finance',
                  name: 'የአስተዳደርና ፋይናንስ ክፍል',
                  nameEn: 'Administration & Finance Section',
                  article: '15.9',
                  roleCount: 1,
                },
                {
                  id: 'parish-education',
                  name: 'የትምህርትና ሥልጠና ክፍል',
                  nameEn: 'Education & Training Section',
                  article: '15.10',
                  roleCount: 1,
                },
                {
                  id: 'parish-mission',
                  name: 'ሐዋርያዊ ተልእኮ ክፍል',
                  nameEn: 'Apostolic Mission Section',
                  article: '15.11',
                  roleCount: 1,
                },
                {
                  id: 'parish-worship',
                  name: 'የጉባኤና አምልኮ ክፍል',
                  nameEn: 'Assembly & Worship Section',
                  article: '15.12',
                  roleCount: 1,
                },
                {
                  id: 'parish-mahderat',
                  name: 'የሕያዋን ማኅደራት ማስተባበሪያ ክፍል',
                  nameEn: 'Living Mahderat (Small Groups) Coordination Section',
                  article: '15.13',
                  roleCount: 1,
                },
                {
                  id: 'parish-youth',
                  name: 'የወጣቶችና ሕፃናት አገልግሎት ክፍል',
                  nameEn: 'Youth & Children Service Section',
                  article: '15.14',
                  roleCount: 1,
                },
                {
                  id: 'parish-mahder',
                  name: 'ማኅደር',
                  nameEn: 'Mahder (Local Archive)',
                  roleCount: 1,
                },
              ],
            },
              ],
            },
          ],
        },
        {
          id: 'apostolic-institutions',
          name: 'ሐዋርያዊ ተቋማት',
          nameEn: 'Apostolic Institutions',
          roleCount: 1,
        },
        {
          id: 'education-institutions',
          name: 'የትምህርትና ስልጠና ተቋማት',
          nameEn: 'Education & Training Institutions',
          roleCount: 2,
          children: [
            { id: 'research-institute', name: 'ጥናትና ምርምር ተቋም', nameEn: 'Research Institute', roleCount: 1 },
            { id: 'bible-school', name: 'መጽሐፍ ቅዱስ ት/ቤት', nameEn: 'Bible School', roleCount: 1 },
          ],
        },
        {
          id: 'charity-org',
          name: 'የበጎ አድራጎት ድርጅት',
          nameEn: 'Charity Organization',
          roleCount: 1,
        },
      ],
    },
  ],
};

/** A flat list of every structure node, with a breadcrumb path — used to
 *  assign HR employees to a position within the hierarchy. */
export interface StructureOption {
  id: string;
  name: string;     // Amharic
  nameEn: string;
  path: string;     // e.g. "General Secretariat › Evangelism Department"
}

export function flattenStructure(node: StructureNode = CHURCH_STRUCTURE, trail: string[] = []): StructureOption[] {
  const here = [...trail, node.nameEn];
  const self: StructureOption = {
    id: node.id,
    name: node.name,
    nameEn: node.nameEn,
    path: here.join(' › '),
  };
  const children = (node.children ?? []).flatMap((c) => flattenStructure(c, here));
  return [self, ...children];
}
