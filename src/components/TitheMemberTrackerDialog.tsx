import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';
import { Heart, Printer, CheckCircle2, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { createMemberTithe, MemberTithe } from '@/services/finance';

import { useLanguage } from '@/contexts/LanguageContext';
interface TitheMemberTrackerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TitheMemberTrackerDialog({ open, onOpenChange, onSuccess }: TitheMemberTrackerDialogProps) {
  const { t } = useLanguage();
  const fin = t.finance;
  const [memberName, setMemberName] = useState('');
  const [type, setType] = useState<MemberTithe['type']>('Asrat (10%)');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('CBE (Commercial Bank)');
  const [dateIso, setDateIso] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ethFormatted, setEthFormatted] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [receiptPrinted, setReceiptPrinted] = useState<MemberTithe | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!memberName.trim() || amount <= 0) {
      toast.error(fin.titheMissingFields);
      return;
    }

    setIsSubmitting(true);
    try {
      const receiptNumber = `RCT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTithe = await createMemberTithe({
        memberName,
        type,
        amount,
        paymentMethod,
        receiptNumber,
        date: dateIso,
        ethiopianDate: ethFormatted,
        notes,
      });

      toast.success(`Tithe recorded for ${memberName}! Receipt: ${receiptNumber}`);
      setReceiptPrinted(newTithe);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(fin.titheFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMemberName('');
    setAmount(0);
    setNotes('');
    setReceiptPrinted(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-ethiopic text-[#0D2440] dark:text-white">
            <Heart className="h-5 w-5 text-rose-500" />
            የአሥራትና መባ መዝገብ (Tithe & Offering Tracker)
          </DialogTitle>
        </DialogHeader>

        {receiptPrinted ? (
          <div className="space-y-6 py-4">
            {/* Printable Receipt Preview Card */}
            <div className="border-2 border-dashed border-[#2E5E99]/30 rounded-2xl p-6 bg-slate-50 dark:bg-slate-900 space-y-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h4 className="font-bold text-lg font-ethiopic text-[#0D2440] dark:text-white">ማኅበረ አሐው ቤተክርስቲያን</h4>
                  <p className="text-xs text-muted-foreground font-mono">የገቢ ደረሰኝ (Tithe Receipt)</p>
                </div>
                <Receipt className="h-8 w-8 text-[#2E5E99]" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">ደረሰኝ ቁጥር:</span>
                  <span className="font-bold font-mono text-sm text-[#2E5E99]">{receiptPrinted.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">ቀን (Ethiopian Date):</span>
                  <span className="font-bold font-ethiopic">{receiptPrinted.ethiopianDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">የአባሉ ስም:</span>
                  <span className="font-bold font-ethiopic text-sm">{receiptPrinted.memberName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">የገቢ ዓይነት:</span>
                  <span className="font-bold">{receiptPrinted.type}</span>
                </div>
              </div>

              <div className="bg-[#2E5E99] text-white p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold">የተከፈለ መጠን (Amount Paid)</span>
                <span className="text-xl font-black text-emerald-300">{receiptPrinted.amount.toLocaleString()} ETB</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={resetForm}>
                Record Another Tithe
              </Button>
              <Button onClick={() => window.print()} className="bg-[#2E5E99] hover:bg-[#204a7c] text-white gap-2 font-bold">
                <Printer className="h-4 w-4" /> Print Receipt
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-bold">የአባሉ ሙሉ ስም (Member Name) *</Label>
              <Input
                placeholder="e.g. አበበ ተስፋዬ"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold">የገቢ ዓይነት (Contribution Type)</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asrat (10%)">አሥራት (Asrat 10%)</SelectItem>
                    <SelectItem value="Offering (መባ)">መባ (Offering)</SelectItem>
                    <SelectItem value="First Fruit (በኵራት)">በኵራት (First Fruit)</SelectItem>
                    <SelectItem value="Building Contribution">የግንባታ መዋጮ (Building)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">የገንዘብ መጠን (Amount in ETB) *</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-bold">የክፍያ መንገድ (Payment Method)</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBE (Commercial Bank)">{fin.bankCbe}</SelectItem>
                    <SelectItem value="Telebirr">{fin.bankTelebirr}</SelectItem>
                    <SelectItem value="Awash Bank">{fin.bankAwash}</SelectItem>
                    <SelectItem value="Dashen Bank">{fin.bankDashen}</SelectItem>
                    <SelectItem value="Cash">Cash (በጥሬ ገንዘብ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold">ቀን (Ethiopian Calendar Date)</Label>
                <EthiopianDatePicker
                  value={dateIso}
                  onChange={(iso, eth) => {
                    setDateIso(iso);
                    setEthFormatted(eth);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold">ማስታወሻ (Optional Notes)</Label>
              <Input
                placeholder={fin.titheNotePlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {isSubmitting ? 'Recording...' : 'Record Tithe & Generate Receipt'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
