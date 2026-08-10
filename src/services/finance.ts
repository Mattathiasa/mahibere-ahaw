import { db } from '@/lib/firebase';
import { AppError } from '@/lib/appError';
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
import {
  FinanceTransaction,
  MonthlyBudget,
  FinancialReport,
  FinanceTransactionInput,
  MonthlyBudgetInput,
  FinancialReportInput,
} from '@/types';
import { toEthiopianDateString } from '@/lib/date-utils';

export interface MemberTithe {
  id: string;
  memberId?: string;
  memberName: string;
  type: 'Asrat (10%)' | 'Offering (መባ)' | 'First Fruit (በኵራት)' | 'Building Contribution';
  amount: number;
  paymentMethod: string;
  receiptNumber: string;
  date: string;
  ethiopianDate: string;
  notes?: string;
  createdAt?: any;
}

export interface BuildingPledge {
  id: string;
  memberId?: string;
  memberName: string;
  campaignTitle: string;
  pledgedAmount: number;
  paidAmount: number;
  status: 'Active' | 'Completed';
  dueDate: string;
  ethiopianDate: string;
}

export interface RequisitionVoucher {
  id: string;
  voucherNumber: string;
  requestedBy: string;
  department: string;
  purpose: string;
  amount: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  approvedBy?: string;
  date: string;
  ethiopianDate: string;
}

export interface ChurchBankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
}

