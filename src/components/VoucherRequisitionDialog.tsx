import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';
import { FileText, Plus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createRequisitionVoucher, getRequisitions, updateRequisitionStatus, RequisitionVoucher } from '@/services/finance';

import { useLanguage } from '@/contexts/LanguageContext';
interface VoucherRequisitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VoucherRequisitionDialog({ open, onOpenChange }: VoucherRequisitionDialogProps) {
  const { t } = useLanguage();
  const fin = t.finance;
  const f = t.forms;
  const [requisitions, setRequisitions] = useState<RequisitionVoucher[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [requestedBy, setRequestedBy] = useState('');
  const [department, setDepartment] = useState('Administration');
  const [purpose, setPurpose] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [dateIso, setDateIso] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ethFormatted, setEthFormatted] = useState<string>('');

  useEffect(() => {
    if (open) loadRequisitions();
  }, [open]);

  const loadRequisitions = async () => {
    const data = await getRequisitions();
    setRequisitions(data);
  };

  const handleCreate = async () => {
    if (!requestedBy.trim() || amount <= 0 || !purpose.trim()) {
      toast.error(fin.voucherMissingFields);
      return;
    }

    try {
      const newVoucher = await createRequisitionVoucher({
        requestedBy,
        department,
        purpose,
        amount,
        status: 'Pending',
        date: dateIso,
        ethiopianDate: ethFormatted,
      });

      toast.success(`Requisition created! Voucher: ${newVoucher.voucherNumber}`);
      setShowCreate(false);
      loadRequisitions();
    } catch (err) {
      toast.error(fin.voucherFailed);
    }
  };

  const handleStatusChange = async (id: string, status: RequisitionVoucher['status']) => {
    await updateRequisitionStatus(id, status, 'Finance Officer');
    toast.success(`Voucher status updated to ${status}`);
    loadRequisitions();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-ethiopic text-[#0D2440] dark:text-white">
            <FileText className="h-5 w-5 text-purple-600" />
            የወጪ መጠየቂያና ማረጋገጫ Voucher (Requisitions & Payment Vouchers)
          </DialogTitle>
        </DialogHeader>

        {showCreate ? (
          <div className="space-y-4 py-2 border p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
            <h4 className="font-bold text-sm text-purple-600">{fin.newVoucherRequest}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">{fin.requestedBy}</Label>
                <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder={fin.requesterNamePlaceholder} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">{f.department}</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">{fin.purposeDetails}</Label>
                <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={fin.purposePlaceholder} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">{fin.amountEtb}</Label>
                <Input type="number" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">{fin.dateEthiopian}</Label>
                <EthiopianDatePicker value={dateIso} onChange={(iso, eth) => { setDateIso(iso); setEthFormatted(eth); }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>{t.common.cancel}</Button>
              <Button size="sm" onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                Submit Requisition
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-2">
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">{fin.voucherHistory}</h4>
            <Button size="sm" onClick={() => setShowCreate(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1">
              <Plus className="h-4 w-4" /> Request Requisition
            </Button>
          </div>
        )}

        {/* Requisitions List */}
        <div className="space-y-3 py-2">
          {requisitions.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">{fin.noVouchers}</p>
          ) : (
            requisitions.map((req) => (
              <div key={req.id} className="border p-4 rounded-xl space-y-2 bg-white dark:bg-[#0D2440]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono font-bold text-purple-600 block">{req.voucherNumber}</span>
                    <h5 className="font-bold text-sm text-[#0D2440] dark:text-white font-ethiopic">{req.purpose}</h5>
                    <p className="text-xs text-muted-foreground">By: {req.requestedBy} ({req.department}) • {req.ethiopianDate}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-black text-sm text-rose-600">{req.amount.toLocaleString()} ETB</span>
                    <Badge variant="outline" className={req.status === 'Approved' || req.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}>
                      {req.status}
                    </Badge>
                  </div>
                </div>

                {req.status === 'Pending' && (
                  <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(req.id, 'Rejected')} className="text-rose-600 border-rose-300 h-7">
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => handleStatusChange(req.id, 'Approved')} className="bg-emerald-600 text-white h-7">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve Voucher
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t.admin.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
