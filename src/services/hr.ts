import { db } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';

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
    return ref.id;
  },

  async update(id: string, data: Partial<EmployeeInput>): Promise<void> {
    await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
  },

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};
