import { api } from './api';

export interface CreateUserData {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  address: {
    region: string;
    zone: string;
    woreda: string;
  };
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  ministryType: string;
  hierarchyLevel: string;
  hierarchyEntityId: string;
}

export interface UpdateUserData {
  fullName?: string;
  fullNameAmharic?: string;
  phone?: string;
  address?: {
    region: string;
    zone: string;
    woreda: string;
  };
  dateOfBirth?: string;
  gender?: 'Male' | 'Female';
  ministryType?: string;
  hierarchyLevel?: string;
  hierarchyEntityId?: string;
  profilePicture?: string;
  atbiyaId?: string;
  mahderatId?: string;
}

export const userService = {
  async getAllUsers() {
    const response = await api.get('/api/users');
    return response.data;
  },

  async createUser(userData: CreateUserData) {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  async updateUser(id: string, userData: UpdateUserData) {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  async deleteUser(id: string) {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  async getAuditLogs(limit = 50) {
    const response = await api.get(`/api/users/audit-logs?limit=${limit}`);
    return response.data;
  },

  async getUserById(id: string) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  async getUsersByHierarchyLevel(hierarchyLevel?: string) {
    const params = hierarchyLevel ? `?hierarchyLevel=${hierarchyLevel}` : '';
    const response = await api.get(`/api/users/by-hierarchy${params}`);
    return response.data;
  },
};
