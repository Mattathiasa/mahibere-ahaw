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
import { REPORT_OPTIONS, TIMEFRAMES, reportOptionLabel, timeframeLabel } from '@/i18n/enums';
interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  plans?: any[];
}

export function CreateReportDialog({ open, onOpenChange, onSubmit, isLoading, plans = [] }: CreateReportDialogProps) {
  const { t } = useLanguage();
  const f = t.forms;
  const [formData, setFormData] = useState({
    planId: '',
    option: 'Memriya' as 'Memriya' | 'Kifil' | 'Zerf',
    timeframe: 'Monthly' as 'Weekly' | 'Monthly' | 'Annually',
    workDone: '',
    result: '',
    attachments: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ planId: '', option: 'Memriya', timeframe: 'Monthly', workDone: '', result: '', attachments: [] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{f.submitReport}</DialogTitle>
          <DialogDescription>{f.submitReportDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="planId">{f.selectPlanRequired}</Label>
            <Select
              value={formData.planId}
              onValueChange={(value) => setFormData({ ...formData, planId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={f.selectPlanPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="option">{f.reportOptionRequired}</Label>
            <Select
              value={formData.option}
              onValueChange={(value: any) => setFormData({ ...formData, option: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_OPTIONS.map((v) => (
                  <SelectItem key={v} value={v}>{reportOptionLabel(t, v)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="workDone">{f.workDone}</Label>
            <Textarea
              id="workDone"
              value={formData.workDone}
              onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
              placeholder={f.workDonePlaceholder}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="result">{f.result}</Label>
            <Textarea
              id="result"
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              placeholder={f.resultPlaceholder}
              rows={3}
              required
            />
          </div>

          <div>
            <Label>{f.attachments}</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Attach supporting documents for "to whom it may concern"
            </p>
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
            <Button type="submit" disabled={isLoading || !formData.planId}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
