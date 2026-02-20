import { api } from './api';

export const memberService = {
  async getAllMembers() {
    const response = await api.get('/api/users');
    return response.data;
  },

  async getMemberById(id: string) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  async getMembersByHierarchy(entityId: string) {
    const response = await api.get(`/api/users/hierarchy/${entityId}`);
    return response.data;
  },

  async getTotalMemberCount() {
    const response = await api.get('/api/users/count');
    return response.data;
  },
};
