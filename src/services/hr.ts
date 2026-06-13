import { db } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  department: string;
  employmentType: 'FullTime' | 'PartTime' | 'Contract' | 'Volunteer';
  salary?: number;
  hireDate?: string;
  phone?: string;
  email?: string;
  status: 'Active' | 'OnLeave' | 'Terminated';
  notes?: string;
  createdAt?: unknown;
}

export type EmployeeInput = Omit<Employee, 'id' | 'createdAt'>;

const COLLECTION = 'employees';

export const hrService = {
  async getAll(): Promise<Employee[]> {
    const q = query(collection(db, COLLECTION), orderBy('fullName'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Employee, 'id'>) }));
  },

  async create(data: EmployeeInput): Promise<string> {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditLogService.dataChange('create', 'employees', ref.id, `Added employee ${data.fullName}`);
    return ref.id;
  },

  async update(id: string, data: Partial<EmployeeInput>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
    auditLogService.dataChange('update', 'employees', id, `Updated employee ${data.fullName ?? id}`);
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
    auditLogService.dataChange('delete', 'employees', id, `Removed employee ${id}`);
  },
};
