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
import {
  FinanceTransaction,
  MonthlyBudget,
  FinancialReport,
  FinanceTransactionInput,
  MonthlyBudgetInput,
  FinancialReportInput,
} from '@/types';

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
  throw new Error('Transaction not found');
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
  // Use createdAt to avoid needing a composite index on year+month
  let q = query(collection(db, 'finance_budgets'), orderBy('createdAt', 'desc'));

  if (params?.mahderatId) q = query(q, where('mahderatId', '==', params.mahderatId));
  if (params?.atbiyaId) q = query(q, where('atbiyaId', '==', params.atbiyaId));

  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

  // Apply year/month filters client-side
  if (params?.year) results = results.filter((b: any) => b.year === params.year);
  if (params?.month) results = results.filter((b: any) => b.month === params.month);

  return results;
};

export const getBudgetById = async (id: string): Promise<MonthlyBudget> => {
  const docSnap = await getDoc(doc(db, 'finance_budgets', id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as any;
  throw new Error('Budget not found');
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

export const getFinancialReportById = async (id: string): Promise<FinancialReport> => {
  const docSnap = await getDoc(doc(db, 'finance_reports', id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as any;
  throw new Error('Report not found');
};

export const updateFinancialReport = async (id: string, data: Partial<FinancialReportInput>): Promise<FinancialReport> => {
  const docRef = doc(db, 'finance_reports', id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as any;
};

export const deleteFinancialReport = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'finance_reports', id));
};