// Finance Transactions
export const createTransaction = async (data: FinanceTransactionInput): Promise<FinanceTransaction> => {
  const docRef = await addDoc(collection(db, 'finance_transactions'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data } as any;
};

export const getTransactions = async (params?: {
  userId?: string;
  mahderatId?: string;
  atbiyaId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinanceTransaction[]> => {
  let q = query(collection(db, 'finance_transactions'), orderBy('createdAt', 'desc'));

  if (params?.userId) q = query(q, where('userId', '==', params.userId));
  if (params?.mahderatId) q = query(q, where('mahderatId', '==', params.mahderatId));
  if (params?.atbiyaId) q = query(q, where('atbiyaId', '==', params.atbiyaId));
  if (params?.type) q = query(q, where('type', '==', params.type));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

export const getTransactionById = async (id: string): Promise<FinanceTransaction> => {
  const docSnap = await getDoc(doc(db, 'finance_transactions', id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as any;
  throw new AppError('transactionNotFound');
};

export const updateTransaction = async (id: string, data: Partial<FinanceTransactionInput>): Promise<FinanceTransaction> => {
  const docRef = doc(db, 'finance_transactions', id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as any;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'finance_transactions', id));
};

// Monthly Budgets
export const createBudget = async (data: MonthlyBudgetInput): Promise<MonthlyBudget> => {
  const docRef = await addDoc(collection(db, 'finance_budgets'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data } as any;
};

export const getBudgets = async (params?: {
  userId?: string;
  mahderatId?: string;
  atbiyaId?: string;
  year?: number;
  month?: number;
}): Promise<MonthlyBudget[]> => {
  let q = query(collection(db, 'finance_budgets'), orderBy('createdAt', 'desc'));

  if (params?.mahderatId) q = query(q, where('mahderatId', '==', params.mahderatId));
  if (params?.atbiyaId) q = query(q, where('atbiyaId', '==', params.atbiyaId));

  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  if (params?.year) results = results.filter((b: any) => b.year === params.year);
  if (params?.month) results = results.filter((b: any) => b.month === params.month);

  return results;
};

export const getBudgetById = async (id: string): Promise<MonthlyBudget> => {
  const docSnap = await getDoc(doc(db, 'finance_budgets', id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as any;
  throw new AppError('budgetNotFound');
};

export const updateBudget = async (id: string, data: Partial<MonthlyBudgetInput>): Promise<MonthlyBudget> => {
  const docRef = doc(db, 'finance_budgets', id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as any;
};

export const deleteBudget = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'finance_budgets', id));
};

// Financial Reports
export const createFinancialReport = async (data: FinancialReportInput): Promise<FinancialReport> => {
  const docRef = await addDoc(collection(db, 'finance_reports'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data } as any;
};

export const getFinancialReports = async (params?: {
  mahderatId?: string;
  atbiyaId?: string;
  reportType?: string;
}): Promise<FinancialReport[]> => {
  let q = query(collection(db, 'finance_reports'), orderBy('createdAt', 'desc'));

  if (params?.mahderatId) q = query(q, where('mahderatId', '==', params.mahderatId));
  if (params?.atbiyaId) q = query(q, where('atbiyaId', '==', params.atbiyaId));
  if (params?.reportType) q = query(q, where('reportType', '==', params.reportType));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

// Member Tithes (አሥራትና መባ) Services
export const createMemberTithe = async (data: Omit<MemberTithe, 'id'>): Promise<MemberTithe> => {
  const docRef = await addDoc(collection(db, 'finance_tithes'), {
    ...data,
    ethiopianDate: data.ethiopianDate || toEthiopianDateString(data.date),
    createdAt: serverTimestamp(),
  });

  // Also mirror as income transaction
  await createTransaction({
    amount: data.amount,
    type: 'Tithe',
    category: data.type,
    description: `Tithe record from ${data.memberName} (${data.receiptNumber})`,
    date: data.date,
  });

  return { id: docRef.id, ...data };
};

export const getMemberTithes = async (): Promise<MemberTithe[]> => {
  try {
    const q = query(collection(db, 'finance_tithes'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
  } catch (err) {
    return [];
  }
};

// Pledges Campaign Services
export const createPledge = async (data: Omit<BuildingPledge, 'id'>): Promise<BuildingPledge> => {
  const docRef = await addDoc(collection(db, 'finance_pledges'), {
    ...data,
    ethiopianDate: data.ethiopianDate || toEthiopianDateString(),
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
};

export const getPledges = async (): Promise<BuildingPledge[]> => {
  try {
    const q = query(collection(db, 'finance_pledges'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
  } catch (err) {
    return [];
  }
};

export const updatePledgePayment = async (id: string, additionalAmount: number): Promise<void> => {
  const docRef = doc(db, 'finance_pledges', id);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const current = snap.data() as BuildingPledge;
    const newPaid = (current.paidAmount || 0) + additionalAmount;
    const newStatus = newPaid >= current.pledgedAmount ? 'Completed' : 'Active';
    await updateDoc(docRef, {
      paidAmount: newPaid,
      status: newStatus,
    });
  }
};

// Requisitions & Vouchers Services
export const createRequisitionVoucher = async (data: Omit<RequisitionVoucher, 'id' | 'voucherNumber'>): Promise<RequisitionVoucher> => {
  const voucherNumber = `VCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const docRef = await addDoc(collection(db, 'finance_requisitions'), {
    ...data,
    voucherNumber,
    ethiopianDate: data.ethiopianDate || toEthiopianDateString(data.date),
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, voucherNumber, ...data };
};

export const getRequisitions = async (): Promise<RequisitionVoucher[]> => {
  try {
    const q = query(collection(db, 'finance_requisitions'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
  } catch (err) {
    return [];
  }
};

export const updateRequisitionStatus = async (id: string, status: RequisitionVoucher['status'], approvedBy?: string): Promise<void> => {
  const docRef = doc(db, 'finance_requisitions', id);
  await updateDoc(docRef, {
    status,
    ...(approvedBy ? { approvedBy } : {}),
  });
};

// Church Bank Accounts
export const DEFAULT_CHURCH_BANKS: ChurchBankAccount[] = [
  { id: '1', bankName: 'Commercial Bank of Ethiopia (CBE)', accountNumber: '1000123456789', accountType: 'Main Church Account', balance: 185400, currency: 'ETB' },
  { id: '2', bankName: 'Awash Bank', accountNumber: '01320987654321', accountType: 'Building Fund Account', balance: 94200, currency: 'ETB' },
  { id: '3', bankName: 'Dashen Bank', accountNumber: '52891122334455', accountType: 'Charity & Welfare Account', balance: 32100, currency: 'ETB' },
];
