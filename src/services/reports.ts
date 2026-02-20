import { api } from './api';

export interface CreateReportData {
  planId: string;
  option: 'Memriya' | 'Kifil' | 'Zerf';
  timeframe: 'Weekly' | 'Monthly' | 'Annually';
  workDone: string;
  result: string;
}

export interface AddCommentData {
  content: string;
}

export interface UpdateReportData {
  option?: 'Memriya' | 'Kifil' | 'Zerf';
  timeframe?: 'Weekly' | 'Monthly' | 'Annually';
  workDone?: string;
  result?: string;
}

export const reportService = {
  async getAllReports(planId?: string) {
    const params = planId ? { planId } : {};
    const response = await api.get('/api/reports', { params });
    return response.data;
  },

  async getReportById(id: string) {
    const response = await api.get(`/api/reports/${id}`);
    return response.data;
  },

  async createReport(data: CreateReportData) {
    const response = await api.post('/api/reports', data);
    return response.data;
  },

  async updateReport(id: string, data: UpdateReportData) {
    const response = await api.put(`/api/reports/${id}`, data);
    return response.data;
  },

  async addComment(reportId: string, data: AddCommentData) {
    const response = await api.post(`/api/reports/${reportId}/comments`, data);
    return response.data;
  },
};
