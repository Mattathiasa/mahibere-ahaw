import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Check, ExternalLink, Loader2, MessageSquare, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatters } from '@/lib/formatters';
import { AppError, errorMessage } from '@/lib/appError';
import {
  commentService, type Comment, type CommentStatus, type CommentTargetType,
} from '@/services/comments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STATUSES: CommentStatus[] = ['pending', 'approved', 'rejected'];

interface CommentInboxProps {
  /**
   * One inbox per kind of post, because the rules split moderation the same
   * way: whoever manages news moderates news comments, whoever writes
   * teachings moderates sermon comments.
   */
  targetType: CommentTargetType;
}

/**
 * Moderation queue for comments on news or sermons.
 *
 * Moderators can only change `status` or delete — the rules reject any diff
 * that touches the words, so this offers nothing that would let a comment be
 * rewritten.
 */
export const CommentInbox: React.FC<CommentInboxProps> = ({ targetType }) => {
  const { user } = useAuthContext();
  const { t } = useLanguage();
  const { formatDate } = useFormatters();
  const c = t.content;

  const [status, setStatus] = useState<CommentStatus>('pending');
  const [items, setItems] = useState<Comment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [list, count] = await Promise.all([
        commentService.listByStatus(targetType, status),
        commentService.countPending(targetType),
      ]);
      setItems(list);
      setPendingCount(count);
    } catch {
      setFailed(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [targetType, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const label: Record<CommentStatus, string> = {
    pending: c.commentsFilterPending,
    approved: c.commentsFilterApproved,
    rejected: c.commentsFilterRejected,
  };

  async function moderate(item: Comment, next: CommentStatus) {
    setBusyId(item.id);
    try {
      await commentService.setStatus(item.id, next, user?.fullName ?? user?.username ?? '');
      toast.success(next === 'approved' ? c.commentsApproved : c.commentsRejected);
      await load();
    } catch (err) {
      toast.error(errorMessage(t, err));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: Comment) {
    if (!window.confirm(c.commentsConfirmDelete)) return;
    setBusyId(item.id);
    try {
      await commentService.remove(item.id);
      toast.success(c.commentsDeleted);
      await load();
    } catch (err) {
      toast.error(errorMessage(t, err));
    } finally {
      setBusyId(null);
    }
  }

  const postPath = (item: Comment) =>
    item.targetType === 'news' ? `/news/${item.targetId}` : `/sermons/view/${item.targetId}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {c.commentsInboxTitle}
          {pendingCount > 0 && <Badge className="bg-amber-500 hover:bg-amber-500">{pendingCount}</Badge>}
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <Button key={s} size="sm" variant={status === s ? 'default' : 'outline'}
              onClick={() => setStatus(s)}>
              {label[s]}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {failed && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMessage(t, new AppError('commentModerationFailed'))}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{c.commentsInboxEmpty}</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold">{item.authorName}</span>
                {item.createdAt && (
                  <span className="text-muted-foreground">
                    {formatDate(new Date(item.createdAt.seconds * 1000))}
                  </span>
                )}
                <Link to={postPath(item)} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#2E5E99] hover:underline">
                  <ExternalLink className="h-3 w-3" /> {c.commentsOpenPost}
                </Link>
              </div>
              <p className="whitespace-pre-line font-ethiopic">{item.text}</p>
              <div className="flex gap-2 flex-wrap">
                {item.status !== 'approved' && (
                  <Button size="sm" disabled={busyId === item.id}
                    onClick={() => void moderate(item, 'approved')}
                    className="bg-emerald-600 hover:bg-emerald-700">
                    <Check className="h-4 w-4 mr-1" /> {c.commentsApprove}
                  </Button>
                )}
                {item.status !== 'rejected' && (
                  <Button size="sm" variant="outline" disabled={busyId === item.id}
                    onClick={() => void moderate(item, 'rejected')}>
                    <X className="h-4 w-4 mr-1" /> {c.commentsReject}
                  </Button>
                )}
                <Button size="sm" variant="ghost" disabled={busyId === item.id}
                  onClick={() => void remove(item)} className="text-red-500">
                  <Trash2 className="h-4 w-4 mr-1" /> {c.commentsDelete}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
