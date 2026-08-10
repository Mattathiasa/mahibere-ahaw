import React, { useEffect, useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import type { Role, RoleScope } from '@/services/roleRegistry';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { LANGUAGE_CYCLE, LANGUAGE_ENDONYM } from '@/i18n/languages';
import type { Language } from '@/i18n/translations';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type ScopeStringKey = 'scopeGlobal' | 'scopeDiocese' | 'scopeCongregation' | 'scopeMahder';
type ScopeHintKey = 'scopeGlobalHint' | 'scopeDioceseHint' | 'scopeCongregationHint' | 'scopeMahderHint';

const SCOPES: { value: RoleScope; labelKey: ScopeStringKey; hintKey: ScopeHintKey }[] = [
  { value: 'global', labelKey: 'scopeGlobal', hintKey: 'scopeGlobalHint' },
  { value: 'zone', labelKey: 'scopeDiocese', hintKey: 'scopeDioceseHint' },
  { value: 'atbiya', labelKey: 'scopeCongregation', hintKey: 'scopeCongregationHint' },
  { value: 'mahder', labelKey: 'scopeMahder', hintKey: 'scopeMahderHint' },
];

const COLORS = ['indigo', 'violet', 'blue', 'cyan', 'emerald', 'amber', 'rose', 'slate'];

const LANGS: { code: Language; label: string }[] = LANGUAGE_CYCLE.map((code) => ({
  code,
  label: LANGUAGE_ENDONYM[code],
}));

const BLANK: Role = {
  key: '', labels: {}, description: '', scope: 'atbiya', permissions: [],
  isAdmin: false, canApproveMembers: false, isSystem: false, color: 'slate', active: true,
};

interface RoleEditorDialogProps {
  open: boolean;
  /** null creates a new role; a Role edits it in place. */
  role: Role | null;
  /** Keys already in use, so a new role cannot collide. */
  existingKeys: string[];
  /** How many accounts currently carry this role, shown as a delete warning. */
  userCount?: number;
  onSave: (role: Role) => void;
  onClose: () => void;
}

export const RoleEditorDialog: React.FC<RoleEditorDialogProps> = ({
  open, role, existingKeys, userCount = 0, onSave, onClose,
}) => {
  const { t } = useLanguage();
  const a = t.admin;
  const [draft, setDraft] = useState<Role>(BLANK);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(role ? { ...role, labels: { ...role.labels } } : BLANK);
    setError(null);
  }, [role, open]);

  const isNew = role === null;

  function set<K extends keyof Role>(key: K, value: Role[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function setLabel(code: 'en' | 'am' | 'om' | 'ti', value: string) {
    setDraft((d) => ({ ...d, labels: { ...d.labels, [code]: value } }));
  }

  function handleSubmit() {
    const key = draft.key.trim();
    if (!key) return setError(a.roleKeyRequired);
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(key)) {
      return setError(a.roleKeyFormat);
    }
    if (isNew && existingKeys.includes(key)) return setError(`The key "${key}" is already in use.`);
    if (!draft.labels.en?.trim()) return setError(a.englishLabelRequired);
    onSave({ ...draft, key });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNew ? a.addRole : a.editRole}
            {draft.isSystem && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Lock className="h-3 w-3" /> {a.builtIn}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {a.roleDialogDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {a.roleKey}
            </Label>
            <Input
              value={draft.key}
              disabled={!isNew}
              onChange={(e) => set('key', e.target.value)}
              placeholder={t.admin.roleKeyExample}
            />
            <p className="text-[11px] text-muted-foreground">
              {isNew
                ? 'Stored on every account with this role. It cannot be changed later.'
                : 'The key is permanent — existing accounts reference it.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LANGS.map(({ code, label }) => (
              <div key={code} className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {label} label{code === 'en' && ' *'}
                </Label>
                <Input value={draft.labels[code] ?? ''} onChange={(e) => setLabel(code, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {a.description}
            </Label>
            <Textarea rows={2} value={draft.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {a.dataScope}
              </Label>
              <Select value={draft.scope} onValueChange={(v) => set('scope', v as RoleScope)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{a[s.labelKey]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {(() => { const k = SCOPES.find((s) => s.value === draft.scope)?.hintKey; return k ? a[k] : ''; })()}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {a.badgeColour}
              </Label>
              <Select value={draft.color} onValueChange={(v) => set('color', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLORS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">{a.adminAccess}</p>
                <p className="text-xs text-muted-foreground">
                  {a.adminAccessDesc}
                </p>
              </div>
              <Switch checked={draft.isAdmin} onCheckedChange={(v) => set('isAdmin', v)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">{a.approveRequests}</p>
                <p className="text-xs text-muted-foreground">
                  {a.canApproveHint}
                </p>
              </div>
              <Switch checked={draft.canApproveMembers} onCheckedChange={(v) => set('canApproveMembers', v)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">{t.admin.active}</p>
                <p className="text-xs text-muted-foreground">
                  Inactive roles stay assignable to existing accounts but are hidden from pickers.
                </p>
              </div>
              <Switch checked={draft.active} onCheckedChange={(v) => set('active', v)} />
            </div>
          </div>

          {!isNew && userCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {userCount} account{userCount === 1 ? '' : 's'} currently use this role.
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t.common.cancel}</Button>
          <Button onClick={handleSubmit}>{isNew ? t.admin.addRole : t.admin.saveRole}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
