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
  serverTimestamp
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';

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
});

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

  getAtbiyaById: async (id: string): Promise<Atbiya | null> => {
    const snap = await getDoc(doc(db, 'hierarchy', id));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Atbiya) : null;
  },

  createAtbiya: async (data: AtbiyaInput): Promise<Atbiya> => {
    const payload = { ...data, level: 'Atbiya' as const };
    const docRef = await addDoc(collection(db, 'hierarchy'), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'hierarchy', docRef.id, `Registered parish ${data.name}`);
    return { id: docRef.id, ...payload };
  },

  updateAtbiya: async (id: string, data: Partial<AtbiyaInput>): Promise<void> => {
    await updateDoc(doc(db, 'hierarchy', id), { ...data, updatedAt: serverTimestamp() });
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
