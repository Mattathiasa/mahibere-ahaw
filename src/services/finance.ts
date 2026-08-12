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
import { auditLogService } from '@/services/auditLog';

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
  // Every money path is audited. The whole finance module used to mutate
  // silently: there was no record of who entered, altered or deleted a
  // transaction, which is the one place a trail is not optional.
  auditLogService.dataChange(
    'create', 'finance_transactions', docRef.id,
    `Recorded ${data.type} of ${data.amount} (${data.category})`
  );
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
  auditLogService.dataChange(
    'update', 'finance_transactions', id,
    `Amended transaction${data.amount !== undefined ? ` amount to ${data.amount}` : ''}`
  );
  const updated = await getDoc(docRef);
  return { id: updated.id, ...updated.data() } as any;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'finance_transactions', id));
  auditLogService.dataChange('delete', 'finance_transactions', id, 'Deleted a transaction');
};

// Monthly Budgets
export const createBudget = async (data: MonthlyBudgetInput): Promise<MonthlyBudget> => {
  const docRef = await addDoc(collection(db, 'finance_budgets'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  auditLogService.dataChange(
    'create', 'finance_budgets', docRef.id,
    `Created budget for ${data.month}/${data.year}`
  );
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
  auditLogService.dataChange('delete', 'finance_budgets', id, 'Deleted a budget');
};

// Financial Reports
export const createFinancialReport = async (data: FinancialReportInput): Promise<FinancialReport> => {
  const docRef = await addDoc(collection(db, 'finance_reports'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  auditLogService.dataChange(
    'create', 'finance_reports', docRef.id, `Generated financial report "${data.title}"`
  );
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

/**
 * Reads a collection, distinguishing "you may not" from "there is nothing".
 *
 * These getters used to `catch { return [] }`, which meant a permission denial and
 * an empty church looked identical: the Tithes and Pledges tabs rendered blank for
 * years while the rules denied them outright (there was no rule for either
 * collection at all). A denial is now re-thrown so the caller can say so, and only
 * a genuinely missing index or offline read yields an empty list.
 */
async function readOrThrowDenied<T>(q: any, label: string): Promise<T[]> {
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) } as T)
    );
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    if (code === 'permission-denied') throw err;
    console.warn(`[finance] could not read ${label}`, err);
    return [];
  }
}

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

export const getMemberTithes = async (): Promise<MemberTithe[]> =>
  readOrThrowDenied<MemberTithe>(
    query(collection(db, 'finance_tithes'), orderBy('createdAt', 'desc')),
    'tithes'
  );

// Pledges Campaign Services
export const createPledge = async (data: Omit<BuildingPledge, 'id'>): Promise<BuildingPledge> => {
  const docRef = await addDoc(collection(db, 'finance_pledges'), {
    ...data,
    ethiopianDate: data.ethiopianDate || toEthiopianDateString(),
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
};

export const getPledges = async (): Promise<BuildingPledge[]> =>
  readOrThrowDenied<BuildingPledge>(
    query(collection(db, 'finance_pledges'), orderBy('createdAt', 'desc')),
    'pledges'
  );

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

export const getRequisitions = async (): Promise<RequisitionVoucher[]> =>
  readOrThrowDenied<RequisitionVoucher>(
    query(collection(db, 'finance_requisitions'), orderBy('createdAt', 'desc')),
    'requisitions'
  );

export const updateRequisitionStatus = async (id: string, status: RequisitionVoucher['status'], approvedBy?: string): Promise<void> => {
  const docRef = doc(db, 'finance_requisitions', id);
  await updateDoc(docRef, {
    status,
    ...(approvedBy ? { approvedBy } : {}),
  });
  auditLogService.dataChange('update', 'finance_requisitions', id, `Voucher marked ${status}`);
};

// Church Bank Accounts
//
// DEFAULT_CHURCH_BANKS used to live here: three fabricated account numbers with
// fabricated balances, rendered on the Finance page as the church's own accounts.
// Invented banking details shown as real are a liability, not a placeholder.
//
// Per-congregation bank details are real data and live in
// atbiyaPrivate/{atbiyaId} — see the AtbiyaBankAccount type in
// services/hierarchy.ts. Anything rebuilt here should read from there.
