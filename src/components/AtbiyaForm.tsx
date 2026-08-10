import React from 'react';
import { Plus, Trash2, Landmark } from 'lucide-react';
import type { AtbiyaInput, AtbiyaBankAccount } from '@/services/hierarchy';
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * The parish field set, on its own so three callers can share it: the editor
 * dialog (head office editing any parish), the registration wizard (step 1) and
 * the parish's own console at /my-atbiya.
 *
 * Purely presentational — it owns no state and performs no writes.
 */

export function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

export interface ZoneOption { id: string; name?: string; nameAmharic?: string; parentId?: string | null }

interface AtbiyaFormProps {
  draft: AtbiyaInput;
  setDraft: React.Dispatch<React.SetStateAction<AtbiyaInput>>;
  zones: ZoneOption[];
  /** Woredas to choose from. Empty hides the field entirely. */
  woredas?: ZoneOption[];
  /** The parish console hides these: the rules reject moving a parish in the tree. */
  showPlacement?: boolean;
  /** The parish console hides these: they are head-office decisions. */
  showVisibility?: boolean;
  disabled?: boolean;
}

export const AtbiyaForm: React.FC<AtbiyaFormProps> = ({
  draft, setDraft, zones, woredas = [], showPlacement = true, showVisibility = true, disabled = false,
}) => {
  const { t } = useLanguage();
  const a = t.admin;
  const pe = t.people;
  function set<K extends keyof AtbiyaInput>(key: K, value: AtbiyaInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  function setAddress(lang: 'en' | 'am', value: string) {
    setDraft((d) => ({ ...d, address: { ...d.address, [lang]: value } }));
  }
  function setContact(key: keyof NonNullable<AtbiyaInput['contact']>, value: string) {
    setDraft((d) => ({ ...d, contact: { ...d.contact, [key]: value } }));
  }
  function setBank(i: number, key: keyof AtbiyaBankAccount, value: string) {
    setDraft((d) => {
      const banks = [...(d.bankAccounts ?? [])];
      banks[i] = { ...banks[i], [key]: value };
      return { ...d, bankAccounts: banks };
    });
  }
  function addBank() {
    setDraft((d) => ({
      ...d,
      bankAccounts: [...(d.bankAccounts ?? []), { bankName: '', accountNumber: '' }],
    }));
  }
  function removeBank(i: number) {
    setDraft((d) => ({ ...d, bankAccounts: (d.bankAccounts ?? []).filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-5 py-2">
      <Divider label={a.identity} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={`${a.nameEnglish} *`}>
          <Input value={draft.name} onChange={(e) => set('name', e.target.value)}
            disabled={disabled} placeholder={pe.parishNameExample} />
        </Field>
        <Field label={a.nameAmharic}>
          <Input value={draft.nameAmharic ?? ''} onChange={(e) => set('nameAmharic', e.target.value)}
            disabled={disabled} placeholder="ቢሾፍቱ አጥቢያ" />
        </Field>
        <Field label={a.cityEnglish}>
          <Input value={draft.cityEn ?? ''} onChange={(e) => set('cityEn', e.target.value)}
            disabled={disabled} placeholder={pe.cityExample} />
        </Field>
        <Field label={a.cityAmharic}>
          <Input value={draft.cityAm ?? ''} onChange={(e) => set('cityAm', e.target.value)}
            disabled={disabled} placeholder="ቢሾፍቱ" />
        </Field>
        <Field label={a.foundedAt} hint={a.foundedAtHint}>
          <Input value={draft.foundedAt ?? ''} onChange={(e) => set('foundedAt', e.target.value)}
            disabled={disabled} placeholder="ነሐሴ 25/2008 ዓ.ም." />
        </Field>
      </div>
      {showPlacement && (
        <Field label={a.diocese} hint={a.dioceseHint}>
          <Select
            value={draft.parentId ?? 'none'}
            disabled={disabled}
            onValueChange={(v) => set('parentId', v === 'none' ? null : v)}
          >
            <SelectTrigger><SelectValue placeholder={a.selectDiocese} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{a.notAssigned}</SelectItem>
              {zones.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.name}{z.nameAmharic ? ` / ${z.nameAmharic}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      )}
      {showPlacement && woredas.length > 0 && (
        <Field label={a.woredaOffice} hint={a.woredaOfficeHint}>
          <Select
            value={draft.woredaId ?? 'none'}
            disabled={disabled}
            onValueChange={(v) => set('woredaId', v === 'none' ? null : v)}
          >
            <SelectTrigger><SelectValue placeholder={a.notAssigned} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{a.notAssigned}</SelectItem>
              {/* Only the Woredas of the chosen Diocese — offering every
                  Woreda in the church would invite a mismatched pair. */}
              {woredas
                .filter((w) => !draft.parentId || w.parentId === draft.parentId)
                .map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}{w.nameAmharic ? ` / ${w.nameAmharic}` : ''}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Divider label={a.address} />
      <Field label={a.addressEnglish}>
        <Textarea rows={2} value={draft.address?.en ?? ''} onChange={(e) => setAddress('en', e.target.value)}
          disabled={disabled}
          placeholder={pe.addressExample} />
      </Field>
      <Field label={a.addressAmharic}>
        <Textarea rows={2} value={draft.address?.am ?? ''} onChange={(e) => setAddress('am', e.target.value)}
          disabled={disabled}
          placeholder="ቢሾፍቱ ዝቋላ አደባባይ አካባቢ ከአዋሽ ሆቴል ፊት ለፊት 100 ላይ" />
      </Field>
      <Field label={a.mapLink} hint={a.mapLinkHint}>
        <Input value={draft.mapUrl ?? ''} onChange={(e) => set('mapUrl', e.target.value)}
          disabled={disabled} placeholder="https://maps.app.goo.gl/…" />
      </Field>

      <Divider label={a.contactPerson} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={a.contactNameEn}>
          <Input value={draft.contact?.nameEn ?? ''} onChange={(e) => setContact('nameEn', e.target.value)}
            disabled={disabled} placeholder={pe.adminNameExample} />
        </Field>
        <Field label={a.contactNameAm}>
          <Input value={draft.contact?.nameAm ?? ''} onChange={(e) => setContact('nameAm', e.target.value)}
            disabled={disabled} placeholder="አዲስሕይወት ተሾመ ወርቁ" />
        </Field>
        <Field label={a.phone}>
          <Input value={draft.contact?.phone ?? ''} onChange={(e) => setContact('phone', e.target.value)}
            disabled={disabled} placeholder="0938714929" />
        </Field>
        <Field label={a.altPhone}>
          <Input value={draft.contact?.phone2 ?? ''} onChange={(e) => setContact('phone2', e.target.value)}
            disabled={disabled} />
        </Field>
      </div>
      <Field label={a.email}>
        <Input type="email" value={draft.contact?.email ?? ''} onChange={(e) => setContact('email', e.target.value)}
          disabled={disabled} placeholder={pe.adminEmailExample} />
      </Field>

      <Divider label={a.bankAccounts} />
      <div className="space-y-3">
        {(draft.bankAccounts ?? []).map((b, i) => (
          <div key={i} className="p-3 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" /> {a.accountNumber} {i + 1}
              </span>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                disabled={disabled} onClick={() => removeBank(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input value={b.bankName} onChange={(e) => setBank(i, 'bankName', e.target.value)}
                disabled={disabled} placeholder={pe.bankExample} />
              <Input value={b.bankNameAmharic ?? ''} onChange={(e) => setBank(i, 'bankNameAmharic', e.target.value)}
                disabled={disabled} placeholder="ብርሃን ባንክ" />
              <Input value={b.accountNumber} onChange={(e) => setBank(i, 'accountNumber', e.target.value)}
                disabled={disabled} placeholder="1602420073978" className="font-mono" />
              <Input value={b.accountHolder ?? ''} onChange={(e) => setBank(i, 'accountHolder', e.target.value)}
                disabled={disabled} placeholder={`${a.accountHolder} (${a.optional})`} />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addBank} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" /> {a.addBankAccount}
        </Button>
      </div>

      <Divider label={`${a.photo} & ${a.notes}`} />
      <CloudinaryImageUpload
        value={draft.photoUrl ?? ''}
        onChange={(url) => set('photoUrl', url)}
        folder="mahibere-ahaw/atbiya"
        variant="wide"
      />
      <Field label={a.notes}>
        <Textarea rows={2} value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)}
          disabled={disabled} />
      </Field>

      {showVisibility && (
        <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">{a.active}</p>
              <p className="text-xs text-muted-foreground">
                {a.activeToggleDesc}
              </p>
            </div>
            <Switch checked={draft.active !== false} disabled={disabled}
              onCheckedChange={(v) => set('active', v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold">{a.publicToggle}</p>
              <p className="text-xs text-muted-foreground">
                {a.publicToggleDesc}
              </p>
            </div>
            <Switch checked={draft.isPublic !== false} disabled={disabled}
              onCheckedChange={(v) => set('isPublic', v)} />
          </div>
        </div>
      )}
    </div>
  );
};
