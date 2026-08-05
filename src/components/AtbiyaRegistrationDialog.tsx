import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Church, Loader2, ShieldCheck, TriangleAlert,
} from 'lucide-react';
import {
  hierarchyService, emptyAtbiya, type AtbiyaInput,
} from '@/services/hierarchy';
import {
  atbiyaAdminService, emptyAdminDraft, validateAdminDraft, type AdminDraft,
} from '@/services/atbiyaAdmins';
import { usePermissions } from '@/contexts/PermissionContext';
import { AtbiyaForm, Field, type ZoneOption } from '@/components/AtbiyaForm';
import { AtbiyaAdminFields } from '@/components/AtbiyaAdminFields';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * Registering a parish and its first administrator, in one pass.
 *
 * Doing both together is the whole point: a parish with no administrator is a
 * parish whose membership requests land in a queue nobody opens. The wizard
 * therefore requires an administrator rather than offering one.
 */

interface AtbiyaRegistrationDialogProps {
  open: boolean;
  onSaved: () => void;
  onClose: () => void;
}

export const AtbiyaRegistrationDialog: React.FC<AtbiyaRegistrationDialogProps> = ({
  open, onSaved, onClose,
}) => {
  const { roles, roleLabel } = usePermissions();

  const [step, setStep] = useState<1 | 2>(1);
  const [parish, setParish] = useState<AtbiyaInput>(emptyAtbiya());
  const [admin, setAdmin] = useState<AdminDraft>(emptyAdminDraft());
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [roleKey, setRoleKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Set when the parish was created but its administrator was not. */
  const [orphanedParish, setOrphanedParish] = useState<string | null>(null);

  // Roles that can actually run a parish: parish-scoped, able to approve
  // members, and never an admin role — the rules reject an approver granting
  // admin rights, and this account is created by head office for a parish.
  const parishRoles = useMemo(
    () => roles.filter((r) => r.active !== false && !r.isAdmin && r.scope === 'atbiya' && r.canApproveMembers),
    [roles]
  );

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setParish(emptyAtbiya());
    setAdmin(emptyAdminDraft());
    setError(null);
    setOrphanedParish(null);
    hierarchyService.getEntitiesByLevel('Zone')
      .then((z) => setZones(z as ZoneOption[]))
      .catch(() => setZones([]));
  }, [open]);

  useEffect(() => {
    if (!roleKey && parishRoles.length > 0) setRoleKey(parishRoles[0].key);
  }, [parishRoles, roleKey]);

  function goToAdminStep() {
    if (!parish.name.trim()) {
      // Required because getAtbiyas() orders by name — a nameless parish would
      // silently disappear from every list, including the sign-up dropdown.
      return setError('An English name is required.');
    }
    setError(null);
    setStep(2);
  }

  async function handleSubmit() {
    const problem = validateAdminDraft(admin);
    if (problem) return setError(problem);
    if (!roleKey) {
      return setError('No parish-level role is available to assign. Add one in Software Control → Roles first.');
    }

    setSaving(true);
    setError(null);
    try {
      if (await atbiyaAdminService.isUsernameTaken(admin.username)) {
        setSaving(false);
        return setError('That username is already taken. Choose another.');
      }

      // The parish has to exist first: its document id IS the atbiyaId the
      // administrator's account is scoped to.
      const name = parish.name.trim();
      const parishId = orphanedParish
        ?? (await hierarchyService.createAtbiya({ ...parish, name })).id;

      try {
        await atbiyaAdminService.create({ id: parishId, name }, admin, roleKey);
      } catch (adminError) {
        // Deliberately NOT rolled back. Unlike a half-finished sign-up — where
        // a stranded Auth account appears in no queue and helps nobody — a
        // parish record is immediately useful and may already be referenced.
        // Keep it and let the operator add the administrator from the list.
        setOrphanedParish(parishId);
        throw adminError;
      }

      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete the registration.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 ? <Church className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            Register an Atbiya — step {step} of 2
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Parish details. These appear on the public sign-up form, so a member can find and choose this parish before they have an account.'
              : 'The administrator who will approve this parish’s membership requests. Their account is created immediately and can sign in straight away.'}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <AtbiyaForm draft={parish} setDraft={setParish} zones={zones} />
        ) : (
          <div className="space-y-5 py-2">
            {orphanedParish && (
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  <strong>{parish.name.trim()}</strong> was registered, but its administrator
                  account was not created. Fix the problem below and try again — the parish
                  will not be duplicated.
                </span>
              </div>
            )}

            <AtbiyaAdminFields draft={admin} setDraft={setAdmin} disabled={saving} />

            <Field label="Role" hint="Determines what this account can do. Parish-level roles can approve their own members.">
              <Select value={roleKey} onValueChange={setRoleKey} disabled={saving}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {parishRoles.map((r) => (
                    <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 2 ? (
            <Button variant="outline" onClick={() => { setStep(1); setError(null); }} disabled={saving}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          )}
          {step === 1 ? (
            <Button onClick={goToAdminStep}>
              Next: administrator <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {orphanedParish ? 'Create administrator' : 'Register parish'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
