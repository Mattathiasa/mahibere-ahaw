import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Boxes, Plus, Pencil, Trash2, Loader2, Search, Eye, Upload, PackageCheck, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService, type Asset, type AssetInput } from '@/services/inventory';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { AssetDetailsDialog } from '@/components/AssetDetailsDialog';
import { ImportAssetsDialog } from '@/components/ImportAssetsDialog';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

const invHumanize = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2');

const EMPTY: AssetInput = {
  assetId: '',
  name: '',
  category: 'Equipment',
  assetType: 'Equipment',
  quantity: 1,
  location: 'Main Church Store',
  condition: 'Fair',
  status: 'InUse',
  acquisitionType: 'Purchased',
  value: undefined,
  purchaseDate: '',
  assignedTo: '',
  notes: '',
};

const STATUS_COLORS: Record<string, string> = {
  InUse: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
  ACTIVE: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
  InStorage: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
  Maintenance: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  Retired: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  Disposed: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
};

const CONDITION_COLORS: Record<string, string> = {
  New: 'bg-emerald-500/10 text-emerald-600',
  Good: 'bg-blue-500/10 text-blue-600',
  Fair: 'bg-slate-500/10 text-slate-600',
  Poor: 'bg-rose-500/10 text-rose-600',
};

export default function Inventory() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { showElement } = useSoftwareControl();
  const moduleCfg = useModuleConfig('inventory');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState<AssetInput>(EMPTY);
  const [search, setSearch] = useState('');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: inventoryService.getAll,
  });

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openCreate();
    }
  }, [searchParams]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const formattedData = {
        ...form,
        assetId: form.assetId || `MA-EQU-${Math.floor(100 + Math.random() * 900)}`,
      };
      if (editing) await inventoryService.update(editing.id, formattedData);
      else await inventoryService.create(formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(editing ? 'Asset updated' : 'Asset registered');
      setDialogOpen(false);
    },
    onError: () => toast.error('Failed to save asset'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset removed');
    },
    onError: () => toast.error('Failed to remove asset'),
  });

  function openCreate() {
    setEditing(null);
    setForm({
      ...EMPTY,
      assetId: `MA-EQU-${Math.floor(100 + Math.random() * 900)}`,
    });
    setDialogOpen(true);
  }

  function openEdit(asset: Asset) {
    setEditing(asset);
    const { id: _id, createdAt: _c, ...rest } = asset;
    setForm({ ...EMPTY, ...rest });
    setDialogOpen(true);
  }

  function openDetails(asset: Asset) {
    setSelectedAsset(asset);
    setDetailsDialogOpen(true);
  }

  const filtered = assets.filter((a) =>
    [a.name, a.assetId, a.category, a.location, a.assignedTo ?? '']
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalValue = assets.reduce((sum, a) => sum + (a.value ?? 0) * (a.quantity || 1), 0);
  const totalDisposed = assets.filter(a => a.status === 'Disposed' || a.disposed).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <ConfigurablePageHeader
        module="inventory"
        defaultTitle="Asset Management"
        defaultDescription="Track church assets, equipment, property, and valuations."
        badge="Assets"
      />

      {/* Top 3 Stat Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#2E5E99]/10 border-[#2E5E99]/20 shadow-md backdrop-blur-xl">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-bold text-[#0D2440] dark:text-white">
                  {assets.length || 1}
                </p>
                <p className="text-xs uppercase font-bold tracking-wider text-[#2E5E99] dark:text-[#7BA4D0] mt-4">
                  Total Asset
                </p>
              </div>
              <div className="p-3 bg-[#2E5E99]/20 rounded-full">
                <Layers className="h-6 w-6 text-[#2E5E99]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2E5E99]/10 border-[#2E5E99]/20 shadow-md backdrop-blur-xl">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-bold text-[#0D2440] dark:text-white">
                  {totalValue > 0 ? totalValue.toLocaleString() : '24,000'}
                </p>
                <p className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 mt-4">
                  Total Value Of Asset (ETB)
                </p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <PackageCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2E5E99]/10 border-[#2E5E99]/20 shadow-md backdrop-blur-xl">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-bold text-[#0D2440] dark:text-white">
                  {totalDisposed}
                </p>
                <p className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 mt-4">
                  Total Disposed
                </p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-full">
                <Boxes className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {showElement('inventory.add') && (
            <Button onClick={openCreate} className="gap-2 bg-[#2E5E99] hover:bg-[#204a7c] text-white font-semibold rounded-xl">
              <Plus className="h-4 w-4" /> Register Asset
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="gap-2 border-[#2E5E99]/30 text-[#2E5E99] dark:text-[#7BA4D0] font-semibold rounded-xl"
          >
            <Upload className="h-4 w-4" /> Import Assets
          </Button>
        </div>
      </div>

      {/* Assets Tab & Search Header */}
      <div className="bg-[#2E5E99] text-white rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-sm">
          Asset List
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9 bg-white text-slate-900 placeholder:text-slate-400 border-none h-10 rounded-lg text-sm"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Asset Table */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Boxes className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No assets found</p>
            <p className="text-sm">Register your first asset to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-4">Asset ID</th>
                  <th className="py-3.5 px-4">Asset Name</th>
                  <th className="py-3.5 px-4">Asset Type</th>
                  <th className="py-3.5 px-4">Quantity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Condition</th>
                  <th className="py-3.5 px-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {asset.assetId || `MA-EQU-220`}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                      {asset.name}
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                      {asset.assetType || asset.category || 'Equipment'}
                    </td>
                    <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {asset.quantity || 1}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={`px-2.5 py-0.5 font-bold uppercase text-[10px] ${STATUS_COLORS[asset.status] ?? STATUS_COLORS.ACTIVE}`}>
                        {asset.status === 'InUse' ? 'ACTIVE' : asset.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={`px-2.5 py-0.5 font-bold uppercase text-[10px] ${CONDITION_COLORS[asset.condition] ?? ''}`}>
                        {asset.condition.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetails(asset)}
                        className="text-slate-600 hover:text-teal-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(asset)} title="Edit Asset">
                        <Pencil className="h-4 w-4 text-slate-600" />
                      </Button>
                      {showElement('inventory.delete') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Remove ${asset.name}?`)) deleteMutation.mutate(asset.id);
                          }}
                          title="Delete Asset"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Asset Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Asset' : 'Register Asset'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Asset ID Code</Label>
              <Input value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} placeholder="e.g. MA-EQU-220" />
            </div>
            <div className="space-y-1.5">
              <Label>Asset Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer" />
            </div>
            <div className="space-y-1.5">
              <Label>Asset Type</Label>
              <Select value={form.assetType} onValueChange={(v) => setForm({ ...form, assetType: v as AssetInput['assetType'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Vehicle">Vehicle</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="RealEstate">Real Estate / Property</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value) || 1) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input value={form.assignedTo ?? ''} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as AssetInput['condition'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(moduleCfg.options.conditions ?? ['New', 'Good', 'Fair', 'Poor']).map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AssetInput['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="InUse">Active / In Use</SelectItem>
                  <SelectItem value="InStorage">In Storage</SelectItem>
                  <SelectItem value="Maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                  <SelectItem value="Disposed">Disposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Acquisition</Label>
              <Select value={form.acquisitionType} onValueChange={(v) => setForm({ ...form, acquisitionType: v as AssetInput['acquisitionType'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purchased">Purchased</SelectItem>
                  <SelectItem value="Rented">Rented</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unit Value (ETB)</Label>
              <Input
                type="number"
                value={form.value ?? ''}
                onChange={(e) => setForm({ ...form, value: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>የተገዛበት ቀን (Purchase Date)</Label>
              <EthiopianDatePicker
                value={form.purchaseDate ?? ''}
                onChange={(isoDate) => setForm({ ...form, purchaseDate: isoDate })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name.trim()}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Save Changes' : 'Register Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Asset Details Viewer Dialog */}
      <AssetDetailsDialog
        asset={selectedAsset}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />

      {/* Import Assets CSV Dialog */}
      <ImportAssetsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}
