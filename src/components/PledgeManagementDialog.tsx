import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';
import { Building, Plus, CheckCircle2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { createPledge, getPledges, updatePledgePayment, BuildingPledge } from '@/services/finance';

import { useLanguage } from '@/contexts/LanguageContext';
interface PledgeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PledgeManagementDialog({ open, onOpenChange }: PledgeManagementDialogProps) {
  const { t } = useLanguage();
  const fin = t.finance;
  const [pledges, setPledges] = useState<BuildingPledge[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  // Form State
  const [memberName, setMemberName] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('New Cathedral Building Campaign (የካቴድራል ግንባታ)');
  const [pledgedAmount, setPledgedAmount] = useState<number>(10000);
  const [paidAmount, setPaidAmount] = useState<number>(2500);
  const [dueDateIso, setDueDateIso] = useState<string>(new Date().toISOString().split('T')[0]);
  const [ethFormatted, setEthFormatted] = useState<string>('');

  useEffect(() => {
    if (open) loadPledges();
  }, [open]);

  const loadPledges = async () => {
    const data = await getPledges();
    setPledges(data);
  };

  const handleCreate = async () => {
    if (!memberName.trim() || pledgedAmount <= 0) {
      toast.error(fin.pledgeMissingFields);
      return;
    }

    try {
      await createPledge({
        memberName,
        campaignTitle,
        pledgedAmount,
        paidAmount,
        status: paidAmount >= pledgedAmount ? 'Completed' : 'Active',
        dueDate: dueDateIso,
        ethiopianDate: ethFormatted,
      });

      toast.success(fin.pledgeRecorded);
      setShowCreate(false);
      loadPledges();
    } catch (err) {
      toast.error(fin.pledgeFailed);
    }
  };

  const handlePaymentUpdate = async (id: string, currentPaid: number, pledged: number) => {
    const additional = prompt('Enter additional payment amount (ETB):', '1000');
    if (!additional || isNaN(Number(additional))) return;

    await updatePledgePayment(id, Number(additional));
    toast.success(fin.pledgePaymentRecorded);
    loadPledges();
  };

  const totalPledged = pledges.reduce((sum, p) => sum + (p.pledgedAmount || 0), 0);
  const totalPaid = pledges.reduce((sum, p) => sum + (p.paidAmount || 0), 0);
  const totalRemaining = totalPledged - totalPaid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold font-ethiopic text-[#0D2440] dark:text-white">
            <Building className="h-5 w-5 text-[#2E5E99]" />
            የቃል ኪዳንና የግንባታ መዋጮ (Building Pledges & Campaigns)
          </DialogTitle>
        </DialogHeader>

        {/* Campaign Summary Bar */}
        <div className="grid grid-cols-3 gap-4 bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-center">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block">{fin.totalPledged}</span>
            <span className="text-xl font-black text-[#2E5E99]">{totalPledged.toLocaleString()} ETB</span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block">{fin.totalCollected}</span>
            <span className="text-xl font-black text-emerald-600">{totalPaid.toLocaleString()} ETB</span>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block">{fin.remainingBalance}</span>
            <span className="text-xl font-black text-amber-600">{totalRemaining.toLocaleString()} ETB</span>
          </div>
        </div>

        {showCreate ? (
          <div className="space-y-4 py-2 border p-4 rounded-2xl bg-slate-50 dark:bg-slate-900">
            <h4 className="font-bold text-sm text-[#2E5E99]">{fin.addNewPledge}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">{fin.memberNameRequired}</Label>
                <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder={fin.memberNameRequired} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">{fin.campaignTitle}</Label>
                <Input value={campaignTitle} onChange={(e) => setCampaignTitle(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">{fin.pledgedAmount}</Label>
                <Input type="number" value={pledgedAmount || ''} onChange={(e) => setPledgedAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold">{fin.initialPaidAmount}</Label>
                <Input type="number" value={paidAmount || ''} onChange={(e) => setPaidAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-bold">{fin.dueDateEthiopian}</Label>
                <EthiopianDatePicker value={dueDateIso} onChange={(iso, eth) => { setDueDateIso(iso); setEthFormatted(eth); }} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>{t.common.cancel}</Button>
              <Button size="sm" onClick={handleCreate} className="bg-[#2E5E99] text-white">{fin.savePledge}</Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center pt-2">
            <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">{fin.pledgeRecords}</h4>
            <Button size="sm" onClick={() => setShowCreate(true)} className="bg-[#2E5E99] hover:bg-[#204a7c] text-white font-bold gap-1">
              <Plus className="h-4 w-4" /> Add Pledge
            </Button>
          </div>
        )}

        {/* Pledges List */}
        <div className="space-y-3 py-2">
          {pledges.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">{fin.noPledges}</p>
          ) : (
            pledges.map((p) => {
              const progressPct = Math.min(100, Math.round(((p.paidAmount || 0) / (p.pledgedAmount || 1)) * 100));
              return (
                <div key={p.id} className="border p-4 rounded-xl space-y-2 bg-white dark:bg-[#0D2440]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-sm text-[#0D2440] dark:text-white font-ethiopic">{p.memberName}</h5>
                      <p className="text-xs text-muted-foreground">{p.campaignTitle}</p>
                    </div>
                    <Badge className={p.status === 'Completed' ? 'bg-emerald-600' : 'bg-amber-500'}>
                      {p.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                    <span>{fin.pledgedLabel} <strong className="text-[#2E5E99]">{p.pledgedAmount.toLocaleString()} ETB</strong></span>
                    <span>{fin.paidLabel} <strong className="text-emerald-600">{p.paidAmount.toLocaleString()} ETB</strong></span>
                    <span>{fin.remainingLabel} <strong className="text-amber-600">{(p.pledgedAmount - p.paidAmount).toLocaleString()} ETB</strong></span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#2E5E99] h-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>

                  {p.status !== 'Completed' && (
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePaymentUpdate(p.id, p.paidAmount, p.pledgedAmount)}
                        className="text-xs h-7 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                      >
                        + Add Payment
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t.admin.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
