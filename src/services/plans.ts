import { api } from './api';

export interface CreatePlanData {
  name: string;
  timeframe: 'Weekly' | 'Monthly' | 'Annually';
  details: string;
}

export interface UpdatePlanData {
  name?: string;
  timeframe?: 'Weekly' | 'Monthly' | 'Annually';
  details?: string;
}

export const planService = {
  async getAllPlans(timeframe?: string) {
    const params = timeframe ? { timeframe } : {};
    const response = await api.get('/api/plans', { params });
    return response.data;
  },

  async getPlanById(id: string) {
    const response = await api.get(`/api/plans/${id}`);
    return response.data;
  },

  async createPlan(data: CreatePlanData) {
    const response = await api.post('/api/plans', data);
    return response.data;
  },

  async updatePlan(id: string, data: UpdatePlanData) {
    const response = await api.put(`/api/plans/${id}`, data);
    return response.data;
  },

  async deletePlan(id: string) {
    const response = await api.delete(`/api/plans/${id}`);
    return response.data;
  },

  async addComment(planId: string, data: { content: string }) {
    const response = await api.post(`/api/plans/${planId}/comments`, data);
    return response.data;
  },
};
