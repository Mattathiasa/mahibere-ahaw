import { api } from './api';
import { Notification } from '@/types';

export const notificationService = {
  // Get notifications for current user
  async getNotifications(options?: {
    status?: 'unread' | 'read' | 'archived';
    limit?: number;
    skip?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.skip) params.append('skip', options.skip.toString());

    const response = await api.get(`/notifications?${params.toString()}`);
    return response.data;
  },

  // Get unread notification count
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  async deleteNotification(notificationId: string) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};