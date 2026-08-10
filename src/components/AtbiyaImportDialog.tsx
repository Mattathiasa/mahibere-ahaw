import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Loader2, TriangleAlert, Upload,
} from 'lucide-react';
import {
  hierarchyService, emptyAtbiya, type Atbiya,
} from '@/services/hierarchy';
import { ATBIYA_REGISTER, type AtbiyaRegisterRow } from '@/data/atbiyaRegister';
import { normalizeEthiopianPhone } from '@/lib/phone';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

/**
 * Bulk-registers the congregations from the church's paper register.
 *
 * A review step rather than a one-click seed, for three reasons: the rows were
 * transcribed from a photograph, congregations are never deleted (only
 * deactivated), and every row is editable here so a reader with the sheet in
 * front of them can correct it before anything is written.
 *
 * Writes go through `hierarchyService.createAtbiya`, so they carry the same
 * audit-log entries and hit the same rules as a manual registration — there is
 * no privileged back door.
 */

interface Row extends AtbiyaRegisterRow {
  selected: boolean;
  /** An existing congregation whose Amharic name matches, if any. */
  existingId?: string;
}

/** Names differ by whitespace and the trailing word አጥቢያ more often than by substance. */
function normalizeName(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').replace(/\s*አጥቢያ\s*$/, '').trim().toLowerCase();
}

interface AtbiyaImportDialogProps {
  open: boolean;
  onImported: () => void;
  onClose: () => void;
}

export const AtbiyaImportDialog: React.FC<AtbiyaImportDialogProps> = ({
  open, onImported, onClose,
}) => {
  const { t } = useLanguage();
  const tx = t.admin;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [failures, setFailures] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDone(null);
    setFailures([]);
    try {
      // Existing congregations, including deactivated ones — re-importing a
      // congregation somebody deliberately deactivated would quietly resurrect
      // it as a duplicate.
      const existing = await hierarchyService.getAtbiyas(true);
      const byName = new Map<string, Atbiya>();
      for (const c of existing) {
        if (c.nameAmharic) byName.set(normalizeName(c.nameAmharic), c);
        if (c.name) byName.set(normalizeName(c.name), c);
      }
      setRows(ATBIYA_REGISTER.map((r) => {
        const hit = byName.get(normalizeName(r.nameAmharic)) ?? byName.get(normalizeName(r.name));
        return { ...r, existingId: hit?.id, selected: !hit };
      }));
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied' ? tx.registryRulesNotDeployed : tx.registryLoadFailed);
      setRows(ATBIYA_REGISTER.map((r) => ({ ...r, selected: true })));
    } finally {
      setLoading(false);
    }
  }, [tx]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const selected = rows.filter((r) => r.selected);
  const alreadyThere = rows.filter((r) => r.existingId).length;

  const duplicatePhones = useMemo(() => {
    const seen = new Map<string, number>();
    for (const r of rows) if (r.phone) seen.set(r.phone, (seen.get(r.phone) ?? 0) + 1);
    return new Set([...seen.entries()].filter(([, n]) => n > 1).map(([p]) => p));
  }, [rows]);

  function edit(no: number, patch: Partial<Row>) {
    setRows((list) => list.map((r) => (r.no === no ? { ...r, ...patch } : r)));
  }

  async function runImport() {
    if (selected.length === 0) return;
    setImporting(true);
    setError(null);
    setProgress(0);
    const failed: string[] = [];
    let created = 0;

    // Sequential rather than Promise.all: each write is audit-logged, and a
    // burst of thirty parallel creates makes a partial failure hard to read.
    for (const r of selected) {
      try {
        await hierarchyService.createAtbiya({
          ...emptyAtbiya(),
          name: r.name.trim(),
          nameAmharic: r.nameAmharic.trim(),
          foundedAt: r.foundedAt.trim(),
          contact: {
            ...emptyAtbiya().contact,
            nameAm: r.leaderAm.trim(),
            phone: r.phone.trim()
              ? normalizeEthiopianPhone(r.phone) ?? r.phone.trim()
              : '',
          },
          active: true,
          isPublic: true,
        });
        created += 1;
      } catch (e) {
        const code = (e as { code?: string })?.code ?? '';
        failed.push(`${r.no}. ${r.nameAmharic}${code === 'permission-denied' ? ' — permission denied' : ''}`);
      }
      setProgress((p) => p + 1);
    }

    setImporting(false);
    setDone(created);
    setFailures(failed);
    if (created > 0) onImported();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> {tx.importTitle}
          </DialogTitle>
          <DialogDescription>{tx.importDesc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {done !== null && (
            <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{done} {tx.importDone}</span>
            </div>
          )}

          {failures.length > 0 && (
            <div className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-1">
              <p className="font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {tx.importFailed}
              </p>
              <ul className="list-disc pl-5">{failures.map((f) => <li key={f}>{f}</li>)}</ul>
            </div>
          )}

          {alreadyThere > 0 && done === null && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{alreadyThere} {tx.importAlreadyThere}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <Checkbox
                    checked={selected.length === rows.length && rows.length > 0}
                    onCheckedChange={(v) =>
                      setRows((list) => list.map((r) => ({ ...r, selected: v === true })))}
                  />
                  {tx.importSelectAll}
                </label>
                <Badge variant="secondary">
                  {selected.length} / {rows.length}
                </Badge>
              </div>

              <div className="rounded-xl border border-border divide-y divide-border">
                {rows.map((r) => (
                  <div key={r.no}
                    className={`p-3 grid gap-2 sm:grid-cols-[auto_1fr_1fr] items-start ${r.existingId ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox checked={r.selected} disabled={importing}
                        onCheckedChange={(v) => edit(r.no, { selected: v === true })} />
                      <span className="text-xs font-mono text-muted-foreground w-6">{r.no}</span>
                    </div>

                    <div className="space-y-1.5">
                      <Input className="h-8 text-sm font-ethiopic" value={r.nameAmharic}
                        disabled={importing} onChange={(e) => edit(r.no, { nameAmharic: e.target.value })} />
                      <Input className="h-8 text-xs" value={r.name}
                        disabled={importing} onChange={(e) => edit(r.no, { name: e.target.value })} />
                      {r.existingId && (
                        <Badge variant="outline" className="text-[10px]">{tx.importExisting}</Badge>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Input className="h-8 text-sm font-ethiopic" value={r.leaderAm}
                        disabled={importing} onChange={(e) => edit(r.no, { leaderAm: e.target.value })} />
                      <div className="flex gap-1.5">
                        <Input className="h-8 text-xs font-mono" value={r.phone}
                          disabled={importing} onChange={(e) => edit(r.no, { phone: e.target.value })} />
                        <Input className="h-8 text-xs font-ethiopic" value={r.foundedAt}
                          placeholder={tx.foundedAt}
                          disabled={importing} onChange={(e) => edit(r.no, { foundedAt: e.target.value })} />
                      </div>
                      {duplicatePhones.has(r.phone) && (
                        <p className="text-[10px] text-amber-600">{tx.importDuplicatePhone}</p>
                      )}
                      {!r.foundedAt.trim() && (
                        <p className="text-[10px] text-muted-foreground">{tx.importNoDate}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <p className="text-[11px] text-muted-foreground">{tx.importNote}</p>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={onClose} disabled={importing}>{tx.close}</Button>
            <Button onClick={runImport} disabled={importing || loading || selected.length === 0}>
              {importing
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{progress} / {selected.length}</>
                : <><Upload className="h-4 w-4 mr-2" />{tx.importAction} ({selected.length})</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
