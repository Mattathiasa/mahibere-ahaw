import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { meetingService, type MeetingAudience } from '@/services/meetings';
import { meetingPresetService, type AudiencePreset } from '@/services/meetingPresets';
import { hierarchyService } from '@/services/hierarchy';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * Chooses who a meeting notifies.
 *
 * Two independent axes — which branch of the organisation, and which roles
 * within it — plus a live count, because "notify the right people" is
 * impossible to check without seeing how many that turns out to be.
 *
 * The scope options are limited to the scheduler's own reach, the same way
 * MembershipRequests limits its queue: offering a congregation-scoped user the
 * whole church would promise a broadcast their data access cannot resolve.
 */

interface Entity { id: string; name?: string; nameAmharic?: string; parentId?: string | null }

interface MeetingAudiencePickerProps {
  value: MeetingAudience;
  onChange: (next: MeetingAudience) => void;
  disabled?: boolean;
}

export const MeetingAudiencePicker: React.FC<MeetingAudiencePickerProps> = ({
  value, onChange, disabled = false,
}) => {
  const { roles, roleLabel, myScope, isHeadOffice, myAtbiyaId } = usePermissions();
  const { t } = useLanguage();
  const a = t.admin;

  const [presets, setPresets] = useState<AudiencePreset[]>([]);
  const [dioceses, setDioceses] = useState<Entity[]>([]);
  const [congregations, setCongregations] = useState<Entity[]>([]);
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);

  const assignableRoles = useMemo(() => roles.filter((r) => r.active !== false), [roles]);

  /** My own diocese, via the congregation I belong to. */
  const myDioceseId = useMemo(() => {
    const mine = congregations.find((c) => c.id === myAtbiyaId);
    return mine?.parentId ?? '';
  }, [congregations, myAtbiyaId]);

  useEffect(() => {
    meetingPresetService.get().then(setPresets).catch(() => setPresets([]));
    hierarchyService.getEntitiesByLevel('Zone')
      .then((z) => setDioceses(z as Entity[])).catch(() => setDioceses([]));
    hierarchyService.getAtbiyas()
      .then((a) => setCongregations(a as Entity[])).catch(() => setCongregations([]));
  }, []);

  // Recount whenever the audience changes. Debounced because every keystroke on
  // a picker would otherwise re-read the whole user collection.
  useEffect(() => {
    let cancelled = false;
    setCounting(true);
    const timer = setTimeout(async () => {
      try {
        const people = await meetingService.resolveRecipients(value);
        if (!cancelled) setCount(people.length);
      } catch {
        if (!cancelled) setCount(null);
      } finally {
        if (!cancelled) setCounting(false);
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [value]);

  function applyPreset(id: string) {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    const scope: MeetingAudience['scope'] =
      p.scope === 'diocese' ? { kind: 'diocese', dioceseId: myDioceseId }
      : p.scope === 'congregation' ? { kind: 'congregation', atbiyaId: myAtbiyaId }
      : { kind: 'all' };
    onChange({ scope, roles: [...p.roles] });
  }

  function setScopeKind(kind: MeetingAudience['scope']['kind']) {
    const scope: MeetingAudience['scope'] =
      kind === 'diocese' ? { kind: 'diocese', dioceseId: myDioceseId }
      : kind === 'congregation' ? { kind: 'congregation', atbiyaId: myAtbiyaId }
      : { kind: 'all' };
    onChange({ ...value, scope });
  }

  function toggleRole(key: string) {
    const on = value.roles.includes(key);
    onChange({ ...value, roles: on ? value.roles.filter((r) => r !== key) : [...value.roles, key] });
  }

  const mayPickWholeChurch = isHeadOffice || myScope === 'global';
  const mayPickDiocese = mayPickWholeChurch || myScope === 'zone';

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4 bg-muted/20">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="text-sm font-bold flex items-center gap-2">
          <Users className="h-4 w-4" /> {a.whoIsNotified}
        </Label>
        <Badge variant="secondary" className="text-xs">
          {counting
            ? <><Loader2 className="h-3 w-3 mr-1 inline animate-spin" /> {a.counting}</>
            : count === null ? a.countUnavailable
            : `${a.willNotify} ${count} ${count === 1 ? a.person : a.people}`}
        </Badge>
      </div>

      {presets.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.quickPick}</Label>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.id} type="button" disabled={disabled}
                onClick={() => applyPreset(p.id)}
                className="px-3 py-1.5 rounded-full text-xs font-bold border border-border hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50">
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.partOfChurch}</Label>
          <Select value={value.scope.kind} disabled={disabled}
            onValueChange={(v) => setScopeKind(v as MeetingAudience['scope']['kind'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {mayPickWholeChurch && <SelectItem value="all">{a.wholeChurch}</SelectItem>}
              {mayPickDiocese && <SelectItem value="diocese">{a.aDiocese}</SelectItem>}
              <SelectItem value="congregation">{a.aCongregation}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {value.scope.kind === 'diocese' && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.whichDiocese}</Label>
            <Select
              value={value.scope.dioceseId || 'none'}
              disabled={disabled}
              onValueChange={(v) => onChange({ ...value, scope: { kind: 'diocese', dioceseId: v === 'none' ? '' : v } })}
            >
              <SelectTrigger><SelectValue placeholder={a.selectDiocese} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{a.notChosen}</SelectItem>
                {dioceses.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name ?? d.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {value.scope.kind === 'congregation' && (
          <div className="space-y-1.5">
            <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.whichCongregation}</Label>
            <Select
              value={value.scope.atbiyaId || 'none'}
              disabled={disabled}
              onValueChange={(v) => onChange({ ...value, scope: { kind: 'congregation', atbiyaId: v === 'none' ? '' : v } })}
            >
              <SelectTrigger><SelectValue placeholder={a.selectCongregation} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{a.notChosen}</SelectItem>
                {congregations.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name ?? c.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">
          {a.onlyTheseRoles} {value.roles.length === 0 && <span className="normal-case font-medium opacity-70">{a.noRolesSelected}</span>}
        </Label>
        <div className="flex flex-wrap gap-2">
          {assignableRoles.map((r) => {
            const on = value.roles.includes(r.key);
            return (
              <button key={r.key} type="button" disabled={disabled}
                onClick={() => toggleRole(r.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors disabled:opacity-50 ${
                  on ? 'bg-[#2E5E99] text-white border-[#2E5E99]'
                     : 'border-border hover:border-primary'}`}>
                {roleLabel(r.key)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
