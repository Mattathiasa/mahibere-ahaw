import { api } from './api';

export interface CreateAnnouncementData {
  title: string;
  content: string;
  expiresAt?: string;
}

export const announcementService = {
  async getAnnouncements() {
    const response = await api.get('/api/announcements');
    return response.data;
  },

  async getAnnouncementById(id: string) {
    const response = await api.get(`/api/announcements/${id}`);
    return response.data;
  },

  async createAnnouncement(data: CreateAnnouncementData) {
    const response = await api.post('/api/announcements', data);
    return response.data;
  },

  async getActiveAnnouncements() {
    const response = await api.get('/api/announcements/active');
    return response.data;
  },

  async markAsRead(id: string) {
    const response = await api.put(`/api/announcements/${id}/read`);
    return response.data;
  },

  async updateAnnouncement(id: string, data: CreateAnnouncementData) {
    const response = await api.put(`/api/announcements/${id}`, data);
    return response.data;
  },

  async deleteAnnouncement(id: string) {
    const response = await api.delete(`/api/announcements/${id}`);
    return response.data;
  },
};
