import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Loader2, Plus, TriangleAlert, UserMinus, Users, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  standingSynodService, STANDING_SYNOD_SEATS, STANDING_SYNOD_ROLE,
} from '@/services/standingSynod';
import { userService } from '@/services/users';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Field } from '@/components/AtbiyaForm';
import type { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * The nine members of the Standing Synod.
 *
 * Membership is the `KuamiSinodos` role on an account, so this adds and removes
 * that role rather than keeping a roster of its own. Both writes touch
 * `hierarchyLevel`, which firestore.rules allows only for an isAdmin() account
 * — `canEdit` has to mirror that.
 */

interface StandingSynodRegistryProps {
  canEdit: boolean;
}

export const StandingSynodRegistry: React.FC<StandingSynodRegistryProps> = ({ canEdit }) => {
  const { t } = useLanguage();
  const tx = t.admin;
  const { roles, roleLabel } = usePermissions();

  const [members, setMembers] = useState<User[]>([]);
  const [candidates, setCandidates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [fallbackRole, setFallbackRole] = useState('');

  /** Where a departing member lands: the narrowest ordinary role. */
  const memberRoles = useMemo(
    () => roles.filter((r) => r.active !== false && !r.isAdmin && !r.canApproveMembers),
    [roles]
  );

  useEffect(() => {
    if (!fallbackRole && memberRoles.length > 0) setFallbackRole(memberRoles[memberRoles.length - 1].key);
  }, [memberRoles, fallbackRole]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await standingSynodService.list();
      setMembers(current);
      // Candidates are fetched alongside so the picker is populated the moment
      // it opens; failure here is not worth blocking the roster over.
      try {
        const { users } = await userService.getAllUsers();
        const already = new Set(current.map((m) => m.id));
        setCandidates((users as User[]).filter(
          (u) => !already.has(u.id) && (u.status ?? 'active') === 'active'
        ));
      } catch { setCandidates([]); }
    } catch {
      setError(tx.synodLoadFailed);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [tx]);

  useEffect(() => { load(); }, [load]);

  const nameOf = (u: User) => u.fullNameEnglish ?? u.fullName ?? u.username ?? u.id;

  function denied(e: unknown, fallback: string): string {
    const code = (e as { code?: string })?.code ?? '';
    if (code === 'permission-denied') return tx.synodDenied;
    return e instanceof Error ? e.message : fallback;
  }

  async function add() {
    const person = candidates.find((c) => c.id === pick);
    if (!person) return;
    setSaving(true);
    setError(null);
    try {
      await standingSynodService.add(person.id, nameOf(person));
      setNotice(`${nameOf(person)} ${tx.synodAdded}`);
      setAdding(false);
      setPick('');
      await load();
    } catch (e) {
      setError(denied(e, tx.unitSaveFailed));
    } finally {
      setSaving(false);
    }
  }

  async function remove(m: User) {
    if (!fallbackRole) return;
    setBusyId(m.id);
    setError(null);
    try {
      await standingSynodService.remove(m.id, nameOf(m), fallbackRole);
      setNotice(`${nameOf(m)} ${tx.synodRemoved}`);
      setRemoving(null);
      await load();
    } catch (e) {
      setError(denied(e, tx.unitSaveFailed));
    } finally {
      setBusyId(null);
    }
  }

  const overCapacity = members.length > STANDING_SYNOD_SEATS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground max-w-2xl">{tx.synodDesc}</p>
        <Badge variant={overCapacity ? 'destructive' : 'secondary'} className="text-xs shrink-0">
          {members.length} / {STANDING_SYNOD_SEATS} {tx.synodSeats}
        </Badge>
      </div>

      {notice && (
        <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /><span>{notice}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
        </div>
      )}
      {overCapacity && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" /><span>{tx.synodOverCapacity}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : members.length === 0 && !adding ? (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{tx.synodEmpty}</p>
          <p className="text-sm">{tx.synodEmptyDesc}</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {members.map((m) => (
            <motion.div key={m.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-[200px] space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{nameOf(m)}</span>
                    {m.fullNameAmharic && (
                      <span className="text-sm text-muted-foreground font-ethiopic">{m.fullNameAmharic}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    @{m.username}{m.phone ? ` · ${m.phone}` : ''}
                  </p>
                </div>
                {canEdit && removing !== m.id && (
                  <Button size="sm" variant="outline" disabled={busyId === m.id}
                    className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => { setRemoving(m.id); setNotice(null); setError(null); }}>
                    <UserMinus className="h-4 w-4 mr-1" /> {tx.synodRemove}
                  </Button>
                )}
              </div>

              {removing === m.id && (
                <div className="pt-3 border-t border-border space-y-3">
                  <Field label={tx.synodRemoveTo} hint={tx.synodRemoveHint}>
                    <Select value={fallbackRole} onValueChange={setFallbackRole} disabled={busyId === m.id}>
                      <SelectTrigger><SelectValue placeholder={tx.selectRole} /></SelectTrigger>
                      <SelectContent>
                        {memberRoles.map((r) => (
                          <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" disabled={busyId === m.id}
                      onClick={() => setRemoving(null)}>{tx.cancel}</Button>
                    <Button size="sm" variant="destructive" disabled={busyId === m.id || !fallbackRole}
                      onClick={() => remove(m)}>
                      {busyId === m.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      {tx.synodRemove}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {adding ? (
        <div className="p-4 rounded-xl border border-border space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4" /> {tx.synodAdd}
            </p>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={saving}
              onClick={() => { setAdding(false); setError(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">{tx.synodAddDesc}</p>
          <Field label={tx.synodSelect}>
            <Select value={pick} onValueChange={setPick} disabled={saving}>
              <SelectTrigger><SelectValue placeholder={tx.selectMember} /></SelectTrigger>
              <SelectContent>
                {candidates.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">{tx.synodNoCandidates}</div>
                ) : candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {nameOf(c)}{c.username ? ` · @${c.username}` : ''} — {roleLabel(c.hierarchyLevel)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={saving}
              onClick={() => { setAdding(false); setError(null); }}>{tx.cancel}</Button>
            <Button onClick={add} disabled={saving || !pick}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {tx.synodConfirmAdd}
            </Button>
          </div>
        </div>
      ) : canEdit && (
        <Button variant="outline" size="sm"
          onClick={() => { setAdding(true); setNotice(null); setError(null); }}>
          <Plus className="h-4 w-4 mr-2" /> {tx.synodAdd}
        </Button>
      )}
    </div>
  );
};
