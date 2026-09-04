import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, Archive, CheckCircle2, Eye, Inbox, Loader2, MessageSquarePlus,
  RefreshCw, User, Wrench,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFormatters } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  SUGGESTION_STATUSES, suggestionCategoryLabel, suggestionStatusLabel,
} from '@/i18n/enums';
import {
  suggestionService, type Suggestion, type SuggestionStatus,
} from '@/services/suggestions';

/** Colour per triage state, so the queue reads at a glance. */
const STATUS_STYLE: Record<SuggestionStatus, string> = {
  New: 'bg-amber-500 hover:bg-amber-500',
  Reviewed: 'bg-sky-600 hover:bg-sky-600',
  Actioned: 'bg-emerald-600 hover:bg-emerald-600',
  Archived: 'bg-muted-foreground hover:bg-muted-foreground',
};

/**
 * The office's inbox for what visitors sent from the home page.
 *
 * Read-and-triage only. `firestore.rules` refuses any update that touches the
 * submission itself — an edited suggestion is a fabricated one — so this offers
 * a status and a note, and nothing that would let someone rewrite what a person
 * actually wrote.
 *
 * Rendered inside Software Control, which is superAdminOnly. The rules are
 * deliberately one step wider (`isAdmin()`), so moving this component to a
 * permission-gated page later needs no rules change.
 */
export const SuggestionInbox: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatDate } = useFormatters();
  const a = t.admin;

  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<SuggestionStatus | 'all'>('all');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await suggestionService.list());
    } catch (e) {
      // A brand-new deploy queries before the composite index finishes
      // building, and "could not be loaded" would send whoever sees it looking
      // at the rules instead of waiting five minutes.
      setError(
        e instanceof Error && e.message.includes('index')
          ? a.suggestionsIndexBuilding
          : a.suggestionsLoadFailed
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [a]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = filter === 'all' ? items : items.filter((s) => s.status === filter);
  const newCount = items.filter((s) => s.status === 'New').length;

  async function triage(item: Suggestion, status: SuggestionStatus) {
    setBusyId(item.id);
    setError(null);
    setNotice(null);
    try {
      await suggestionService.setStatus(item.id, status, {
        reviewedBy: user?.fullName ?? user?.username ?? '',
        adminNote: notes[item.id] ?? item.adminNote ?? '',
      });
      // Patched in place rather than refetched: a reload would cost a full read
      // of the collection to change one badge.
      setItems((list) =>
        list.map((s) =>
          s.id === item.id
            ? {
                ...s,
                status,
                reviewedBy: user?.fullName ?? user?.username ?? '',
                adminNote: notes[item.id] ?? item.adminNote ?? '',
              }
            : s
        )
      );
      setNotice(a.suggestionsUpdated);
    } catch {
      setError(a.suggestionsUpdateFailed);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            {a.suggestionsTitle}
            {newCount > 0 && <Badge className={STATUS_STYLE.New}>{newCount}</Badge>}
          </CardTitle>
          <CardDescription>{a.suggestionsDesc}</CardDescription>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as SuggestionStatus | 'all')}
          >
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue placeholder={a.suggestionsAllStatuses} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {a.suggestionsAllStatuses} ({items.length})
              </SelectItem>
              {SUGGESTION_STATUSES.map((status) => (
                // The stored English token stays the value; only the child text
                // is translated. See the contract in src/i18n/enums.ts.
                <SelectItem key={status} value={status}>
                  {suggestionStatusLabel(t, status)} (
                  {items.filter((s) => s.status === status).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> {a.refresh}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {notice && (
          <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">
              {items.length === 0 ? a.suggestionsEmpty : a.suggestionsEmptyFiltered}
            </p>
            <p className="text-sm">
              {items.length === 0 ? a.suggestionsEmptyDesc : a.suggestionsEmptyFilteredDesc}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl border border-border bg-muted/20 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_STYLE[item.status]}>
                      {suggestionStatusLabel(t, item.status)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {suggestionCategoryLabel(t, item.category)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <User className="h-3 w-3" />
                      {item.isMember ? a.suggestionsFromMember : a.suggestionsFromVisitor}
                    </Badge>
                  </div>
                  {item.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(new Date(item.createdAt.seconds * 1000).toISOString())}
                    </span>
                  )}
                </div>

                <p className="whitespace-pre-wrap font-ethiopic leading-relaxed">
                  {item.message}
                </p>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{item.name?.trim() || a.suggestionsAnonymous}</p>
                  <p className="break-all">{item.contact?.trim() || a.suggestionsNoContact}</p>
                  {item.reviewedBy && (
                    <p>{a.suggestionsReviewedBy.replace('{who}', item.reviewedBy)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor={`note-${item.id}`}
                  >
                    {a.suggestionsNoteLabel}
                  </label>
                  <Textarea
                    id={`note-${item.id}`}
                    rows={2}
                    maxLength={2000}
                    value={notes[item.id] ?? item.adminNote ?? ''}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [item.id]: e.target.value }))
                    }
                    placeholder={a.suggestionsNotePlaceholder}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => triage(item, 'Reviewed')}
                  >
                    {busyId === item.id ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {a.suggestionsMarkReviewed}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === item.id}
                    onClick={() => triage(item, 'Actioned')}
                  >
                    <Wrench className="h-4 w-4 mr-1" />
                    {a.suggestionsMarkActioned}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => triage(item, 'Archived')}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    {a.suggestionsArchive}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};
