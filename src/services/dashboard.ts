import { api } from './api';

export interface DashboardStats {
  totalMembers: number;
  activeAnnouncements: number;
  pendingReports: number;
  upcomingMeetings: number;
}

export interface DashboardData {
  user: any;
  stats: DashboardStats;
  recentAnnouncements: any[];
  recentReports: any[];
  upcomingMeetings: any[];
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/api/dashboard/data');
    return response.data;
  },
};
