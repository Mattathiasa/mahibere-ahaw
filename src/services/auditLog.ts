import { db, auth } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, query, orderBy, limit as fbLimit,
  serverTimestamp, where, Timestamp,
} from 'firebase/firestore';

// ─── Audit trail: logins, logouts, and data manipulations ────────────────────
// Written to the `auditLogs` collection by both the web and mobile apps and
// viewed from Software Control → Audit Logs.

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create'
  | 'update'
  | 'delete';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  hierarchyLevel?: string;
  action: AuditAction;
  /** Collection / module affected, e.g. "employees", "auth". */
  targetType?: string;
  /** Document id affected, when applicable. */
  targetId?: string;
  /** Human-readable summary, e.g. "Added employee Abebe Kebede". */
  description?: string;
  platform?: string; // web | android | ios
  device?: string;   // browser / device descriptor
  createdAt?: Timestamp | null;
}

const COLLECTION = 'auditLogs';

/** Best-effort browser/device descriptor from the user agent. */
function describeBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  let os = 'Unknown OS';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  return `${browser} · ${os}`;
}

interface LogInput {
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  description?: string;
  /** Override the actor (used when logging logout after sign-out). */
  actor?: { id: string; name?: string; email?: string; hierarchyLevel?: string };
}

export const auditLogService = {
  /** Fire-and-forget; auditing must never break the user's action. */
  async log(input: LogInput): Promise<void> {
    try {
      let cached: { id?: string; fullName?: string; fullNameEnglish?: string; email?: string; hierarchyLevel?: string } = {};
      try {
        cached = JSON.parse(localStorage.getItem('user') || '{}');
      } catch { /* ignore */ }

      const fbUser = auth.currentUser;
      const actor = input.actor ?? {
        id: fbUser?.uid ?? cached.id ?? 'unknown',
        name: cached.fullNameEnglish ?? cached.fullName,
        email: fbUser?.email ?? cached.email,
        hierarchyLevel: cached.hierarchyLevel,
      };

      await addDoc(collection(db, COLLECTION), {
        userId: actor.id,
        userName: actor.name ?? null,
        userEmail: actor.email ?? null,
        hierarchyLevel: actor.hierarchyLevel ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        description: input.description ?? null,
        platform: 'web',
        device: describeBrowser(),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('[auditLog] failed to write entry', err);
    }
  },

  /** Convenience wrapper for data mutations. */
  dataChange(action: 'create' | 'update' | 'delete', targetType: string, targetId: string | undefined, description: string) {
    return this.log({ action, targetType, targetId, description });
  },

  async getRecent(max = 200, action?: AuditAction): Promise<AuditLogEntry[]> {
    const base = collection(db, COLLECTION);
    const q = action
      ? query(base, where('action', '==', action), orderBy('createdAt', 'desc'), fbLimit(max))
      : query(base, orderBy('createdAt', 'desc'), fbLimit(max));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLogEntry, 'id'>) }));
  },
};
