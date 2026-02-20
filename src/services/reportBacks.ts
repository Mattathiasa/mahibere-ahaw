import { api } from './api';

export interface CreateReportBackData {
  planId: string;
  reportId: string;
}

export interface AddReportBackCommentData {
  content: string;
}

export const reportBackService = {
  async getAllReportBacks() {
    const response = await api.get('/api/report-backs');
    return response.data;
  },

  async getReportBackById(id: string) {
    const response = await api.get(`/api/report-backs/${id}`);
    return response.data;
  },

  async createReportBack(data: CreateReportBackData) {
    const response = await api.post('/api/report-backs', data);
    return response.data;
  },

  async addComment(reportBackId: string, data: AddReportBackCommentData) {
    const response = await api.post(`/api/report-backs/${reportBackId}/comments`, data);
    return response.data;
  },
};
