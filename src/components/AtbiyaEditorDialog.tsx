import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import {
  hierarchyService, emptyAtbiya,
  type Atbiya, type AtbiyaInput,
} from '@/services/hierarchy';
import { AtbiyaForm, type ZoneOption } from '@/components/AtbiyaForm';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

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

        <AtbiyaForm draft={draft} setDraft={setDraft} zones={zones} />

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
