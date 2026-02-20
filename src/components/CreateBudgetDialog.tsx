import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RecipientSelector } from '@/components/ui/recipient-selector';
import { FileUpload } from '@/components/ui/file-upload';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface CreateBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreateBudgetDialog({ open, onOpenChange, onSubmit, isLoading }: CreateBudgetDialogProps) {
  const { user } = useAuth();
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    plannedIncome: '',
    plannedExpenses: '',
    notes: '',
    attachments: [] as string[],
    recipients: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      plannedIncome: parseFloat(formData.plannedIncome),
      plannedExpenses: parseFloat(formData.plannedExpenses),
      userId: user?.id,
    });
    setFormData({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      plannedIncome: '',
      plannedExpenses: '',
      notes: '',
      recipients: [],
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Monthly Budget</DialogTitle>
          <DialogDescription>Plan your monthly income and expenses</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Month *</Label>
              <select
                id="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-md"
                required
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                min="2020"
                max="2030"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="plannedIncome">Planned Income (Birr) *</Label>
              <Input
                id="plannedIncome"
                type="number"
                step="0.01"
                value={formData.plannedIncome}
                onChange={(e) => setFormData({ ...formData, plannedIncome: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="plannedExpenses">Planned Expenses (Birr) *</Label>
              <Input
                id="plannedExpenses"
                type="number"
                step="0.01"
                value={formData.plannedExpenses}
                onChange={(e) => setFormData({ ...formData, plannedExpenses: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this budget"
              rows={3}
            />
          </div>

          <div>
            <RecipientSelector
              label="Send to (Optional)"
              placeholder="Select Memriyas to send this budget to..."
              hierarchyLevel="Memriya"
              value={formData.recipients}
              onChange={(recipients) => setFormData({ ...formData, recipients })}
            />
          </div>

          <div>
            <FileUpload
              label="Attachments"
              value={formData.attachments}
              onChange={(files) => setFormData({ ...formData, attachments: files })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Budget
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}