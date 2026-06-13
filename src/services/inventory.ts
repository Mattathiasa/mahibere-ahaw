import { db } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';

export interface Asset {
  id: string;
  name: string;
  category: string;
  quantity: number;
  location: string;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  status: 'InUse' | 'InStorage' | 'Maintenance' | 'Retired';
  value?: number;
  purchaseDate?: string;
  assignedTo?: string;
  notes?: string;
  createdAt?: unknown;
}

export type AssetInput = Omit<Asset, 'id' | 'createdAt'>;

const COLLECTION = 'assets';

export const inventoryService = {
  async getAll(): Promise<Asset[]> {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Asset, 'id'>) }));
  },

  async create(data: AssetInput): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'assets', ref.id, `Added asset ${data.name}`);
    return ref.id;
  },

  async update(id: string, data: Partial<AssetInput>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
    auditLogService.dataChange('update', 'assets', id, `Updated asset ${data.name ?? id}`);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
    auditLogService.dataChange('delete', 'assets', id, `Removed asset ${id}`);
  },
};
