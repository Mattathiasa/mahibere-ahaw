import { api } from './api';
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
  const response = await api.post('/finance/transactions', data);
  return response.data;
};

export const getTransactions = async (params?: {
  userId?: string;
  mahderatId?: string;
  atbiyaId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}): Promise<FinanceTransaction[]> => {
  const response = await api.get('/finance/transactions', { params });
  return response.data;
};

export const getTransactionById = async (id: string): Promise<FinanceTransaction> => {
  const response = await api.get(`/finance/transactions/${id}`);
  return response.data;
};

export const updateTransaction = async (id: string, data: Partial<FinanceTransactionInput>): Promise<FinanceTransaction> => {
  const response = await api.put(`/finance/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await api.delete(`/finance/transactions/${id}`);
};

// Monthly Budgets
export const createBudget = async (data: MonthlyBudgetInput): Promise<MonthlyBudget> => {
  const response = await api.post('/finance/budgets', data);
  return response.data;
};

export const getBudgets = async (params?: {
  userId?: string;
  mahderatId?: string;
  atbiyaId?: string;
  year?: number;
  month?: number;
}): Promise<MonthlyBudget[]> => {
  const response = await api.get('/finance/budgets', { params });
  return response.data;
};

export const getBudgetById = async (id: string): Promise<MonthlyBudget> => {
  const response = await api.get(`/finance/budgets/${id}`);
  return response.data;
};

export const updateBudget = async (id: string, data: Partial<MonthlyBudgetInput>): Promise<MonthlyBudget> => {
  const response = await api.put(`/finance/budgets/${id}`, data);
  return response.data;
};

export const deleteBudget = async (id: string): Promise<void> => {
  await api.delete(`/finance/budgets/${id}`);
};

// Financial Reports
export const createFinancialReport = async (data: FinancialReportInput): Promise<FinancialReport> => {
  const response = await api.post('/finance/reports', data);
  return response.data;
};

export const getFinancialReports = async (params?: {
  mahderatId?: string;
  atbiyaId?: string;
  reportType?: string;
}): Promise<FinancialReport[]> => {
  const response = await api.get('/finance/reports', { params });
  return response.data;
};

export const getFinancialReportById = async (id: string): Promise<FinancialReport> => {
  const response = await api.get(`/finance/reports/${id}`);
  return response.data;
};

export const updateFinancialReport = async (id: string, data: Partial<FinancialReportInput>): Promise<FinancialReport> => {
  const response = await api.put(`/finance/reports/${id}`, data);
  return response.data;
};

export const deleteFinancialReport = async (id: string): Promise<void> => {
  await api.delete(`/finance/reports/${id}`);
};
