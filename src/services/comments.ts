import { auth, db } from '@/lib/firebase';
import {
  addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs,
  query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import { AppError } from '@/lib/appError';
import { auditLogService } from '@/services/auditLog';

const COLLECTION = 'comments';

/** Mirrors the bounds in firestore.rules, which is what actually enforces them. */
export const COMMENT_MIN = 2;
export const COMMENT_MAX = 1000;

export type CommentTargetType = 'news' | 'sermon';
export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  /** 'news' targets are keyed by slug, 'sermon' targets by the `teachings` doc id. */
  targetType: CommentTargetType;
  targetId: string;
  text: string;
  authorUid: string;
  authorName: string;
  status: CommentStatus;
  createdAt?: { seconds: number; nanoseconds: number };
  reviewedBy?: string;
  reviewedAt?: string;
}

/**
 * Newest first. Sorted here rather than with orderBy so the queries stay
 * equality-only and need no composite index deployed alongside the rules —
 * the same trade sermonService.listPublished makes.
 */
const newestFirst = (a: Comment, b: Comment) =>
  (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0);

const toComment = (d: { id: string; data: () => unknown }) =>
  ({ id: d.id, ...(d.data() as object) }) as Comment;

export const commentService = {
  /** Public. The rules only let a status == 'approved' query through. */
  async listApproved(targetType: CommentTargetType, targetId: string): Promise<Comment[]> {
    const snap = await getDocs(query(
      collection(db, COLLECTION),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      where('status', '==', 'approved'),
    ));
    return snap.docs.map(toComment).sort(newestFirst);
  },

  /**
   * The signed-in member's own comments on this post that are still waiting, so
   * they are not left wondering whether theirs arrived. Rules allow it via the
   * authorUid clause.
   */
  async listMineWaiting(targetType: CommentTargetType, targetId: string): Promise<Comment[]> {
    const uid = auth.currentUser?.uid;
    if (!uid) return [];
    const snap = await getDocs(query(
      collection(db, COLLECTION),
      where('authorUid', '==', uid),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      where('status', '==', 'pending'),
    ));
    return snap.docs.map(toComment).sort(newestFirst);
  },

  /**
   * Members only, and held for approval — the rules pin `status` to 'pending'.
   *
   * The name is read from the member's own users/{uid} record rather than the
   * cached auth user: the rules check `authorName` against that record's name
   * fields, and the cached `fullName` falls back to 'Church Member' when the
   * record has none, which the rules would then rightly refuse.
   */
  async submit(targetType: CommentTargetType, targetId: string, rawText: string): Promise<void> {
    const uid = auth.currentUser?.uid;
    if (!uid || auth.currentUser?.isAnonymous) throw new AppError('commentNotSignedIn');

    const text = rawText.trim();
    if (text.length < COMMENT_MIN) throw new AppError('commentTooShort');
    if (text.length > COMMENT_MAX) throw new AppError('commentTooLong');

    try {
      const profile = await getDoc(doc(db, 'users', uid));
      const p = (profile.data() ?? {}) as Record<string, unknown>;
      const authorName = [p.fullNameEnglish, p.fullNameAmharic, p.fullName, p.username]
        .find((v): v is string => typeof v === 'string' && v.trim() !== '');
      if (!authorName) throw new AppError('commentFailed');

      await addDoc(collection(db, COLLECTION), {
        targetType, targetId, text, authorUid: uid, authorName,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      throw e instanceof AppError ? e : new AppError('commentFailed');
    }
  },

  /** Moderator inbox. The rules decide which targetType a given role may read. */
  async listByStatus(
    targetType: CommentTargetType,
    status: CommentStatus,
  ): Promise<Comment[]> {
    const snap = await getDocs(query(
      collection(db, COLLECTION),
      where('targetType', '==', targetType),
      where('status', '==', status),
    ));
    return snap.docs.map(toComment).sort(newestFirst);
  },

  /** For the inbox tab badge; a count aggregation, as suggestionService.countNew does. */
  async countPending(targetType: CommentTargetType): Promise<number> {
    const snap = await getCountFromServer(query(
      collection(db, COLLECTION),
      where('targetType', '==', targetType),
      where('status', '==', 'pending'),
    ));
    return snap.data().count;
  },

  /** Moderation only; the rules reject any diff that touches the words themselves. */
  async setStatus(id: string, status: CommentStatus, reviewedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, COLLECTION, id), {
        status,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
      });
    } catch {
      throw new AppError('commentModerationFailed');
    }
    await auditLogService
      .dataChange('update', 'comment', id, `Comment marked ${status}`)
      .catch(() => {});
  },

  /** A moderator, or the comment's own author. */
  async remove(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
    } catch {
      throw new AppError('commentModerationFailed');
    }
    await auditLogService.dataChange('delete', 'comment', id, 'Comment deleted').catch(() => {});
  },
};
