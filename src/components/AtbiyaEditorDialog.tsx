import React, { useEffect, useState } from 'react';
import { Plus, Trash2, AlertCircle, Loader2, Landmark } from 'lucide-react';
import {
  hierarchyService, emptyAtbiya,
  type Atbiya, type AtbiyaInput, type AtbiyaBankAccount,
} from '@/services/hierarchy';
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

interface ZoneOption { id: string; name?: string; nameAmharic?: string }

interface AtbiyaEditorDialogProps {
  open: boolean;
  /** null creates a new parish. */
  atbiya: Atbiya | null;
  onSaved: () => void;
  onClose: () => void;
}

export const AtbiyaEditorDialog: React.FC<AtbiyaEditorDialogProps> = ({
  open, atbiya, onSaved, onClose,
}) => {
  const [draft, setDraft] = useState<AtbiyaInput>(emptyAtbiya());
  const [zones, setZones] = useState<ZoneOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (atbiya) {
      const { id, level, ...rest } = atbiya;
      setDraft({ ...emptyAtbiya(), ...rest });
    } else {
      setDraft(emptyAtbiya());
    }
    hierarchyService.getEntitiesByLevel('Zone')
      .then((z) => setZones(z as ZoneOption[]))
      .catch(() => setZones([]));
  }, [open, atbiya]);

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

  async function handleSubmit() {
    if (!draft.name.trim()) {
      // Required because getAtbiyas() orders by name — a nameless parish would
      // silently disappear from every list, including the sign-up dropdown.
      return setError('An English name is required.');
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { ...draft, name: draft.name.trim() };
      if (atbiya) await hierarchyService.updateAtbiya(atbiya.id, payload);
      else await hierarchyService.createAtbiya(payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the parish.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{atbiya ? 'Edit parish' : 'Register a parish'}</DialogTitle>
          <DialogDescription>
            These details appear on the public sign-up form, so a member can find
            and choose their own parish before they have an account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Divider label="Identity" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name (English) *">
              <Input value={draft.name} onChange={(e) => set('name', e.target.value)}
                placeholder="Bishoftu Atbiya" />
            </Field>
            <Field label="Name (አማርኛ)">
              <Input value={draft.nameAmharic ?? ''} onChange={(e) => set('nameAmharic', e.target.value)}
                placeholder="ቢሾፍቱ አጥቢያ" />
            </Field>
            <Field label="City (English)">
              <Input value={draft.cityEn ?? ''} onChange={(e) => set('cityEn', e.target.value)}
                placeholder="Bishoftu" />
            </Field>
            <Field label="City (አማርኛ)">
              <Input value={draft.cityAm ?? ''} onChange={(e) => set('cityAm', e.target.value)}
                placeholder="ቢሾፍቱ" />
            </Field>
          </div>
          <Field label="Zone" hint="The zone this parish reports to.">
            <Select
              value={draft.parentId ?? 'none'}
              onValueChange={(v) => set('parentId', v === 'none' ? null : v)}
            >
              <SelectTrigger><SelectValue placeholder="Select a zone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Not assigned —</SelectItem>
                {zones.map((z) => (
                  <SelectItem key={z.id} value={z.id}>
                    {z.name}{z.nameAmharic ? ` / ${z.nameAmharic}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Divider label="Address" />
          <Field label="Address (English)">
            <Textarea rows={2} value={draft.address?.en ?? ''} onChange={(e) => setAddress('en', e.target.value)}
              placeholder="Around Zikuala Roundabout, in front of Awash Hotel, about 100m" />
          </Field>
          <Field label="Address (አማርኛ)">
            <Textarea rows={2} value={draft.address?.am ?? ''} onChange={(e) => setAddress('am', e.target.value)}
              placeholder="ቢሾፍቱ ዝቋላ አደባባይ አካባቢ ከአዋሽ ሆቴል ፊት ለፊት 100 ላይ" />
          </Field>
          <Field label="Map link" hint="Optional. Shown as an 'Open in Maps' link.">
            <Input value={draft.mapUrl ?? ''} onChange={(e) => set('mapUrl', e.target.value)}
              placeholder="https://maps.app.goo.gl/…" />
          </Field>

          <Divider label="Contact person" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name (English)">
              <Input value={draft.contact?.nameEn ?? ''} onChange={(e) => setContact('nameEn', e.target.value)}
                placeholder="AddisHiwot Teshome Worku" />
            </Field>
            <Field label="Name (አማርኛ)">
              <Input value={draft.contact?.nameAm ?? ''} onChange={(e) => setContact('nameAm', e.target.value)}
                placeholder="አዲስሕይወት ተሾመ ወርቁ" />
            </Field>
            <Field label="Phone">
              <Input value={draft.contact?.phone ?? ''} onChange={(e) => setContact('phone', e.target.value)}
                placeholder="0938714929" />
            </Field>
            <Field label="Alternate phone">
              <Input value={draft.contact?.phone2 ?? ''} onChange={(e) => setContact('phone2', e.target.value)} />
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" value={draft.contact?.email ?? ''} onChange={(e) => setContact('email', e.target.value)}
              placeholder="AddishiwotJAM@gmail.com" />
          </Field>

          <Divider label="Bank accounts" />
          <div className="space-y-3">
            {(draft.bankAccounts ?? []).map((b, i) => (
              <div key={i} className="p-3 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5" /> Account {i + 1}
                  </span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                    onClick={() => removeBank(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={b.bankName} onChange={(e) => setBank(i, 'bankName', e.target.value)}
                    placeholder="Birhan Bank" />
                  <Input value={b.bankNameAmharic ?? ''} onChange={(e) => setBank(i, 'bankNameAmharic', e.target.value)}
                    placeholder="ብርሃን ባንክ" />
                  <Input value={b.accountNumber} onChange={(e) => setBank(i, 'accountNumber', e.target.value)}
                    placeholder="1602420073978" className="font-mono" />
                  <Input value={b.accountHolder ?? ''} onChange={(e) => setBank(i, 'accountHolder', e.target.value)}
                    placeholder="Account holder (optional)" />
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addBank}>
              <Plus className="h-4 w-4 mr-2" /> Add bank account
            </Button>
          </div>

          <Divider label="Photo & visibility" />
          <CloudinaryImageUpload
            value={draft.photoUrl ?? ''}
            onChange={(url) => set('photoUrl', url)}
            folder="mahibere-ahaw/atbiya"
            variant="wide"
          />
          <Field label="Notes">
            <Textarea rows={2} value={draft.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive parishes are hidden everywhere but keep their records.
                </p>
              </div>
              <Switch checked={draft.active !== false} onCheckedChange={(v) => set('active', v)} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold">Show on the public sign-up form</p>
                <p className="text-xs text-muted-foreground">
                  Turn off if this parish should not accept new member requests.
                  Note that parish records are publicly readable, including the
                  bank details entered above.
                </p>
              </div>
              <Switch checked={draft.isPublic !== false} onCheckedChange={(v) => set('isPublic', v)} />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {atbiya ? 'Save parish' : 'Register parish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
