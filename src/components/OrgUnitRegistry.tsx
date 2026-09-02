import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Loader2, Pencil, Phone, Plus, ShieldOff, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  orgUnitService, emptyOrgUnit, LEVEL_META,
  type OrgLevel, type OrgUnit, type OrgUnitInput,
} from '@/services/orgUnits';
import { isValidPhone, normalizeEthiopianPhone } from '@/lib/phone';
import { useLanguage } from '@/contexts/LanguageContext';
import { Field } from '@/components/AtbiyaForm';
import { LocationPicker } from '@/components/LocationPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * One registry, parameterised by level.
 *
 * Dioceses, Woreda offices and departments differ only in what they are called
 * and what they hang off, so they share this rather than three near-identical
 * screens. Congregations and Mahedherat keep their own screens — they carry
 * bank accounts, administrators, an importer and map pins that do not
 * generalise.
 *
 * Creating any level above a congregation is an `isAdmin()` action in
 * firestore.rules, so `canEdit` must reflect that: offering the button to
 * somebody the server will refuse is exactly what this codebase avoids.
 */

interface OrgUnitRegistryProps {
  level: OrgLevel;
  /** Units of the parent level, offered in the "reports to" picker. */
  parents?: OrgUnit[];
  /** Counts of the next level down, keyed by unit id, shown as a badge. */
  childCounts?: Record<string, number>;
  childCountLabel?: string;
  canEdit: boolean;
  /** Called after any write, so the page can refresh counts elsewhere. */
  onChanged?: () => void;
}

