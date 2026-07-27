import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/ui/file-upload';
import { RecipientSelector } from '@/components/ui/recipient-selector';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

interface CreateFinancialReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreateFinancialReportDialog({ open, onOpenChange, onSubmit, isLoading }: CreateFinancialReportDialogProps) {
  const { user } = useAuth();
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    title: '',
    titleAmharic: '',
    reportType: 'Monthly' as 'Monthly' | 'Quarterly' | 'Annual' | 'Custom',
    startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0],
    recipientInfo: '',
    attachments: [] as string[],
    recipients: [] as string[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      generatedBy: user?.id,
    });
    setFormData({
      title: '',
      titleAmharic: '',
      reportType: 'Monthly',
      startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0],
      recipientInfo: '',
      attachments: [],
      recipients: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Financial Report</DialogTitle>
          <DialogDescription>Create a comprehensive financial report with document attachments</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Report Title (English) *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Monthly Financial Report - December 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="titleAmharic">Report Title (Amharic) *</Label>
            <Input
              id="titleAmharic"
              value={formData.titleAmharic}
              onChange={(e) => setFormData({ ...formData, titleAmharic: e.target.value })}
              placeholder="e.g., ወርሃዊ የገንዘብ ሪፖርት - ታህሳስ 2017"
              required
            />
          </div>

          <div>
            <Label htmlFor="reportType">Report Type *</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value: any) => setFormData({ ...formData, reportType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly (ወርሃዊ)</SelectItem>
                <SelectItem value="Quarterly">Quarterly (ሩብ ዓመታዊ)</SelectItem>
                <SelectItem value="Annual">Annual (ዓመታዊ)</SelectItem>
                <SelectItem value="Custom">Custom (ብጁ)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">የሚጀምራ ቀን (Start Date) *</Label>
              <EthiopianDatePicker
                value={formData.startDate}
                onChange={(isoDate) => setFormData({ ...formData, startDate: isoDate })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">የሚጀመቃ ቀን (End Date) *</Label>
              <EthiopianDatePicker
                value={formData.endDate}
                onChange={(isoDate) => setFormData({ ...formData, endDate: isoDate })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="recipientInfo">Recipient Information (Optional)</Label>
            <Input
              id="recipientInfo"
              value={formData.recipientInfo}
              onChange={(e) => setFormData({ ...formData, recipientInfo: e.target.value })}
              placeholder="To whom it may concern - e.g., Atbiya Leadership, Regional Office"
            />
          </div>

          <div>
            <Label>Attachments (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Attach detailed financial documents, spreadsheets, or supporting materials
            </p>
            <FileUpload
              value={formData.attachments}
              onChange={(files) => setFormData({ ...formData, attachments: files })}
              maxFiles={10}
              maxSize={20}
            />
          </div>

          <div>
            <RecipientSelector
              label="Send to (Optional)"
              placeholder="Select Memriyas to send this financial report to..."
              hierarchyLevel="Memriya"
              value={formData.recipients}
              onChange={(recipients) => setFormData({ ...formData, recipients })}
              maxRecipients={5}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}