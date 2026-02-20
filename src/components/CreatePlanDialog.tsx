import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { Loader2 } from 'lucide-react';

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreatePlanDialog({ open, onOpenChange, onSubmit, isLoading }: CreatePlanDialogProps) {
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
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogDescription>Add a new plan with optional document attachments</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Plan Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter plan name"
              required
            />
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
            <Label htmlFor="details">Details *</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Enter plan details"
              rows={4}
              required
            />
          </div>

          <div>
            <Label>Attachments (Optional)</Label>
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
