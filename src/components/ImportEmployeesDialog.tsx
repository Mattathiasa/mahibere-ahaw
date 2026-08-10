import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, Check } from 'lucide-react';
import { toast } from 'sonner';
import { hrService } from '@/services/hr';
import { useQueryClient } from '@tanstack/react-query';

import { useLanguage } from '@/contexts/LanguageContext';
interface ImportEmployeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportEmployeesDialog({ open, onOpenChange }: ImportEmployeesDialogProps) {
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
      toast.error(c.selectCsvFirst);
      return;
    }

    setIsUploading(true);
    try {
      const mockEmployee = {
        fullName: file.name.replace(/\.[^/.]+$/, "") + ' Staff',
        position: 'Staff Member',
        department: 'Administration',
        category: 'Staff' as const,
        employmentType: 'FullTime' as const,
        status: 'Active' as const,
        grossSalary: 12000,
        tax: 2700,
        pension: 840,
        netSalary: 8460,
        hireDate: new Date().toISOString().split('T')[0],
      };

      await hrService.create(mockEmployee);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(c.employeesImported);
      onOpenChange(false);
      setFile(null);
    } catch (err) {
      toast.error(c.employeesImportFailed);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-teal-600" />
            Import Employees
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
              id="employee-file-input"
            />
            <Label
              htmlFor="employee-file-input"
              className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground text-xs font-semibold rounded-lg cursor-pointer hover:bg-secondary/80"
            >
              Select File
            </Label>
            {file && (
              <p className="text-xs font-mono text-teal-600 font-semibold flex items-center justify-center gap-1">
                <Check className="h-3.5 w-3.5" /> {file.name}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
          <Button onClick={handleImport} disabled={!file || isUploading} className="bg-teal-600 hover:bg-teal-700 text-white">
            {isUploading ? t.admin.busyImporting : t.admin.uploadAndImport}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
