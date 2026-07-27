import { db } from '@/lib/firebase';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { auditLogService } from '@/services/auditLog';

export interface EducationItem {
  id?: string;
  academicStatus?: string;
  institution?: string;
  fieldOfStudy?: string;
  graduationDate?: string;
  cvDocumentUrl?: string;
}

export interface Employee {
  id: string;
  employeeId?: string; // e.g. EMP-001 or MA-EMP-102
  fullName: string;
  position: string;
  department: string;
  /** Distinguishes clergy from lay staff (kept separate from general members). */
  category: 'Priest' | 'Staff';
  /** Structure node id this employee holds a position in (church hierarchy). */
  structureId?: string;
  /** Human-readable structure path (denormalised for display). */
  structurePath?: string;
  employmentType: 'FullTime' | 'PartTime' | 'Contract' | 'Volunteer';
  salary?: number;
  hireDate?: string;
  phone?: string;
  email?: string;
  status: 'Active' | 'OnLeave' | 'Terminated' | 'Inactive';
  notes?: string;

  // 1. Employer Info
  employerName?: string;
  employerLocation?: string;
  employerHouseNumber?: string;
  employerPhone?: string;

  // 2. Personal Info
  gender?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  address?: string;

  // 3. Family Info
  spouseName?: string;
  spousePhone?: string;
  childrenCount?: number;

  // 4. Education Background
  educationBackground?: EducationItem[];

  // 5. Job Details
  haveWorkExperience?: boolean;

  // 6. Bank and TIN (Payroll Details)
  salaryBankName?: string;
  salaryBankAccount?: string;
  pfBankName?: string;
  pfBankAccount?: string;
  socialId?: string;
  tin?: string;
  grossSalary?: number;
  overtime?: number;
  transportAllowance?: number;
  houseAllowance?: number;
  communicationAllowance?: number;
  bonus?: number;
  tax?: number; // Income tax
  pension?: number; // Pension deduction (e.g. 7%)
  providentFund?: number;
  credit?: number;
  penalty?: number;
  deduction?: number; // Total deductions
  benefit?: number; // Total benefits/allowances
  netSalary?: number; // Calculated net salary

  // 7. Emergency Contact
  emergencySalutation?: string;
  emergencyFirstName?: string;
  emergencyMiddleName?: string;
  emergencyLastName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  emergencyAddress?: string;

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
