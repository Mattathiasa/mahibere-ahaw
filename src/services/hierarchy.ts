import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';
import { hasCoords, type LatLng } from '@/lib/geo';

// ─── Atbiya (parish) registry ────────────────────────────────────────────────
// Parishes are `hierarchy` documents with level === 'Atbiya'. They live here
// rather than in a separate collection because `users.atbiyaId` already points
// at hierarchy doc ids and `parentId` already links a parish to its Zone.
//
// The fields below are all optional additions, so parish records created before
// the registry existed stay valid.

export interface AtbiyaBankAccount {
  bankName: string;
  bankNameAmharic?: string;
  accountNumber: string;
  accountHolder?: string;
}

export interface AtbiyaContact {
  nameEn?: string;
  nameAm?: string;
  phone?: string;
  phone2?: string;
  email?: string;
}

/**
 * The parish fields that are NOT world-readable.
 *
 * `/hierarchy` is deliberately readable by anonymous visitors so the public
 * sign-up dropdown works without an account. That was safe for a parish name.
 * It was not safe once the records grew to hold bank account numbers and parish
 * leaders' phone numbers — anyone could run `where('level','==','Atbiya')` and
 * dump the registry.
 *
 * Firestore rules cannot project fields, so the only way a public read stays
 * safe is for the public document to hold nothing private. These live in
 * `atbiyaPrivate/{atbiyaId}` instead, keyed by the same hierarchy doc id.
 *
 * They stay on the `Atbiya` type: the forms and cards work with one object, and
 * the service is what splits and rejoins it. Anything sensitive added later
 * belongs in this list.
 *
 * `lat`/`lng` are here by choice rather than necessity. A church building is not
 * a secret and `mapUrl` on the public document already hints at where one is —
 * but a precise pin for every congregation in the country is a different kind of
 * dataset, and it is only wanted for internal mapping. Putting it here means the
 * public site can never render a church-finder map without moving it first.
 */
export interface AtbiyaPrivate {
  bankAccounts?: AtbiyaBankAccount[];
  contact?: AtbiyaContact;
  /**
   * Plain numbers, not a Firestore GeoPoint — for the reason recorded in
   * services/mahderat.ts: a GeoPoint does not survive the generic `{...spread}`
   * these services use for updates, and nothing here needs a geo query.
   */
  lat?: number;
  lng?: number;
}

const PRIVATE_KEYS = ['bankAccounts', 'contact', 'lat', 'lng'] as const;

/** Splits a parish payload into its public document and its private one. */
function splitAtbiya<T extends Partial<AtbiyaPrivate>>(
  data: T
): { publicPart: Omit<T, keyof AtbiyaPrivate>; privatePart: AtbiyaPrivate; hasPrivate: boolean } {
  const publicPart = { ...data } as Record<string, unknown>;
  const privatePart: AtbiyaPrivate = {};
  let hasPrivate = false;

  for (const key of PRIVATE_KEYS) {
    if (key in publicPart) {
      // `undefined` is not writable to Firestore and an absent key must stay
      // absent, so only a present value crosses over.
      if (publicPart[key] !== undefined) {
        (privatePart as Record<string, unknown>)[key] = publicPart[key];
        hasPrivate = true;
      }
      delete publicPart[key];
    }
  }

  return {
    publicPart: publicPart as Omit<T, keyof AtbiyaPrivate>,
    privatePart,
    hasPrivate,
  };
}

export interface Atbiya {
  id: string;
  /** Required — `orderBy('name')` silently drops documents without it. */
  name: string;
  nameAmharic?: string;
  level: 'Atbiya';
  /** The Diocese this congregation belongs to. */
  parentId?: string | null;
  /**
   * Optional Woreda (የወረዳ ሰበካ ጉባኤ ጽሕፈት ቤት) this congregation reports through.
   * A side-link rather than part of the parent chain: `parentId` stays on the
   * Diocese, so congregations recorded before Woredas existed are unaffected
   * and the field can be filled in as that data arrives.
   */
  woredaId?: string | null;
  address?: { en?: string; am?: string };
  cityEn?: string;
  cityAm?: string;
  bankAccounts?: AtbiyaBankAccount[];
  contact?: AtbiyaContact;
  /**
   * The map pin. Stored in `atbiyaPrivate` — see AtbiyaPrivate — but carried here
   * so the form and the map work with one parish object.
   *
   * Absent means "never pinned", which is what `atbiyaCoords` and `hasCoords`
   * test for. Deliberately NOT defaulted in `emptyAtbiya()`: 0,0 is a point in
   * the Gulf of Guinea, and a parish that looks pinned but is not is worse than
   * one that is honestly blank.
   */
  lat?: number;
  lng?: number;
  mapUrl?: string;
  photoUrl?: string;
  description?: string;
  /**
   * When the congregation was founded, as written in the church register —
   * an Ethiopian-calendar date such as 'ነሐሴ 25/2008 ዓ.ም.'. Kept as free text
   * rather than a Date because that is how the register records it, and some
   * entries give only a month and year.
   */
  foundedAt?: string;
  /** MISSING means true — legacy parish docs have no such field. */
  active?: boolean;
  /** MISSING means true. Controls appearance in the public sign-up dropdown. */
  isPublic?: boolean;
}

