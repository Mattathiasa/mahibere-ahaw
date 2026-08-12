import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Loader2 } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
import { TIMEFRAMES, timeframeLabel } from '@/i18n/enums';
interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreatePlanDialog({ open, onOpenChange, onSubmit, isLoading }: CreatePlanDialogProps) {
  const { t } = useLanguage();
  const f = t.forms;
  const [formData, setFormData] = useState({
    name: '',
    timeframe: 'Monthly' as 'Weekly' | 'Monthly' | 'Annually',
    details: '',
    attachments: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', timeframe: 'Monthly', details: '', attachments: [] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{f.createNewPlan}</DialogTitle>
          <DialogDescription>{f.createNewPlanDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{f.planNameRequired}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={f.planNamePlaceholder}
              required
            />
          </div>

          <div>
            <Label htmlFor="timeframe">{f.timeframeRequired}</Label>
            <Select
              value={formData.timeframe}
              onValueChange={(value: any) => setFormData({ ...formData, timeframe: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEFRAMES.map((v) => (
                  <SelectItem key={v} value={v}>{timeframeLabel(t, v)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="details">{f.detailsRequired}</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder={f.detailsPlaceholder}
              rows={4}
              required
            />
          </div>

          <div>
            <Label>{f.attachments}</Label>
            <FileUpload
              value={formData.attachments}
              onChange={(files) => setFormData({ ...formData, attachments: files })}
              maxFiles={5}
              maxSizeMB={10}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Plan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
