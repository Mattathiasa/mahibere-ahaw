import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Asset } from '@/services/inventory';
import { Package, MapPin, Tag, Calendar, User, DollarSign, FileText, CheckCircle2 } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
interface AssetDetailsDialogProps {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailsDialog({ asset, open, onOpenChange }: AssetDetailsDialogProps) {
  const { t } = useLanguage();
  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between pr-6">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-cyan-600" />
                {asset.name}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono">
                Asset ID: {asset.assetId || `MA-EQU-${asset.id.slice(0, 5).toUpperCase()}`}
              </p>
            </div>
            <Badge className={asset.disposed ? 'bg-red-500' : 'bg-green-600'}>
              {asset.status || 'Active'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Category & Type
            </span>
            <p className="text-sm font-medium">{asset.category} ({asset.assetType || 'Equipment'})</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Quantity
            </span>
            <p className="text-sm font-medium">{asset.quantity} units</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Location
            </span>
            <p className="text-sm font-medium">{asset.location || 'Central Store'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Assigned To
            </span>
            <p className="text-sm font-medium">{asset.assignedTo || 'Unassigned'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Condition
            </span>
            <p className="text-sm font-medium">{asset.condition}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> Value / Acquisition
            </span>
            <p className="text-sm font-medium">
              {asset.value ? `${asset.value.toLocaleString()} ETB` : 'N/A'} ({asset.acquisitionType})
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Purchase Date
            </span>
            <p className="text-sm font-medium">{asset.purchaseDate || 'N/A'}</p>
          </div>

          {asset.notes && (
            <div className="space-y-1 sm:col-span-2 border-t pt-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> Notes
              </span>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{asset.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t.admin.close}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
