// Local type definitions (previously from @church-cms/shared)

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  userId: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface FinanceTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  mahderatId?: string;
  atbiyaId?: string;
}

export interface MonthlyBudget {
  id: string;
  month: string;
  year: number;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
}

export interface MonthlyBudgetInput {
  month: string;
  year: number;
  category: string;
  allocated: number;
  mahderatId?: string;
  atbiyaId?: string;
}

export interface FinancialReport {
  id: string;
  title: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  createdAt: string;
  createdBy: string;
}

export interface FinancialReportInput {
  title: string;
  period: string;
  reportType: string;
  mahderatId?: string;
  atbiyaId?: string;
}

export enum TeachingServiceType {
  SUNDAY_SCHOOL = 'SUNDAY_SCHOOL',
  BIBLE_STUDY = 'BIBLE_STUDY',
  YOUTH_SERVICE = 'YOUTH_SERVICE',
  PRAYER_MEETING = 'PRAYER_MEETING',
  SPECIAL_EVENT = 'SPECIAL_EVENT',
}

export enum TeachingStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Ethiopian regions constant
export const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Afar',
  'Amhara',
  'Benishangul-Gumuz',
  'Dire Dawa',
  'Gambela',
  'Harari',
  'Oromia',
  'Sidama',
  'Somali',
  'Southern Nations, Nationalities, and Peoples Region',
  'Tigray',
] as const;

export type EthiopianRegion = typeof ETHIOPIAN_REGIONS[number];
