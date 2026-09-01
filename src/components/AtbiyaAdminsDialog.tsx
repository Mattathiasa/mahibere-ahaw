import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowRightLeft, CheckCircle2, KeyRound, Loader2, Plus, ShieldCheck,
  ShieldOff, SlidersHorizontal, TriangleAlert, UserCog, UserPlus, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  atbiyaAdminService, isRealEmail, emptyAdminDraft, validateAdminDraft,
  type AtbiyaAdmin, type AdminDraft,
} from '@/services/atbiyaAdmins';
import { hierarchyService, type Atbiya } from '@/services/hierarchy';
import { userService } from '@/services/users';
import type { User } from '@/types';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { errorMessage } from '@/lib/appError';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { Field } from '@/components/AtbiyaForm';
import { AtbiyaAdminFields } from '@/components/AtbiyaAdminFields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * The administrators of one parish.
 *
 * "Administrator" is not a stored flag — it is any `users/{uid}` with this
 * parish's `atbiyaId` and a role that can approve members, which is precisely
 * what firestore.rules checks. This dialog reads and writes that same pair.
 */

/**
 * Reassignment writes `hierarchyLevel`/`atbiyaId`, which only the rules'
 * isAdmin() clause permits — so a denial here means the acting account is not
 * an administrator, not that the data was wrong.
 */
function reassignError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code === 'permission-denied') {
    return 'Firestore denied that change. Only a head-office administrator can move an account between congregations or change its role.';
  }
  return e instanceof Error ? e.message : 'Could not update that account.';
}

interface AtbiyaAdminsDialogProps {
  open: boolean;
  atbiya: Atbiya | null;
  /** Called after any change, so the caller can refresh its counts. */
  onChanged: () => void;
  onClose: () => void;
}

