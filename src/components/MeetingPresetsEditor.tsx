import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, CalendarClock, CheckCircle2, Loader2, Plus, RotateCcw, Save, Trash2,
} from 'lucide-react';
import {
  meetingPresetService, DEFAULT_PRESETS, type AudiencePreset,
} from '@/services/meetingPresets';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * The reusable meeting audiences offered as one-click choices when scheduling.
 *
 * Scope is relative to whoever is scheduling — "My Diocese" resolves to the
 * scheduler's own — so one preset serves every diocese rather than needing an
 * entry each.
 */
export const MeetingPresetsEditor: React.FC = () => {
  const { roles, roleLabel } = usePermissions();
  const { user } = useAuth();
  const { t } = useLanguage();
  const a = t.admin;

  const [presets, setPresets] = useState<AudiencePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPresets(await meetingPresetService.get());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(id: string, patch: Partial<AudiencePreset>) {
    setPresets((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setNotice(null);
  }

  function toggleRole(id: string, key: string) {
    setPresets((list) => list.map((p) => {
      if (p.id !== id) return p;
      const on = p.roles.includes(key);
      return { ...p, roles: on ? p.roles.filter((r) => r !== key) : [...p.roles, key] };
    }));
    setNotice(null);
  }

  function add() {
    setPresets((list) => [...list, {
      id: `preset-${Date.now()}`,
      label: a.newAudience,
      scope: 'all',
      roles: [],
    }]);
    setNotice(null);
  }

  async function save() {
    if (presets.some((p) => !p.label.trim())) {
      return setError(a.audienceNeedsName);
    }
    setSaving(true);
    setError(null);
    try {
      await meetingPresetService.save(presets, user?.email ?? 'admin');
      setNotice(a.audiencesSaved);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied'
        ? a.audienceSaveDenied
        : e instanceof Error ? e.message : a.permissionDenied);
    } finally {
      setSaving(false);
    }
  }

  const activeRoles = roles.filter((r) => r.active !== false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" /> {a.meetingAudiences}
          </CardTitle>
          <CardDescription>
            {a.meetingAudiencesDesc}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={saving}
            onClick={() => { setPresets(DEFAULT_PRESETS); setNotice(null); }}>
            <RotateCcw className="h-4 w-4 mr-1" /> {a.reset}
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {a.save}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
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

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : presets.map((p) => (
          <div key={p.id} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.audienceName}</Label>
                <Input value={p.label} onChange={(e) => update(p.id, { label: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.audienceScope}</Label>
                <Select value={p.scope}
                  onValueChange={(v) => update(p.id, { scope: v as AudiencePreset['scope'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{a.wholeChurch}</SelectItem>
                    <SelectItem value="diocese">{a.schedulersDiocese}</SelectItem>
                    <SelectItem value="congregation">{a.schedulersCongregation}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">
                {a.roles}{p.roles.length === 0 && (
                  <span className="normal-case font-medium opacity-70"> {a.noRolesEveryone}</span>
                )}
              </Label>
              <div className="flex flex-wrap gap-2">
                {activeRoles.map((r) => {
                  const on = p.roles.includes(r.key);
                  return (
                    <button key={r.key} type="button" onClick={() => toggleRole(p.id, r.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                        on ? 'bg-[#2E5E99] text-white border-[#2E5E99]' : 'border-border hover:border-primary'}`}>
                      {roleLabel(r.key)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-500/10"
                onClick={() => setPresets((list) => list.filter((x) => x.id !== p.id))}>
                <Trash2 className="h-4 w-4 mr-1" /> {a.remove}
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-2" /> {a.addAudience}
        </Button>
      </CardContent>
    </Card>
  );
};