export const OrgUnitRegistry: React.FC<OrgUnitRegistryProps> = ({
  level, parents = [], childCounts = {}, childCountLabel, canEdit, onChanged,
}) => {
  const { t } = useLanguage();
  const tx = t.admin;

  const [units, setUnits] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OrgUnitInput>(emptyOrgUnit());
  const [saving, setSaving] = useState(false);

  const singular = tx[`level${level}One` as keyof typeof tx] as string;
  const parentLevel = LEVEL_META[level].parent;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUnits(await orgUnitService.listByLevel(level, true));
    } catch {
      setError(tx.unitLoadFailed);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [level, tx]);

  useEffect(() => { load(); }, [load]);

  function set<K extends keyof OrgUnitInput>(key: K, value: OrgUnitInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
  }

  function startNew() {
    setDraft(emptyOrgUnit());
    setEditingId('new');
    setNotice(null);
    setError(null);
  }

  function startEdit(u: OrgUnit) {
    const { id, level: _level, ...rest } = u;
    setDraft({ ...emptyOrgUnit(), ...rest });
    setEditingId(id);
    setNotice(null);
    setError(null);
  }

  async function save() {
    if (!draft.name.trim()) return setError(tx.unitNameRequired);
    if (draft.leaderPhone?.trim() && !isValidPhone(draft.leaderPhone)) {
      return setError(tx.badLeaderPhone);
    }
    setSaving(true);
    setError(null);
    try {
      const payload: OrgUnitInput = {
        ...draft,
        name: draft.name.trim(),
        leaderPhone: draft.leaderPhone?.trim()
          ? normalizeEthiopianPhone(draft.leaderPhone) ?? draft.leaderPhone.trim()
          : '',
      };
      if (editingId === 'new') {
        await orgUnitService.create(level, payload);
        setNotice(`${payload.name} ${tx.unitAdded}`);
      } else if (editingId) {
        await orgUnitService.update(editingId, payload);
        setNotice(`${payload.name} ${tx.unitSaved}`);
      }
      setEditingId(null);
      await load();
      onChanged?.();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied'
        ? tx.unitDenied
        : e instanceof Error ? e.message : tx.unitSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(u: OrgUnit) {
    const deactivating = u.active !== false;
    setBusyId(u.id);
    setError(null);
    try {
      await orgUnitService.setActive(u.id, !deactivating);
      await load();
      onChanged?.();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied' ? tx.unitDenied : tx.unitSaveFailed);
    } finally {
      setBusyId(null);
    }
  }

  const parentName = (id?: string | null) =>
    parents.find((p) => p.id === id)?.name ?? '';

  const editor = (
    <div className="p-4 rounded-xl border border-border space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">
          {editingId === 'new' ? `${tx.newUnit} ${singular}` : `${tx.editUnit} — ${draft.name || singular}`}
        </p>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={saving}
          onClick={() => { setEditingId(null); setError(null); }}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`${tx.nameEnglish} *`}>
          <Input value={draft.name} disabled={saving}
            onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label={tx.nameAmharic}>
          <Input className="font-ethiopic" value={draft.nameAmharic ?? ''} disabled={saving}
            onChange={(e) => set('nameAmharic', e.target.value)} />
        </Field>
        {parentLevel && parents.length > 0 && (
          <Field label={tx.parentUnit}>
            <Select value={draft.parentId ?? 'none'} disabled={saving}
              onValueChange={(v) => set('parentId', v === 'none' ? null : v)}>
              <SelectTrigger><SelectValue placeholder={tx.notAssigned} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{tx.notAssigned}</SelectItem>
                {parents.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}{p.nameAmharic ? ` / ${p.nameAmharic}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field label={tx.foundedAt} hint={tx.foundedAtHint}>
          <Input className="font-ethiopic" value={draft.foundedAt ?? ''} disabled={saving}
            onChange={(e) => set('foundedAt', e.target.value)} placeholder="ነሐሴ 25/2008 ዓ.ም." />
        </Field>
        <Field label={tx.leaderName}>
          <Input className="font-ethiopic" value={draft.leaderName ?? ''} disabled={saving}
            onChange={(e) => set('leaderName', e.target.value)} />
        </Field>
        <Field label={tx.phone}>
          <Input type="tel" value={draft.leaderPhone ?? ''} disabled={saving}
            onChange={(e) => set('leaderPhone', e.target.value)} placeholder="0911 22 33 44" />
        </Field>
        <Field label={tx.entityLocation}>
          <Input value={draft.location ?? ''} disabled={saving}
            onChange={(e) => set('location', e.target.value)} />
        </Field>
      </div>

      {/*
        The pin, which is what puts this body on the church-wide map. Separate
        from the free-text location above: that is a written address for a
        reader, this is a coordinate for the map, and neither substitutes for
        the other.
      */}
      <LocationPicker
        value={{ lat: draft.lat, lng: draft.lng }}
        onChange={(next) => setDraft((d) => ({ ...d, lat: next?.lat, lng: next?.lng }))}
        disabled={saving}
        label={tx.unitLocationPin}
        hint={tx.unitLocationPinHint}
      />

      <Field label={tx.notes}>
        <Textarea rows={2} value={draft.description ?? ''} disabled={saving}
          onChange={(e) => set('description', e.target.value)} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={saving}
          onClick={() => { setEditingId(null); setError(null); }}>{tx.cancel}</Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {editingId === 'new' ? tx.addUnit : tx.save}
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
      ) : units.length === 0 && editingId === null ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="font-medium">{tx.noUnitsYet}</p>
          <p className="text-sm">{tx.noUnitsYetDesc}</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {units.map((u) => {
            if (editingId === u.id) return <div key={u.id}>{editor}</div>;
            const inactive = u.active === false;
            const kids = childCounts[u.id] ?? 0;
            return (
              <motion.div key={u.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="p-3 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-[220px] space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold">{u.name}</span>
                    {u.nameAmharic && (
                      <span className="text-sm text-muted-foreground font-ethiopic">{u.nameAmharic}</span>
                    )}
                    {inactive && <Badge variant="secondary" className="text-[10px]">{tx.inactive}</Badge>}
                    {childCountLabel && (
                      <Badge variant="outline" className="text-[10px]">{kids} {childCountLabel}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {parentLevel && u.parentId && (
                      <p>{tx.parentUnit}: {parentName(u.parentId)}</p>
                    )}
                    {u.leaderName && (
                      <p className="flex items-center gap-1.5 font-ethiopic">
                        <Phone className="h-3 w-3" /> {u.leaderName}
                        {u.leaderPhone ? ` · ${u.leaderPhone}` : ''}
                      </p>
                    )}
                    {u.foundedAt && <p className="font-ethiopic">{tx.foundedAt}: {u.foundedAt}</p>}
                    {u.location && <p>{u.location}</p>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={busyId === u.id}
                      onClick={() => startEdit(u)}>
                      <Pencil className="h-4 w-4 mr-1" /> {tx.edit}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busyId === u.id}
                      className={inactive ? '' : 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10'}
                      onClick={() => toggleActive(u)}>
                      {busyId === u.id
                        ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        : <ShieldOff className="h-4 w-4 mr-1" />}
                      {inactive ? tx.reactivate : tx.deactivate}
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
          <Plus className="h-4 w-4 mr-2" /> {tx.addUnit} {singular}
        </Button>
      )}
    </div>
  );
};