export type AtbiyaInput = Omit<Atbiya, 'id' | 'level'>;

export const emptyAtbiya = (): AtbiyaInput => ({
  name: '',
  nameAmharic: '',
  parentId: null,
  woredaId: null,
  address: { en: '', am: '' },
  cityEn: '',
  cityAm: '',
  bankAccounts: [],
  contact: { nameEn: '', nameAm: '', phone: '', phone2: '', email: '' },
  mapUrl: '',
  photoUrl: '',
  description: '',
  foundedAt: '',
  active: true,
  isPublic: true,
  // No lat/lng: absent is what "unpinned" means. See the note on Atbiya.lat.
});

/**
 * The pin, or null when this congregation has never been placed on the map.
 * Mirrors `mahderCoords` in services/mahderat.ts.
 */
export function atbiyaCoords(a: Pick<Atbiya, 'lat' | 'lng'>): LatLng | null {
  return hasCoords({ lat: a.lat, lng: a.lng }) ? { lat: a.lat!, lng: a.lng! } : null;
}

export const hierarchyService = {
  // Get all entities by level
  getEntitiesByLevel: async (level: string) => {
    const q = query(collection(db, 'hierarchy'), where('level', '==', level), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Get entities by parent
  getEntitiesByParent: async (parentId: string) => {
    const q = query(collection(db, 'hierarchy'), where('parentId', '==', parentId), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Create new entity
  createEntity: async (entityData: {
    name: string;
    nameAmharic: string;
    level: string;
    parentId?: string | null;
    location?: string;
    description?: string;
  }) => {
    const docRef = await addDoc(collection(db, 'hierarchy'), {
      ...entityData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: docRef.id, ...entityData };
  },

  // Update entity
  updateEntity: async (id: string, entityData: any) => {
    const docRef = doc(db, 'hierarchy', id);
    await updateDoc(docRef, { ...entityData, updatedAt: serverTimestamp() });
    const updated = await getDoc(docRef);
    return { id: updated.id, ...updated.data() };
  },

  // Delete entity
  deleteEntity: async (id: string) => {
    await deleteDoc(doc(db, 'hierarchy', id));
  },

  // Get hierarchy tree
  getTree: async () => {
    const snapshot = await getDocs(collection(db, 'hierarchy'));
    const allEntities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Simple tree builder - assuming parent-child relationship
    const buildTree = (parentId: string | null = null): any[] => {
      return allEntities
        .filter((e: any) => e.parentId === parentId)
        .map((e: any) => ({
          ...e,
          children: buildTree(e.id),
        }));
    };

    return buildTree(null);
  },

  // ── Atbiya registry ───────────────────────────────────────────────────────

  /**
   * Every parish, including deactivated ones. `active` is filtered in memory
   * on purpose: a `where('active','==',true)` clause would silently exclude
   * every parish record created before the field existed.
   */
  getAtbiyas: async (includeInactive = false): Promise<Atbiya[]> => {
    const q = query(
      collection(db, 'hierarchy'),
      where('level', '==', 'Atbiya'),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Atbiya[];
    return includeInactive ? all : all.filter((a) => a.active !== false);
  },

  /**
   * Parishes offered on the public sign-up form. This query runs
   * UNAUTHENTICATED — the `where('level','==','Atbiya')` equality filter is
   * what makes it provable against the Firestore rule, so do not remove it and
   * do not switch this to `getTree()`.
   */
  getPublicAtbiyas: async (): Promise<Atbiya[]> => {
    const all = await hierarchyService.getAtbiyas();
    return all.filter((a) => a.isPublic !== false);
  },

  /**
   * Every parish WITH its bank accounts and contacts rejoined.
   *
   * Reading `atbiyaPrivate` as a collection needs global scope or the parish
   * registry permission, which is exactly who the registry page is for. For
   * anyone else the list is denied and the parishes come back with their public
   * fields only — the page still works, it just shows less.
   */
  getAtbiyasWithPrivate: async (includeInactive = false): Promise<Atbiya[]> => {
    const [all, priv] = await Promise.all([
      hierarchyService.getAtbiyas(includeInactive),
      hierarchyService.getAtbiyaPrivateMap(),
    ]);
    return all.map((a) => ({ ...a, ...(priv.byId.get(a.id) ?? {}) }));
  },

  /**
   * Private parish fields keyed by parish id.
   *
   * Returns an empty map rather than throwing when the caller may not read the
   * collection, so a merge site never has to care whether it is head office or a
   * single parish. `denied` is what stops that convenience becoming a lie: without
   * it, "no parish has been pinned" and "you cannot see the pins" are the same
   * empty map, and the church map would report an empty registry to anyone whose
   * read was refused.
   */
  getAtbiyaPrivateMap: async (): Promise<{
    byId: Map<string, AtbiyaPrivate>;
    denied: boolean;
  }> => {
    try {
      const snap = await getDocs(collection(db, 'atbiyaPrivate'));
      return {
        byId: new Map(snap.docs.map((d) => [d.id, d.data() as AtbiyaPrivate])),
        denied: false,
      };
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      return { byId: new Map(), denied: code === 'permission-denied' };
    }
  },

  getAtbiyaById: async (id: string): Promise<Atbiya | null> => {
    const snap = await getDoc(doc(db, 'hierarchy', id));
    if (!snap.exists()) return null;

    // Denied for a parish asking about someone else's record, and for anonymous
    // traffic. Both are legitimate reads of the public half, so the failure is
    // absorbed rather than surfaced.
    let priv: AtbiyaPrivate = {};
    try {
      const privSnap = await getDoc(doc(db, 'atbiyaPrivate', id));
      if (privSnap.exists()) priv = privSnap.data() as AtbiyaPrivate;
    } catch { /* public half only */ }

    return { id: snap.id, ...snap.data(), ...priv } as Atbiya;
  },

  createAtbiya: async (data: AtbiyaInput): Promise<Atbiya> => {
    const { publicPart, privatePart, hasPrivate } = splitAtbiya(data);
    const payload = { ...publicPart, level: 'Atbiya' as const };

    // The id is generated client-side rather than by addDoc so both documents
    // can be written in one batch — a parish must never exist with its bank
    // details stranded, or vice versa.
    const ref = doc(collection(db, 'hierarchy'));
    const batch = writeBatch(db);
    batch.set(ref, { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    if (hasPrivate) {
      batch.set(doc(db, 'atbiyaPrivate', ref.id), { ...privatePart, updatedAt: serverTimestamp() });
    }
    await batch.commit();

    auditLogService.dataChange('create', 'hierarchy', ref.id, `Registered parish ${data.name}`);
    return { id: ref.id, ...payload, ...privatePart } as Atbiya;
  },

  updateAtbiya: async (id: string, data: Partial<AtbiyaInput>): Promise<void> => {
    const { publicPart, privatePart, hasPrivate } = splitAtbiya(data);

    const batch = writeBatch(db);
    batch.update(doc(db, 'hierarchy', id), { ...publicPart, updatedAt: serverTimestamp() });
    if (hasPrivate) {
      // merge, so an edit that touches only the contact block does not blank the
      // bank accounts. Arrays are replaced wholesale, which is what removing a
      // bank account needs.
      batch.set(
        doc(db, 'atbiyaPrivate', id),
        { ...privatePart, updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
    await batch.commit();

    auditLogService.dataChange('update', 'hierarchy', id, `Updated parish ${data.name ?? id}`);
  },

  /**
   * Deactivates rather than deletes — `users.atbiyaId` and `news.atbiyaId`
   * reference these ids, and removing the document would orphan them.
   */
  deactivateAtbiya: async (id: string, active: boolean): Promise<void> => {
    await updateDoc(doc(db, 'hierarchy', id), { active, updatedAt: serverTimestamp() });
    auditLogService.dataChange('update', 'hierarchy', id, `${active ? 'Reactivated' : 'Deactivated'} parish`);
  },
};
