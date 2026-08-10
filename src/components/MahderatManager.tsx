import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Clock, Loader2, MapPin, Pencil, Phone, Plus,
  ShieldOff, Users, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  mahderatService, emptyMahder, mahderCoords, MEETING_DAYS,
  type Mahder, type MahderInput,
} from '@/services/mahderat';
import { isValidPhone, normalizeEthiopianPhone } from '@/lib/phone';
import type { LatLng } from '@/lib/geo';
import { Field } from '@/components/AtbiyaForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { LocationPicker } from '@/components/LocationPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * The Mahedherat of one congregation.
 *
 * A congregation controls its own groups: `firestore.rules` lets an account
 * holding `canEditOwnAtbiya` create and edit `hierarchy` documents whose
 * `parentId` is their own congregation. Head office reaches the same component
 * through the Congregation Registry.
 *
 * The pin is what makes the member-facing suggestion work — without one, a
 * group still exists and can still be joined, it just never gets ranked.
 */

interface MahderatManagerProps {
  atbiyaId: string;
  atbiyaName?: string;
  /** False renders the list read-only. */
  canEdit?: boolean;
}

export const MahderatManager: React.FC<MahderatManagerProps> = ({
  atbiyaId, atbiyaName, canEdit = true,
}) => {
  const { t } = useLanguage();
  const a = t.admin;
  const [groups, setGroups] = useState<Mahder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MahderInput>(emptyMahder(atbiyaId));
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!atbiyaId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      setGroups(await mahderatService.listByCongregation(atbiyaId, true));
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied'
        ? a.mahderatRulesNotDeployed
        : a.mahderatLoadFailed);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [atbiyaId, a]);

  useEffect(() => { load(); }, [load]);

  function set<K extends keyof MahderInput>(key: K, value: MahderInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  function startNew() {
    setDraft(emptyMahder(atbiyaId));
    setEditingId('new');
    setNotice(null);
    setError(null);
  }

  function startEdit(m: Mahder) {
    const { id, level, ...rest } = m;
    setDraft({ ...emptyMahder(atbiyaId), ...rest });
    setEditingId(id);
    setNotice(null);
    setError(null);
  }

  function setPin(next: LatLng | null) {
    setDraft((d) => ({ ...d, lat: next?.lat, lng: next?.lng }));
  }

  async function save() {
    if (!draft.name.trim()) return setError(a.groupNameRequired);
    if (draft.leaderPhone?.trim() && !isValidPhone(draft.leaderPhone)) {
      return setError(a.badLeaderPhone);
    }

    setSaving(true);
    setError(null);
    try {
      const payload: MahderInput = {
        ...draft,
        name: draft.name.trim(),
        leaderPhone: draft.leaderPhone?.trim()
          ? normalizeEthiopianPhone(draft.leaderPhone) ?? draft.leaderPhone.trim()
          : '',
      };
      if (editingId === 'new') {
        await mahderatService.create(payload);
        setNotice(`${payload.name} ${a.mahderAdded}`);
      } else if (editingId) {
        await mahderatService.update(editingId, payload);
        setNotice(`${payload.name} ${a.mahderSaved}`);
      }
      setEditingId(null);
      await load();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied'
        ? a.mahderDenied
        : e instanceof Error ? e.message : a.mahderSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: Mahder) {
    const deactivating = m.active !== false;
    setBusyId(m.id);
    setError(null);
    try {
      await mahderatService.setActive(m.id, !deactivating);
      setNotice(deactivating ? `${m.name} ${a.mahderHidden}` : `${m.name} ${a.mahderShown}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : a.mahderUpdateFailed);
    } finally {
      setBusyId(null);
    }
  }

  const editor = (
    <div className="p-4 rounded-xl border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold flex items-center gap-2">
          <Users className="h-4 w-4" />
          {editingId === 'new' ? a.newMahder : `${a.editingMahder} ${draft.name || a.thisGroup}`}
        </p>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={saving}
          onClick={() => { setEditingId(null); setError(null); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`${a.nameEnglish} *`}>
          <Input value={draft.name} disabled={saving}
            onChange={(e) => set('name', e.target.value)} placeholder={a.mahderNameExample} />
        </Field>
        <Field label={a.nameAmharic}>
          <Input value={draft.nameAmharic ?? ''} disabled={saving}
            onChange={(e) => set('nameAmharic', e.target.value)} placeholder="ቦሌ ማህደር" />
        </Field>
        <Field label={a.meetingDay}>
          <Select value={draft.meetingDay || 'none'} disabled={saving}
            onValueChange={(v) => set('meetingDay', v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder={a.notSet} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{a.notSet}</SelectItem>
              {MEETING_DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label={a.meetingTime}>
          <Input type="time" value={draft.meetingTime ?? ''} disabled={saving}
            onChange={(e) => set('meetingTime', e.target.value)} />
        </Field>
        <Field label={a.leader}>
          <Input value={draft.leaderName ?? ''} disabled={saving}
            onChange={(e) => set('leaderName', e.target.value)} placeholder={t.people.personNameExample} />
        </Field>
        <Field label={a.leaderPhone}>
          <Input type="tel" value={draft.leaderPhone ?? ''} disabled={saving}
            onChange={(e) => set('leaderPhone', e.target.value)} placeholder="0911 22 33 44" />
        </Field>
        <Field label={a.landmarkEnglish} hint={a.landmarkHint}>
          <Input value={draft.locationLabel ?? ''} disabled={saving}
            onChange={(e) => set('locationLabel', e.target.value)}
            placeholder={a.landmarkExample} />
        </Field>
        <Field label={a.landmarkAmharic}>
          <Input value={draft.locationLabelAm ?? ''} disabled={saving}
            onChange={(e) => set('locationLabelAm', e.target.value)}
            placeholder="ቦሌ መድኃኔዓለም አካባቢ" />
        </Field>
      </div>

      <LocationPicker
        value={{ lat: draft.lat, lng: draft.lng }}
        onChange={setPin}
        disabled={saving}
        label={a.whereItMeets}
        hint={a.whereItMeetsHint}
      />

      <Field label={a.notes}>
        <Textarea rows={2} value={draft.description ?? ''} disabled={saving}
          onChange={(e) => set('description', e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={saving}
          onClick={() => { setEditingId(null); setError(null); }}>{a.cancel}</Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {editingId === 'new' ? a.addMahder : a.save}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
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
      ) : groups.length === 0 && editingId === null ? (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">{a.noMahderatYet}</p>
          <p className="text-sm max-w-md mx-auto">
            {a.noMahderatYetDesc}
          </p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {groups.map((m) => {
            const inactive = m.active === false;
            const pin = mahderCoords(m);
            if (editingId === m.id) return <div key={m.id}>{editor}</div>;
            return (
              <motion.div key={m.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-[220px] space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{m.name}</span>
                    {m.nameAmharic && (
                      <span className="text-sm text-muted-foreground font-ethiopic">{m.nameAmharic}</span>
                    )}
                    {inactive && <Badge variant="secondary" className="text-[10px]">{a.hidden}</Badge>}
                    {!pin && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">
                        {a.noPin}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {(m.locationLabelAm || m.locationLabel) && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {m.locationLabelAm || m.locationLabel}
                      </p>
                    )}
                    {(m.meetingDay || m.meetingTime) && (
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {[m.meetingDay, m.meetingTime].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {m.leaderName && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3" /> {m.leaderName}{m.leaderPhone ? ` · ${m.leaderPhone}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={busyId === m.id}
                      onClick={() => startEdit(m)}>
                      <Pencil className="h-4 w-4 mr-1" /> {a.edit}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === m.id}
                      className={inactive ? '' : 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10'}
                      onClick={() => toggleActive(m)}>
                      {busyId === m.id
                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        : <ShieldOff className="h-4 w-4 mr-1" />}
                      {inactive ? a.show : a.hide}
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {editingId === 'new' && editor}

      {canEdit && editingId === null && (
        <Button variant="outline" size="sm" onClick={startNew}>
          <Plus className="h-4 w-4 mr-2" /> {a.addMahder}
        </Button>
      )}
    </div>
  );
};
