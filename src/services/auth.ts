import { api } from './api';
import { User, LoginCredentials, AuthResponse } from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    
    // Store token and user
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ user: User }>('/api/auth/me');
    // Update stored user with fresh data
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data.user;
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getStoredUser();
    return !!(token && user);
  },

  clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/api/auth/change-password', data);
  },
};
