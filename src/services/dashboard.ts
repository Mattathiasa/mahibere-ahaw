import { db } from '@/lib/firebase';
import {
  collection, getDocs, getCountFromServer, query, limit, orderBy, where,
} from 'firebase/firestore';

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
  /** Collections the signed-in account may not read. See `blocked` below. */
  blocked: string[];
}

/** How many recent items each list shows. Deliberately NOT used for the counts. */
const RECENT_LIMIT = 5;

/**
 * The scope a dashboard is drawn for. Mirrors `hasWideDirectoryScope()` in
 * firestore.rules — a parish account may only count its own congregation.
 */
export interface DashboardScope {
  wholeDirectory: boolean;
  atbiyaId?: string;
}

/**
 * A count, or null when the caller may not read the collection.
 *
 * `getCountFromServer` bills one read per 1000 documents, so a count costs
 * essentially nothing next to fetching the documents to measure `.size`.
 */
async function countOf(q: any): Promise<number | null> {
  try {
    return (await getCountFromServer(q)).data().count;
  } catch {
    return null;
  }
}

/** Documents, or null when the caller may not read them. */
async function listOf(q: any): Promise<any[] | null> {
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
  } catch {
    return null;
  }
}

export const dashboardService = {
  /**
   * Dashboard figures.
   *
   * Every stat used to be `snap.size` on a query carrying `limit(5)`, so
   * `activeAnnouncements`, `pendingReports` and `upcomingMeetings` read exactly
   * "5" forever once five existed — the numbers on the front page of the app were
   * simply wrong. `totalMembers` had the opposite problem: it fetched the ENTIRE
   * users collection on every dashboard load and counted pending, rejected and
   * suspended accounts as members.
   *
   * Counts now come from `getCountFromServer` on properly filtered queries, and
   * the lists keep their own limit. The two concerns were conflated in one query.
   *
   * Anything the caller may not read comes back as a null count and is named in
   * `blocked`, so the UI can say "not available to you" rather than draw a
   * confident zero — a permission mistake used to be indistinguishable from an
   * empty church.
   */
  async getDashboardData(scope: DashboardScope): Promise<DashboardData> {
    const now = new Date().toISOString();

    // Members are scoped: an unfiltered count is denied for a parish account, and
    // an equality filter on atbiyaId is what makes the query provable.
    const membersQuery = scope.wholeDirectory
      ? query(collection(db, 'users'), where('status', '==', 'active'))
      : scope.atbiyaId
        ? query(
            collection(db, 'users'),
            where('atbiyaId', '==', scope.atbiyaId),
            where('status', '==', 'active')
          )
        : null;

    const upcomingMeetingsQuery = query(
      collection(db, 'meetings'),
      where('scheduledDate', '>=', now)
    );

    const [
      totalMembers,
      activeAnnouncements,
      pendingReports,
      upcomingMeetingsCount,
      recentAnnouncements,
      recentReports,
      upcomingMeetings,
    ] = await Promise.all([
      membersQuery ? countOf(membersQuery) : Promise.resolve(0),
      countOf(query(collection(db, 'announcements'), where('expiresAt', '>', now))),
      countOf(query(collection(db, 'reports'), where('status', '==', 'pending'))),
      countOf(upcomingMeetingsQuery),
      listOf(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(RECENT_LIMIT))),
      listOf(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(RECENT_LIMIT))),
      listOf(query(collection(db, 'meetings'), where('scheduledDate', '>=', now), orderBy('scheduledDate', 'asc'), limit(RECENT_LIMIT))),
    ]);

    const blocked: string[] = [];
    if (totalMembers === null) blocked.push('members');
    if (activeAnnouncements === null) blocked.push('announcements');
    if (pendingReports === null || recentReports === null) blocked.push('reports');
    if (upcomingMeetingsCount === null) blocked.push('meetings');

    return {
      user: null,
      stats: {
        totalMembers: totalMembers ?? 0,
        activeAnnouncements: activeAnnouncements ?? 0,
        pendingReports: pendingReports ?? 0,
        upcomingMeetings: upcomingMeetingsCount ?? 0,
      },
      recentAnnouncements: recentAnnouncements ?? [],
      recentReports: recentReports ?? [],
      upcomingMeetings: upcomingMeetings ?? [],
      blocked,
    };
  },
};
