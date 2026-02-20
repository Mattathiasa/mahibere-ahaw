import { api } from './api';

export const hierarchyService = {
  // Get all entities by level
  getEntitiesByLevel: async (level: string) => {
    const response = await api.get(`/api/hierarchy/level/${level}`);
    return response.data;
  },

  // Get entities by parent
  getEntitiesByParent: async (parentId: string) => {
    const response = await api.get(`/api/hierarchy/parent/${parentId}`);
    return response.data;
  },

  // Create new entity
  createEntity: async (entityData: {
    name: string;
    nameAmharic: string;
    level: string;
    parentId?: string | null;
    location?: string;
    description?: string;
  }) => {
    const response = await api.post('/api/hierarchy', entityData);
    return response.data;
  },

  // Update entity
  updateEntity: async (id: string, entityData: any) => {
    const response = await api.put(`/api/hierarchy/${id}`, entityData);
    return response.data;
  },

  // Delete entity
  deleteEntity: async (id: string) => {
    const response = await api.delete(`/api/hierarchy/${id}`);
    return response.data;
  },

  // Get hierarchy tree
  getTree: async () => {
    const response = await api.get('/api/hierarchy/tree');
    return response.data;
  },
};
