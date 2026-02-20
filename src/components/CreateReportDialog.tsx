import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Loader2 } from 'lucide-react';

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  plans?: any[];
}

export function CreateReportDialog({ open, onOpenChange, onSubmit, isLoading, plans = [] }: CreateReportDialogProps) {
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
          <DialogTitle>Submit Report</DialogTitle>
          <DialogDescription>Submit a report with optional document attachments</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="planId">Select Plan *</Label>
            <Select
              value={formData.planId}
              onValueChange={(value) => setFormData({ ...formData, planId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
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
            <Label htmlFor="option">Report Option *</Label>
            <Select
              value={formData.option}
              onValueChange={(value: any) => setFormData({ ...formData, option: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Memriya">Memriya</SelectItem>
                <SelectItem value="Kifil">Kifil</SelectItem>
                <SelectItem value="Zerf">Zerf</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="timeframe">Timeframe *</Label>
            <Select
              value={formData.timeframe}
              onValueChange={(value: any) => setFormData({ ...formData, timeframe: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="workDone">Work Done *</Label>
            <Textarea
              id="workDone"
              value={formData.workDone}
              onChange={(e) => setFormData({ ...formData, workDone: e.target.value })}
              placeholder="Describe the work completed"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="result">Result *</Label>
            <Textarea
              id="result"
              value={formData.result}
              onChange={(e) => setFormData({ ...formData, result: e.target.value })}
              placeholder="Describe the results achieved"
              rows={3}
              required
            />
          </div>

          <div>
            <Label>Attachments (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Attach supporting documents for "to whom it may concern"
            </p>
            <FileUpload
              value={formData.attachments}
              onChange={(files) => setFormData({ ...formData, attachments: files })}
              maxFiles={5}
              maxSize={10}
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
