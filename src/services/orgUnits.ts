import { db } from '@/lib/firebase';
import {
  collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';

/**
 * The church's organisational units.
 *
 * Every level lives in the same `hierarchy` collection, discriminated by
 * `level` and linked by `parentId` — the arrangement congregations and
 * Mahedherat already use. This module is the typed view over all of it, so the
 * registries do not each re-derive what a level's parent is.
 *
 * Two levels are new here: `Teklay` (ጠቅላይ ጽሕፈት ቤት) and `Woreda`. Neither
 * displaces anything: a Diocese whose `parentId` still points at a Memriya
 * document, or at nothing at all, keeps working.
 */

export type OrgLevel = 'Teklay' | 'Memriya' | 'Zone' | 'Woreda' | 'Atbiya' | 'Mahderat';

export interface OrgUnit {
  id: string;
  /** Required — `orderBy('name')` silently drops documents without it. */
  name: string;
  nameAmharic?: string;
  level: OrgLevel;
  parentId?: string | null;
  leaderName?: string;
  leaderPhone?: string;
  location?: string;
  description?: string;
  /** Ethiopian-calendar date as written in the register. */
  foundedAt?: string;
  /** MISSING means true — units created before this field existed. */
  active?: boolean;
}

export type OrgUnitInput = Omit<OrgUnit, 'id' | 'level'>;

export const emptyOrgUnit = (parentId: string | null = null): OrgUnitInput => ({
  name: '',
  nameAmharic: '',
  parentId,
  leaderName: '',
  leaderPhone: '',
  location: '',
  description: '',
  foundedAt: '',
  active: true,
});

interface LevelMeta {
  /** Which level a unit of this level hangs off, or null for the root. */
  parent: OrgLevel | null;
  /** There is only ever one of these. */
  singleton?: boolean;
  /**
   * Managed by its own dedicated screen rather than the generic registry —
   * congregations have banks, administrators and an importer, and Mahedherat
   * have map pins.
   */
  hasOwnScreen?: boolean;
}

export const LEVEL_META: Record<OrgLevel, LevelMeta> = {
  Teklay: { parent: null, singleton: true },
  Memriya: { parent: 'Teklay' },
  Zone: { parent: 'Teklay' },
  Woreda: { parent: 'Zone' },
  Atbiya: { parent: 'Zone', hasOwnScreen: true },
  Mahderat: { parent: 'Atbiya', hasOwnScreen: true },
};

export const orgUnitService = {
  /**
   * Every unit at one level.
   *
   * Uses the equality-filtered `level` query so it rides the existing
   * hierarchy(level, name) index, and filters `active` in memory because a
   * `where('active','==',true)` clause would exclude every document created
   * before the field existed.
   */
  async listByLevel(level: OrgLevel, includeInactive = false): Promise<OrgUnit[]> {
    const snap = await getDocs(query(
      collection(db, 'hierarchy'),
      where('level', '==', level),
      orderBy('name', 'asc')
    ));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrgUnit);
    return includeInactive ? all : all.filter((u) => u.active !== false);
  },

  /** Children of one unit, at whatever level they happen to be. */
  async listByParent(parentId: string, includeInactive = false): Promise<OrgUnit[]> {
    if (!parentId) return [];
    const snap = await getDocs(query(
      collection(db, 'hierarchy'),
      where('parentId', '==', parentId),
      orderBy('name', 'asc')
    ));
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrgUnit);
    return includeInactive ? all : all.filter((u) => u.active !== false);
  },

  /**
   * The single ጠቅላይ ጽሕፈት ቤት record, or null before one is created.
   *
   * Returns the first if somehow several exist rather than throwing — a
   * duplicate is a data problem for an administrator to resolve, not a reason
   * for the page to fail to load.
   */
  async getSecretariat(): Promise<OrgUnit | null> {
    const all = await orgUnitService.listByLevel('Teklay', true);
    return all[0] ?? null;
  },

  async getById(id: string): Promise<OrgUnit | null> {
    if (!id) return null;
    const snap = await getDoc(doc(db, 'hierarchy', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as OrgUnit) : null;
  },

  async create(level: OrgLevel, data: OrgUnitInput): Promise<OrgUnit> {
    const payload = { ...data, level };
    const ref = await addDoc(collection(db, 'hierarchy'), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'hierarchy', ref.id, `Created ${level} ${data.name}`);
    return { id: ref.id, ...payload };
  },

  async update(id: string, data: Partial<OrgUnitInput>): Promise<void> {
    await updateDoc(doc(db, 'hierarchy', id), { ...data, updatedAt: serverTimestamp() });
    auditLogService.dataChange('update', 'hierarchy', id, `Updated ${data.name ?? id}`);
  },

  /**
   * Deactivates rather than deletes. `users.atbiyaId`, `users.mahderatId`,
   * `news.atbiyaId` and every child unit's `parentId` reference these ids, so
   * removing a document would orphan them.
   */
  async setActive(id: string, active: boolean): Promise<void> {
    await updateDoc(doc(db, 'hierarchy', id), { active, updatedAt: serverTimestamp() });
    auditLogService.dataChange(
      'update', 'hierarchy', id, `${active ? 'Reactivated' : 'Deactivated'} org unit`
    );
  },

  /**
   * How many children each unit at `childLevel` has, keyed by parent id.
   *
   * One query for the whole level rather than one per parent — a registry of
   * twenty dioceses would otherwise fire twenty reads just to draw its badges.
   */
  async childCounts(childLevel: OrgLevel): Promise<Record<string, number>> {
    const children = await orgUnitService.listByLevel(childLevel, true);
    const counts: Record<string, number> = {};
    for (const c of children) {
      if (c.parentId) counts[c.parentId] = (counts[c.parentId] ?? 0) + 1;
    }
    return counts;
  },
};