export const AtbiyaAdminsDialog: React.FC<AtbiyaAdminsDialogProps> = ({
  open, atbiya, onChanged, onClose,
}) => {
  const { roles, roleLabel, isApproverRole, isAdminRole, isSuperAdmin, myRole } = usePermissions();
  const { showElement } = useSoftwareControl();
  const { t } = useLanguage();
  // `tx`, not `a` — `a` is the map parameter over the administrator list.
  const tx = t.admin;

  const [admins, setAdmins] = useState<AtbiyaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AdminDraft>(emptyAdminDraft());
  const [roleKey, setRoleKey] = useState('');
  const [saving, setSaving] = useState(false);

  // Reassignment state.
  const [managing, setManaging] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [parishes, setParishes] = useState<Atbiya[]>([]);
  const [promoteUid, setPromoteUid] = useState('');
  const [promoteRole, setPromoteRole] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editParish, setEditParish] = useState('');

  const approverRoleKeys = useMemo(
    () => roles.filter((r) => isApproverRole(r.key)).map((r) => r.key),
    [roles, isApproverRole]
  );
  const parishRoles = useMemo(
    () => roles.filter((r) => r.active !== false && !r.isAdmin && r.scope === 'atbiya' && r.canApproveMembers),
    [roles]
  );
  /** Where a stepped-down administrator lands: the narrowest ordinary role. */
  const memberRoles = useMemo(
    () => roles.filter((r) => r.active !== false && !r.isAdmin && !r.canApproveMembers),
    [roles]
  );

  /**
   * Changing `hierarchyLevel` or `atbiyaId` is an admin action — firestore.rules
   * permits it only through its isAdmin() clause. Showing these controls to a
   * parish administrator would offer a button the server rejects, which this
   * codebase deliberately avoids.
   */
  const mayReassign = isSuperAdmin || isAdminRole(myRole);
  const activeAdmins = admins.filter((a) => (a.status ?? 'active') === 'active');
  /** Members of this parish who are not already administrators. */
  const promotable = useMemo(() => {
    const already = new Set(admins.map((a) => a.id));
    return members.filter((m) => !already.has(m.id) && (m.status ?? 'active') === 'active');
  }, [members, admins]);

  const load = useCallback(async () => {
    if (!atbiya) return;
    setLoading(true);
    setError(null);
    try {
      setAdmins(await atbiyaAdminService.list(atbiya.id, approverRoleKeys));
    } catch {
      setError(tx.adminsLoadFailed);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [atbiya, approverRoleKeys, tx]);

  useEffect(() => {
    if (!open) return;
    setAdding(false);
    setPromoting(false);
    setManaging(null);
    setDraft(emptyAdminDraft());
    setNotice(null);
    load();
  }, [open, load]);

  useEffect(() => {
    if (!roleKey && parishRoles.length > 0) setRoleKey(parishRoles[0].key);
    if (!promoteRole && parishRoles.length > 0) setPromoteRole(parishRoles[0].key);
  }, [parishRoles, roleKey, promoteRole]);

  // Only fetched when the reassignment controls are actually opened — the
  // member roster and the full parish list are wasted reads otherwise.
  const loadReassignmentData = useCallback(async () => {
    if (!atbiya) return;
    const [roster, all] = await Promise.all([
      userService.getUsersByAtbiya(atbiya.id).catch(() => []) as Promise<User[]>,
      hierarchyService.getAtbiyas().catch(() => []),
    ]);
    setMembers(roster);
    setParishes(all);
  }, [atbiya]);

  async function handleAdd() {
    if (!atbiya) return;
    const problem = validateAdminDraft(draft);
    if (problem) return setError(problem);
    if (!roleKey) {
      return setError(tx.noParishRole);
    }

    setSaving(true);
    setError(null);
    try {
      if (await atbiyaAdminService.isUsernameTaken(draft.username)) {
        setSaving(false);
        return setError(tx.usernameTaken);
      }
      await atbiyaAdminService.create({ id: atbiya.id, name: atbiya.name }, draft, roleKey);
      setNotice(`${draft.fullNameEnglish} can now sign in and approve this congregation’s requests.`);
      setAdding(false);
      setDraft(emptyAdminDraft());
      await load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : tx.createAdminFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handlePromote() {
    if (!atbiya || !promoteUid || !promoteRole) return;
    const person = members.find((m) => m.id === promoteUid);
    setSaving(true);
    setError(null);
    try {
      await atbiyaAdminService.assign(promoteUid, { id: atbiya.id, name: atbiya.name }, promoteRole);
      setNotice(`${person?.fullNameEnglish ?? person?.username ?? 'That member'} can now decide this congregation’s requests.`);
      setPromoting(false);
      setPromoteUid('');
      await load();
      onChanged();
    } catch (e) {
      setError(reassignError(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveReassignment(admin: AtbiyaAdmin) {
    if (!atbiya) return;
    const movingAway = editParish && editParish !== atbiya.id;
    const target = parishes.find((p) => p.id === editParish);

    // A parish with no administrator is a queue nobody opens.
    if ((movingAway || editRole !== admin.hierarchyLevel) && activeAdmins.length === 1
        && !window.confirm(
          `${admin.fullNameEnglish ?? admin.username} is the only active administrator of ${atbiya.name}. ` +
          'Continue and leave this congregation with nobody to approve its membership requests?')) {
      return;
    }

    setBusyId(admin.id);
    setError(null);
    try {
      if (editRole && editRole !== admin.hierarchyLevel) {
        const stepDown = memberRoles.some((r) => r.key === editRole);
        if (stepDown) await atbiyaAdminService.demote(admin.id, editRole);
        else await atbiyaAdminService.assign(admin.id, { id: atbiya.id, name: atbiya.name }, editRole);
      }
      if (movingAway && target) {
        await atbiyaAdminService.transfer(admin.id, { id: target.id, name: target.name });
      }
      setNotice(
        movingAway && target
          ? `${admin.fullNameEnglish ?? admin.username} now belongs to ${target.name}.`
          : `${admin.fullNameEnglish ?? admin.username} is now ${roleLabel(editRole)}.`
      );
      setManaging(null);
      await load();
      onChanged();
    } catch (e) {
      setError(reassignError(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(admin: AtbiyaAdmin) {
    const suspending = (admin.status ?? 'active') === 'active';
    setBusyId(admin.id);
    setError(null);
    try {
      await atbiyaAdminService.setActive(admin.id, !suspending);
      setNotice(suspending
        ? `${admin.fullNameEnglish ?? admin.username} can no longer sign in.`
        : `${admin.fullNameEnglish ?? admin.username} can sign in again.`);
      await load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update that account.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReset(admin: AtbiyaAdmin) {
    setBusyId(admin.id);
    setError(null);
    try {
      await atbiyaAdminService.sendReset(admin.email);
      setNotice(t.pages.resetLinkSent.replace('{email}', admin.email));
    } catch (e) {
      setError(errorMessage(t, e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Administrators — {atbiya?.name}
          </DialogTitle>
          <DialogDescription>
            These accounts sign in for this congregation and decide its membership
            requests. Everyone else who chose it is an ordinary member.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
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
          ) : admins.length === 0 ? (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                No administrator — membership requests for this congregation have
                nobody to approve them. Add one below.
              </span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {admins.map((a) => {
                const suspended = (a.status ?? 'active') !== 'active';
                return (
                  <motion.div key={a.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl border border-border bg-muted/20 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-[200px] space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold">{a.fullNameEnglish ?? a.fullName ?? a.username}</span>
                          {a.fullNameAmharic && (
                            <span className="text-sm text-muted-foreground font-ethiopic">{a.fullNameAmharic}</span>
                          )}
                          {suspended
                            ? <Badge variant="secondary" className="text-[10px]">{tx.suspended}</Badge>
                            : <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px]">{tx.active}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          @{a.username} · {roleLabel(a.hierarchyLevel)}
                        </p>
                        <p className="text-xs text-muted-foreground break-all">
                          {isRealEmail(a.email)
                            ? `${tx.signsInWith}: ${a.email}`
                            : tx.signsInByUsername}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {mayReassign && (
                          <Button size="sm" variant="outline" disabled={busyId === a.id}
                            onClick={() => {
                              const opening = managing !== a.id;
                              setManaging(opening ? a.id : null);
                              setError(null);
                              if (opening) {
                                setEditRole(a.hierarchyLevel ?? '');
                                setEditParish(atbiya?.id ?? '');
                                loadReassignmentData();
                              }
                            }}>
                            <SlidersHorizontal className="h-4 w-4 mr-1" /> {tx.manage}
                          </Button>
                        )}
                        <Button size="sm" variant="outline" disabled={busyId === a.id || !isRealEmail(a.email)}
                          title={isRealEmail(a.email) ? tx.resetPasswordTitle : tx.noEmailNoReset}
                          onClick={() => handleReset(a)}>
                          <KeyRound className="h-4 w-4 mr-1" /> {tx.resetPassword}
                        </Button>
                        <Button size="sm" variant="outline" disabled={busyId === a.id}
                          className={suspended ? '' : 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10'}
                          onClick={() => handleToggle(a)}>
                          {busyId === a.id
                            ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            : <ShieldOff className="h-4 w-4 mr-1" />}
                          {suspended ? tx.reinstate : tx.suspend}
                        </Button>
                      </div>
                    </div>

                    {managing === a.id && (
                      <div className="pt-3 border-t border-border grid gap-3 sm:grid-cols-2">
                        <Field label={tx.role}>
                          <Select value={editRole} onValueChange={setEditRole} disabled={busyId === a.id}>
                            <SelectTrigger><SelectValue placeholder={tx.selectRole} /></SelectTrigger>
                            <SelectContent>
                              {parishRoles.map((r) => (
                                <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                              ))}
                              {/* Choosing one of these steps the account down to
                                  an ordinary member without removing it. */}
                              {memberRoles.map((r) => (
                                <SelectItem key={r.key} value={r.key}>
                                  {roleLabel(r.key)} — step down to member
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <Field label={tx.congregation} hint={tx.transferHint}>
                          <Select value={editParish} onValueChange={setEditParish} disabled={busyId === a.id}>
                            <SelectTrigger><SelectValue placeholder={tx.selectCongregation} /></SelectTrigger>
                            <SelectContent>
                              {parishes.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                        <div className="sm:col-span-2 flex justify-end gap-2">
                          <Button size="sm" variant="ghost" disabled={busyId === a.id}
                            onClick={() => { setManaging(null); setError(null); }}>
                            Cancel
                          </Button>
                          <Button size="sm" disabled={busyId === a.id}
                            onClick={() => handleSaveReassignment(a)}>
                            {busyId === a.id
                              ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              : <ArrowRightLeft className="h-4 w-4 mr-1" />}
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {adding ? (
            <div className="p-4 rounded-xl border border-border space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> {tx.newAdministrator}
                </p>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={saving}
                  onClick={() => { setAdding(false); setError(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AtbiyaAdminFields draft={draft} setDraft={setDraft} disabled={saving} />
              <Field label={tx.role}>
                <Select value={roleKey} onValueChange={setRoleKey} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder={tx.selectRole} /></SelectTrigger>
                  <SelectContent>
                    {parishRoles.map((r) => (
                      <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" disabled={saving}
                  onClick={() => { setAdding(false); setError(null); }}>{t.common.cancel}</Button>
                <Button onClick={handleAdd} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {tx.createAccount}
                </Button>
              </div>
            </div>
          ) : promoting ? (
            <div className="p-4 rounded-xl border border-border space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-2">
                  <UserCog className="h-4 w-4" /> {tx.promoteMember}
                </p>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={saving}
                  onClick={() => { setPromoting(false); setError(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {tx.promoteMemberDesc}
              </p>
              <Field label={tx.member}>
                <Select value={promoteUid} onValueChange={setPromoteUid} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder={tx.selectMember} /></SelectTrigger>
                  <SelectContent>
                    {promotable.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        {tx.allAlreadyAdmins}
                      </div>
                    ) : promotable.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.fullNameEnglish ?? m.fullName ?? m.username}
                        {m.username ? ` · @${m.username}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={tx.role}>
                <Select value={promoteRole} onValueChange={setPromoteRole} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder={tx.selectRole} /></SelectTrigger>
                  <SelectContent>
                    {parishRoles.map((r) => (
                      <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" disabled={saving}
                  onClick={() => { setPromoting(false); setError(null); }}>{t.common.cancel}</Button>
                <Button onClick={handlePromote} disabled={saving || !promoteUid}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {tx.makeAdministrator}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {showElement('atbiya.addAdmin') && (
                <Button variant="outline" size="sm"
                  onClick={() => { setAdding(true); setNotice(null); setError(null); }}>
                  <Plus className="h-4 w-4 mr-2" /> {tx.addAdministrator}
                </Button>
              )}
              {mayReassign && (
                <Button variant="outline" size="sm"
                  onClick={() => {
                    setPromoting(true);
                    setNotice(null);
                    setError(null);
                    loadReassignmentData();
                  }}>
                  <UserCog className="h-4 w-4 mr-2" /> {tx.promoteMember}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
