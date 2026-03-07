import { db } from '@/lib/firebase';
import { collection, getDocs, query, limit, orderBy, where } from 'firebase/firestore';

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

const safeQuery = async (q: any) => {
  try {
    const snap = await getDocs(q);
    return snap;
  } catch {
    return { docs: [], size: 0 };
  }
};

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    const now = new Date().toISOString();

    const [usersSnap, announcementsSnap, reportsSnap, meetingsSnap] = await Promise.all([
      safeQuery(collection(db, 'users')),
      safeQuery(query(collection(db, 'announcements'), limit(5), orderBy('createdAt', 'desc'))),
      safeQuery(query(collection(db, 'reports'), limit(5), orderBy('createdAt', 'desc'))),
      safeQuery(query(collection(db, 'meetings'), limit(5), orderBy('scheduledDate', 'asc'), where('scheduledDate', '>=', now))),
    ]);

    return {
      user: null,
      stats: {
        totalMembers: (usersSnap as any).size,
        activeAnnouncements: (announcementsSnap as any).size,
        pendingReports: (reportsSnap as any).size,
        upcomingMeetings: (meetingsSnap as any).size,
      },
      recentAnnouncements: (announcementsSnap as any).docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      recentReports: (reportsSnap as any).docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
      upcomingMeetings: (meetingsSnap as any).docs.map((doc: any) => ({ id: doc.id, ...doc.data() })),
    };
  },
};
