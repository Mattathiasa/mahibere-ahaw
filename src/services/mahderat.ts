import { db } from '@/lib/firebase';
import {
  collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';
import { hasCoords, type LatLng } from '@/lib/geo';

/**
 * Mahedherat — the small Bible-study groups inside a congregation.
 *
 * Like parishes, these are `hierarchy` documents (`level: 'Mahderat'`) rather
 * than their own collection, because `users.mahderatId` already points at
 * hierarchy doc ids and `parentId` already links a group to its congregation.
 *
 * Coordinates are plain `lat`/`lng` numbers rather than a Firestore GeoPoint:
 * a GeoPoint does not survive the generic `{...spread}` that `hierarchyService`
 * uses for updates, and nothing here needs geo queries — ranking tens of groups
 * happens in the browser.
 *
 * Every field below is optional so a `Mahderat` created through the old generic
 * entity dialog stays valid.
 */
export interface Mahder {
  id: string;
  /** Required — `orderBy('name')` silently drops documents without it. */
  name: string;
  nameAmharic?: string;
  level: 'Mahderat';
  /** The congregation (an `Atbiya` hierarchy doc id) this group belongs to. */
  parentId: string;
  lat?: number;
  lng?: number;
  /** A landmark shown to members, e.g. "near Bole Medhanealem". */
  locationLabel?: string;
  locationLabelAm?: string;
  meetingDay?: string;
  meetingTime?: string;
  leaderName?: string;
  leaderPhone?: string;
  description?: string;
  /** MISSING means true — groups created before this field existed. */
  active?: boolean;
}

export type MahderInput = Omit<Mahder, 'id' | 'level'>;

export const emptyMahder = (parentId: string): MahderInput => ({
  name: '',
  nameAmharic: '',
  parentId,
  locationLabel: '',
  locationLabelAm: '',
  meetingDay: '',
  meetingTime: '',
  leaderName: '',
  leaderPhone: '',
  description: '',
  active: true,
});

export const MEETING_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/** The pin, or null when this group has never been placed on the map. */
export function mahderCoords(m: Pick<Mahder, 'lat' | 'lng'>): LatLng | null {
  return hasCoords({ lat: m.lat, lng: m.lng }) ? { lat: m.lat!, lng: m.lng! } : null;
}

export const mahderatService = {
  /**
   * The groups of one congregation.
   *
   * Queries on `parentId` alone and filters `level` in memory, reusing the
   * existing hierarchy(parentId, name) index rather than needing a new
   * composite one — the same trade `atbiyaAdminService.list` makes.
   */
  async listByCongregation(atbiyaId: string, includeInactive = false): Promise<Mahder[]> {
    if (!atbiyaId) return [];
    const q = query(
      collection(db, 'hierarchy'),
      where('parentId', '==', atbiyaId),
      orderBy('name', 'asc')
    );
    const snap = await getDocs(q);
    const all = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Mahder)
      .filter((m) => m.level === 'Mahderat');
    return includeInactive ? all : all.filter((m) => m.active !== false);
  },

  async getById(id: string): Promise<Mahder | null> {
    if (!id) return null;
    const snap = await getDoc(doc(db, 'hierarchy', id));
    if (!snap.exists()) return null;
    const data = { id: snap.id, ...snap.data() } as Mahder;
    return data.level === 'Mahderat' ? data : null;
  },

  async create(data: MahderInput): Promise<Mahder> {
    const payload = { ...data, level: 'Mahderat' as const };
    const ref = await addDoc(collection(db, 'hierarchy'), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'hierarchy', ref.id, `Created Mahedher ${data.name}`);
    return { id: ref.id, ...payload };
  },

  /**
   * `level` and `parentId` are never sent: the rules reject a congregation
   * changing either, and sending them unchanged still trips the affectedKeys
   * check on some Firestore versions — the same reason MyAtbiya strips them.
   */
  async update(id: string, data: Partial<MahderInput>): Promise<void> {
    const { parentId, ...rest } = data;
    await updateDoc(doc(db, 'hierarchy', id), { ...rest, updatedAt: serverTimestamp() });
    auditLogService.dataChange('update', 'hierarchy', id, `Updated Mahedher ${data.name ?? id}`);
  },

  /**
   * Deactivates rather than deletes — `users.mahderatId` and the finance
   * collections reference these ids, and removing the document orphans them.
   */
  async setActive(id: string, active: boolean): Promise<void> {
    await updateDoc(doc(db, 'hierarchy', id), { active, updatedAt: serverTimestamp() });
    auditLogService.dataChange(
      'update', 'hierarchy', id,
      `${active ? 'Reactivated' : 'Deactivated'} Mahedher`
    );
  },

  /** Records the member's own choice of group. */
  async joinAsMember(uid: string, mahderId: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), {
      mahderatId: mahderId,
      updatedAt: new Date().toISOString(),
    });
  },
};
