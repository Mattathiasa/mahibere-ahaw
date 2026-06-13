import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
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
import { Boxes, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService, type Asset, type AssetInput } from '@/services/inventory';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useModuleConfig } from '@/hooks/useModuleConfig';

const invHumanize = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2');

const EMPTY: AssetInput = {
  name: '',
  category: '',
  quantity: 1,
  location: '',
  condition: 'Good',
  status: 'InUse',
  value: undefined,
  purchaseDate: '',
  assignedTo: '',
  notes: '',
};

const STATUS_COLORS: Record<string, string> = {
  InUse: 'bg-green-500/10 text-green-700 border-green-500/30',
  InStorage: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  Maintenance: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  Retired: 'bg-red-500/10 text-red-700 border-red-500/30',
};

const Inventory = () => {
  const queryClient = useQueryClient();
  const { showElement } = useSoftwareControl();
  const moduleCfg = useModuleConfig('inventory');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [form, setForm] = useState<AssetInput>(EMPTY);
  const [search, setSearch] = useState('');

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: inventoryService.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) await inventoryService.update(editing.id, form);
      else await inventoryService.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(editing ? 'Asset updated' : 'Asset added');
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
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(asset: Asset) {
    setEditing(asset);
    const { id: _id, createdAt: _c, ...rest } = asset;
    setForm({ ...EMPTY, ...rest });
    setDialogOpen(true);
  }

  const filtered = assets.filter((a) =>
    [a.name, a.category, a.location, a.assignedTo ?? '']
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalValue = assets.reduce((sum, a) => sum + (a.value ?? 0) * (a.quantity || 1), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <ConfigurablePageHeader
        module="inventory"
        defaultTitle="Inventory"
        defaultDescription="Track church assets, equipment, and property."
        badge="Assets"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-black">{assets.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Units</p>
          <p className="text-2xl font-black">{assets.reduce((s, a) => s + (a.quantity || 0), 0)}</p>
        </CardContent></Card>
        <Card className="col-span-2 sm:col-span-1"><CardContent className="pt-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Value</p>
          <p className="text-2xl font-black">{totalValue.toLocaleString()} ETB</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {showElement('inventory.add') && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Asset
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Asset</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Qty</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Condition</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Value (ETB)</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr key={asset.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{asset.name}</div>
                      {asset.assignedTo && (
                        <div className="text-xs text-muted-foreground">Assigned: {asset.assignedTo}</div>
                      )}
                    </td>
                    <td className="py-3 pr-4">{asset.category}</td>
                    <td className="py-3 pr-4">{asset.quantity}</td>
                    <td className="py-3 pr-4">{asset.location}</td>
                    <td className="py-3 pr-4">{asset.condition}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={STATUS_COLORS[asset.status] ?? ''}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4">{asset.value ? asset.value.toLocaleString() : '—'}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(asset)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {showElement('inventory.delete') && (
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Remove ${asset.name}?`)) deleteMutation.mutate(asset.id);
                          }}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Asset Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="e.g. Electronics, Furniture" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
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
                  {(moduleCfg.options.statuses ?? ['InUse', 'InStorage', 'Maintenance', 'Retired']).map((v) => (
                    <SelectItem key={v} value={v}>{invHumanize(v)}</SelectItem>
                  ))}
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
              <Label>Purchase Date</Label>
              <Input type="date" value={form.purchaseDate ?? ''} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
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
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Asset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
