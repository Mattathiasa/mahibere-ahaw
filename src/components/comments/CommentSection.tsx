import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFormatters } from '@/lib/formatters';
import { AppError, errorMessage } from '@/lib/appError';
import {
  COMMENT_MAX, commentService, type Comment, type CommentTargetType,
} from '@/services/comments';
import { Button } from '@/components/ui/button';

/**
 * Not a security control — localStorage is trivially cleared — but it stops the
 * accidental double-post. Same trade as the suggestion box; the real limit on
 * who can write at all is the `comments` block in firestore.rules.
 */
const COOLDOWN_MS = 30_000;
const COOLDOWN_KEY = 'comment-last-sent';

function withinCooldown(): boolean {
  try {
    const last = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0);
    return Number.isFinite(last) && Date.now() - last < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markSent(): void {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(Date.now()));
  } catch {
    /* private browsing: skip the throttle rather than refuse the member */
  }
}

const toDate = (c: Comment) => (c.createdAt ? new Date(c.createdAt.seconds * 1000) : null);

interface CommentSectionProps {
  targetType: CommentTargetType;
  /** News slug, or the `teachings` document id for a sermon. */
  targetId: string;
}

/**
 * Comments under a sermon or news post.
 *
 * Approved comments are public. Writing needs an approved member account, and
 * what a member writes waits for a moderator — so after posting, the member
 * sees it listed as "awaiting approval" (to them only) rather than losing it.
 */
export const CommentSection: React.FC<CommentSectionProps> = ({ targetType, targetId }) => {
  const { t } = useLanguage();
  const c = t.content;
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const { formatDate } = useFormatters();
  const dark = theme === 'dark';

  const [approved, setApproved] = useState<Comment[]>([]);
  const [waiting, setWaiting] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  // Honeypot: a real person never sees or fills this field.
  const [website, setWebsite] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [pub, mine] = await Promise.all([
        commentService.listApproved(targetType, targetId),
        user ? commentService.listMineWaiting(targetType, targetId) : Promise.resolve([]),
      ]);
      setApproved(pub);
      setWaiting(mine);
    } catch {
      // A failed read leaves the section empty; the post itself still reads fine.
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId, user]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;

    // Pretend it worked and write nothing, so a bot learns nothing.
    if (website.trim()) {
      setText('');
      return;
    }
    if (withinCooldown()) {
      toast.error(errorMessage(t, new AppError('commentCooldown')));
      return;
    }

    setSending(true);
    try {
      await commentService.submit(targetType, targetId, text);
      markSent();
      setText('');
      toast.success(c.commentsPendingNotice);
      await load();
    } catch (err) {
      toast.error(errorMessage(t, err));
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(c.commentsConfirmDelete)) return;
    try {
      await commentService.remove(id);
      toast.success(c.commentsDeleted);
      await load();
    } catch (err) {
      toast.error(errorMessage(t, err));
    }
  }

  const card = `rounded-2xl border p-4 space-y-2 ${
    dark ? 'border-white/10 bg-white/5' : 'border-[#2E5E99]/10 bg-[#2E5E99]/5'}`;
  const body = `text-base font-ethiopic leading-relaxed whitespace-pre-line ${
    dark ? 'text-white/80' : 'text-[#0D2440]/80'}`;

  const row = (comment: Comment, pending: boolean) => {
    const when = toDate(comment);
    return (
      <li key={comment.id} className={card}>
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-black uppercase tracking-widest">
          <span className="text-[#2E5E99]">{comment.authorName}</span>
          {when && <span className="opacity-50">{formatDate(when)}</span>}
          {pending && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold">
              {c.commentsAwaiting}
            </span>
          )}
          {user?.id === comment.authorUid && (
            <button
              type="button"
              onClick={() => void handleDelete(comment.id)}
              className="ml-auto inline-flex items-center gap-1 opacity-50 hover:opacity-100"
              aria-label={c.commentsDelete}
            >
              <Trash2 className="h-3 w-3" /> {c.commentsDelete}
            </button>
          )}
        </div>
        <p className={body}>{comment.text}</p>
      </li>
    );
  };

  return (
    <section className="pt-8 border-t border-[#2E5E99]/10 space-y-5" aria-label={c.commentsTitle}>
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-[#2E5E99]" />
        <h3 className={`text-xl font-bold font-ethiopic ${dark ? 'text-white' : 'text-[#0D2440]'}`}>
          {c.commentsTitle}{approved.length > 0 && ` (${approved.length})`}
        </h3>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            required
            rows={3}
            maxLength={COMMENT_MAX}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={c.commentsPlaceholder}
            aria-label={c.commentsPlaceholder}
            className={`w-full rounded-2xl border px-4 py-3 font-ethiopic resize-y outline-none focus:ring-2 focus:ring-[#2E5E99]/40 ${
              dark ? 'border-white/10 bg-white/5 text-white' : 'border-[#2E5E99]/15 bg-white text-[#0D2440]'}`}
          />
          {/* Off-screen rather than display:none, which some bots skip. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black tracking-widest text-[#2E5E99]/50">
              {text.trim().length}/{COMMENT_MAX}
            </span>
            <Button type="submit" disabled={sending || text.trim().length === 0}
              className="bg-[#2E5E99] hover:bg-[#204a7c]">
              {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {sending ? c.commentsSubmitting : c.commentsSubmit}
            </Button>
          </div>
        </form>
      ) : (
        <p className={`text-sm font-ethiopic ${dark ? 'text-white/70' : 'text-[#0D2440]/70'}`}>
          {c.commentsSignInPrompt}{' '}
          <Link to="/login" className="font-bold text-[#2E5E99] underline">
            {c.commentsSignInButton}
          </Link>
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#2E5E99]" />
        </div>
      ) : waiting.length === 0 && approved.length === 0 ? (
        <p className="text-sm italic opacity-60 font-ethiopic">{c.commentsEmpty}</p>
      ) : (
        <ul className="space-y-3">
          {waiting.map((w) => row(w, true))}
          {approved.map((a) => row(a, false))}
        </ul>
      )}
    </section>
  );
};
