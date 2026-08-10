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
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

import { useLanguage } from '@/contexts/LanguageContext';
// Known transaction-type labels (English + Amharic). Custom types added in
// Module Config fall back to their raw value.
const TX_LABELS: Record<string, string> = {
  Income: 'Income (ገቢ)',
  Expense: 'Expense (ወጪ)',
  Tithe: 'Tithe (አስራት)',
  Offering: 'Offering (ስጦታ)',
  Donation: 'Donation (መዋጮ)',
  Collection: 'Collection (ገቢ መሰብሰቢያ)',
  Deposit: 'Deposit (ተቀማጭ)',
  Asrat: 'Asrat (አስራት)',
  YefikirSetota: 'Yefikir Setota (የፍቅር ስጦታ)',
  Transfer: 'Transfer (ዝውውር)',
};

interface CreateTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export function CreateTransactionDialog({ open, onOpenChange, onSubmit, isLoading }: CreateTransactionDialogProps) {
  const moduleCfg = useModuleConfig('finance');
  const { user } = useAuth();
  const { t } = useLanguage();
  const fin = t.finance;
  const [formData, setFormData] = useState({
    type: 'Income' as string,
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    fromAccount: '',
    toAccount: '',
    receiptUrl: '',
    attachments: [] as string[],
    recipients: [] as string[],
  });

  const isTransfer = formData.type === 'Transfer';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      userId: user?.id,
    });
    setFormData({
      type: 'Income',
      amount: '',
      description: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      fromAccount: '',
      toAccount: '',
      receiptUrl: '',
      attachments: [],
      recipients: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fin.addTransaction}</DialogTitle>
          <DialogDescription>{fin.addTransactionDesc}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">{fin.transactionType}</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(moduleCfg.options.transactionTypes ?? Object.keys(TX_LABELS)).map((type) => (
                  <SelectItem key={type} value={type}>{TX_LABELS[type] ?? type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">{fin.amountBirr}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          {isTransfer && (
            <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/20">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{fin.bankToBankTransfer}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{fin.fromAccount}</Label>
                  <Select value={formData.fromAccount} onValueChange={(v) => setFormData({ ...formData, fromAccount: v })}>
                    <SelectTrigger><SelectValue placeholder={fin.fromAccountPlaceholder} /></SelectTrigger>
                    <SelectContent>
                      {(moduleCfg.options.bankAccounts ?? []).map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{fin.toAccount}</Label>
                  <Select value={formData.toAccount} onValueChange={(v) => setFormData({ ...formData, toAccount: v })}>
                    <SelectTrigger><SelectValue placeholder={fin.toAccountPlaceholder} /></SelectTrigger>
                    <SelectContent>
                      {(moduleCfg.options.bankAccounts ?? []).map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{fin.receiptScreenshot}</Label>
                <CloudinaryImageUpload
                  value={formData.receiptUrl}
                  onChange={(url) => setFormData({ ...formData, receiptUrl: url })}
                  folder="mahibere-ahaw/receipts"
                  label={fin.attachReceipt}
                  variant="wide"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="date">ቀን (Date) *</Label>
            <EthiopianDatePicker
              value={formData.date}
              onChange={(isoDate) => setFormData({ ...formData, date: isoDate })}
            />
          </div>

          <div>
            <Label htmlFor="description">{fin.descriptionRequired}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={fin.descriptionPlaceholder}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">{fin.categoryOptional}</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder={fin.categoryPlaceholder}
            />
          </div>

          <div>
            <Label>{fin.attachmentsOptional}</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Attach receipts, invoices, or supporting documents
            </p>
            <FileUpload
              value={formData.attachments}
              onChange={(files) => setFormData({ ...formData, attachments: files })}
              maxFiles={5}
              maxSize={10}
            />
          </div>

          <div>
            <RecipientSelector
              label={fin.sendToOptional}
              placeholder={fin.sendToPlaceholder}
              hierarchyLevel="Memriya"
              value={formData.recipients}
              onChange={(recipients) => setFormData({ ...formData, recipients })}
              maxRecipients={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
