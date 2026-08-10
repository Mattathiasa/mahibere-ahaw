import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { inventoryService } from '@/services/inventory';
import { useQueryClient } from '@tanstack/react-query';

import { useLanguage } from '@/contexts/LanguageContext';
interface ImportAssetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportAssetsDialog({ open, onOpenChange }: ImportAssetsDialogProps) {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const c = t.content;
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(c.selectFileFirst);
      return;
    }

    setIsUploading(true);
    try {
      // Mock import CSV processing
      const mockAsset = {
        name: file.name.replace(/\.[^/.]+$/, "") + ' Imported Asset',
        category: 'Equipment',
        assetType: 'Equipment' as const,
        quantity: 1,
        location: 'Main Church Building',
        condition: 'Good' as const,
        status: 'InUse' as const,
        acquisitionType: 'Purchased' as const,
        value: 24000,
        purchaseDate: new Date().toISOString().split('T')[0],
      };

      await inventoryService.create(mockAsset);
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success(c.assetsImported);
      onOpenChange(false);
      setFile(null);
    } catch (err) {
      toast.error(c.assetsImportFailed);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-cyan-600" />
            Import Assets
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-3">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground opacity-60" />
            <div>
              <p className="text-sm font-semibold">{c.chooseFile}</p>
              <p className="text-xs text-muted-foreground">{c.supportedFormats}</p>
            </div>
            <Input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              className="hidden"
              id="asset-file-input"
            />
            <Label
              htmlFor="asset-file-input"
              className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg cursor-pointer hover:bg-secondary/80"
            >
              Select File
            </Label>
            {file && (
              <p className="text-xs font-mono text-cyan-600 font-semibold flex items-center justify-center gap-1">
                <Check className="h-3.5 w-3.5" /> {file.name}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
          <Button onClick={handleImport} disabled={!file || isUploading}>
            {isUploading ? t.admin.busyImporting : t.admin.uploadAndImport}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
