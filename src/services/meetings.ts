import { api } from './api';

export interface CreateMeetingData {
  title: string;
  description: string;
  scheduledDate: string;
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  scheduledDate?: string;
}

export const meetingService = {
  async getAllMeetings() {
    const response = await api.get('/api/meetings');
    return response.data;
  },

  async getMeetingById(id: string) {
    const response = await api.get(`/api/meetings/${id}`);
    return response.data;
  },

  async createMeeting(data: CreateMeetingData) {
    const response = await api.post('/api/meetings', data);
    return response.data;
  },

  async updateMeeting(id: string, data: UpdateMeetingData) {
    const response = await api.put(`/api/meetings/${id}`, data);
    return response.data;
  },

  async deleteMeeting(id: string) {
    const response = await api.delete(`/api/meetings/${id}`);
    return response.data;
  },
};
