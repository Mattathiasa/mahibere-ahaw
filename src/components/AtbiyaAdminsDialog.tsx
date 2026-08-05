import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, KeyRound, Loader2, Plus, ShieldCheck, ShieldOff,
  TriangleAlert, UserPlus, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  atbiyaAdminService, isRealEmail, emptyAdminDraft, validateAdminDraft,
  type AtbiyaAdmin, type AdminDraft,
} from '@/services/atbiyaAdmins';
import type { Atbiya } from '@/services/hierarchy';
import { usePermissions } from '@/contexts/PermissionContext';
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
  const { roles, roleLabel, isApproverRole } = usePermissions();
  const { showElement } = useSoftwareControl();

  const [admins, setAdmins] = useState<AtbiyaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<AdminDraft>(emptyAdminDraft());
  const [roleKey, setRoleKey] = useState('');
  const [saving, setSaving] = useState(false);

  const approverRoleKeys = useMemo(
    () => roles.filter((r) => isApproverRole(r.key)).map((r) => r.key),
    [roles, isApproverRole]
  );
  const parishRoles = useMemo(
    () => roles.filter((r) => r.active !== false && !r.isAdmin && r.scope === 'atbiya' && r.canApproveMembers),
    [roles]
  );

  const load = useCallback(async () => {
    if (!atbiya) return;
    setLoading(true);
    setError(null);
    try {
      setAdmins(await atbiyaAdminService.list(atbiya.id, approverRoleKeys));
    } catch {
      setError('Could not load this parish’s administrators.');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [atbiya, approverRoleKeys]);

  useEffect(() => {
    if (!open) return;
    setAdding(false);
    setDraft(emptyAdminDraft());
    setNotice(null);
    load();
  }, [open, load]);

  useEffect(() => {
    if (!roleKey && parishRoles.length > 0) setRoleKey(parishRoles[0].key);
  }, [parishRoles, roleKey]);

  async function handleAdd() {
    if (!atbiya) return;
    const problem = validateAdminDraft(draft);
    if (problem) return setError(problem);
    if (!roleKey) {
      return setError('No parish-level role is available to assign. Add one in Software Control → Roles first.');
    }

    setSaving(true);
    setError(null);
    try {
      if (await atbiyaAdminService.isUsernameTaken(draft.username)) {
        setSaving(false);
        return setError('That username is already taken. Choose another.');
      }
      await atbiyaAdminService.create({ id: atbiya.id, name: atbiya.name }, draft, roleKey);
      setNotice(`${draft.fullNameEnglish} can now sign in and approve this parish’s requests.`);
      setAdding(false);
      setDraft(emptyAdminDraft());
      await load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the administrator account.');
    } finally {
      setSaving(false);
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
      setNotice(`A password reset link was sent to ${admin.email}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the reset email.');
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
            These accounts sign in for this parish and decide its membership
            requests. Everyone else who chose this parish is an ordinary member.
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
                No administrator — membership requests for this parish have nobody
                to approve them. Add one below.
              </span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {admins.map((a) => {
                const suspended = (a.status ?? 'active') !== 'active';
                return (
                  <motion.div key={a.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                    className="p-3 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-[200px] space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{a.fullNameEnglish ?? a.fullName ?? a.username}</span>
                        {a.fullNameAmharic && (
                          <span className="text-sm text-muted-foreground font-ethiopic">{a.fullNameAmharic}</span>
                        )}
                        {suspended
                          ? <Badge variant="secondary" className="text-[10px]">Suspended</Badge>
                          : <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px]">Active</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        @{a.username} · {roleLabel(a.hierarchyLevel)}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        {isRealEmail(a.email) ? a.email : 'Signs in by username only'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" disabled={busyId === a.id || !isRealEmail(a.email)}
                        title={isRealEmail(a.email)
                          ? 'Send a password reset link'
                          : 'This account has no email address, so no reset link can be sent.'}
                        onClick={() => handleReset(a)}>
                        <KeyRound className="h-4 w-4 mr-1" /> Reset
                      </Button>
                      <Button size="sm" variant="outline" disabled={busyId === a.id}
                        className={suspended ? '' : 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10'}
                        onClick={() => handleToggle(a)}>
                        {busyId === a.id
                          ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          : <ShieldOff className="h-4 w-4 mr-1" />}
                        {suspended ? 'Reinstate' : 'Suspend'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {adding ? (
            <div className="p-4 rounded-xl border border-border space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> New administrator
                </p>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={saving}
                  onClick={() => { setAdding(false); setError(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AtbiyaAdminFields draft={draft} setDraft={setDraft} disabled={saving} />
              <Field label="Role">
                <Select value={roleKey} onValueChange={setRoleKey} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                  <SelectContent>
                    {parishRoles.map((r) => (
                      <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" disabled={saving}
                  onClick={() => { setAdding(false); setError(null); }}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create account
                </Button>
              </div>
            </div>
          ) : showElement('atbiya.addAdmin') && (
            <Button variant="outline" size="sm" onClick={() => { setAdding(true); setNotice(null); setError(null); }}>
              <Plus className="h-4 w-4 mr-2" /> Add administrator
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
