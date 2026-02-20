import { api } from './api';

export interface Document {
    id: string;
    name: string;
    type: 'folder' | 'file';
    parentId: string | null;
    size?: string;
    fileType?: string;
    filePath?: string;
    createdAt: string;
}

export const documentService = {
    getDocuments: async (parentId: string | null = null) => {
        const response = await api.get('/api/documents', { params: { parentId } });
        return response.data; // { documents: [...] }
    },

    createFolder: async (name: string, parentId: string | null) => {
        const response = await api.post('/api/documents/folder', { name, parentId });
        return response.data;
    },

    uploadFile: async (file: File, parentId: string | null) => {
        const formData = new FormData();
        formData.append('file', file);
        if (parentId) formData.append('parentId', parentId);

        const response = await api.post('/api/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    deleteDocument: async (id: string) => {
        const response = await api.delete(`/api/documents/${id}`);
        return response.data;
    },
};
