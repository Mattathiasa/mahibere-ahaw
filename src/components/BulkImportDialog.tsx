import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/users';
import { roleLabel } from '@/services/roleRegistry';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CsvRow {
  fullName: string;
  fullNameAmharic: string;
  phone: string;
  email: string;
  role: string;
  [key: string]: string;
}

/**
 * Bulk-import users from a CSV file.
 *
 * Expected columns (case-insensitive, header row required):
 *   name, name_amharic, phone, email, role
 *
 * The role column must match a role key from the registry (e.g. "Atbiya",
 * "Zone", "HiyawanMahderat"). Users are created as active accounts with
 * a synthetic username derived from their name.
 */
export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const { t } = useLanguage();
  const a = t.admin;
  const { roles } = usePermissions();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [defaultRole, setDefaultRole] = useState('HiyawanMahderat');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const assignableRoles = roles.filter((r) => r.active !== false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        toast.error(a.biCsvNeedsRows);
        return;
      }

      const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
      const parsed: CsvRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length < 2) continue; // skip empty/short rows

        const row: any = {};
        header.forEach((h, idx) => {
          row[h] = values[idx] ?? '';
        });

        parsed.push({
          fullName: row.name || row.fullname || row['full name'] || '',
          fullNameAmharic: row.name_amharic || row.amharic || row['name amharic'] || '',
          phone: row.phone || row.phone_number || row.telephone || '',
          email: row.email || '',
          role: row.role || row.hierarchy || row.level || '',
        });
      }

      setRows(parsed);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const username = (row.fullName || row.phone.replace(/\D/g, '') || `user${Date.now()}${Math.random()}`)
          .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
        const roleKey = row.role && assignableRoles.some((r) => r.key === row.role) ? row.role : defaultRole;

        await userService.createUser({
          username,
          password: 'changeme123',
          fullName: row.fullName || username,
          fullNameAmharic: row.fullNameAmharic,
          phone: row.phone.replace(/\s/g, ''),
          email: row.email || `${username}@mahibereahaw.org`,
          hierarchyLevel: roleKey,
          status: 'active',
          signupSource: 'admin',
          gender: 'Male',
          dateOfBirth: '',
          address: {},
        });
        success++;
      } catch {
        failed++;
      }
    }

    setImporting(false);
    setResult({ success, failed });
    queryClient.invalidateQueries({ queryKey: ['users'] });

    if (success > 0) {
      toast.success(`Imported ${success} user${success === 1 ? '' : 's'} successfully.`);
    }
    if (failed > 0) {
      toast.error(`${failed} user${failed === 1 ? '' : 's'} failed to import.`);
    }
  };

  const downloadTemplate = () => {
    const csv = 'name,name_amharic,phone,email,role\nAbebe Kebede,አበበ ከበደ,+251911223344,abebe@example.com,Atbiya\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setRows([]); setResult(null); } onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Bulk Import Users
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple user accounts at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{a.biNeedTemplate}</span>
            </div>
            <Button size="sm" variant="outline" onClick={downloadTemplate} className="gap-1">
              <Download className="h-3 w-3" /> {a.biDownloadTemplate}
            </Button>
          </div>

          {/* File upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{a.biCsvFile}</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
          </div>

          {/* Default role */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{a.biDefaultRole}</Label>
            <Select value={defaultRole} onValueChange={setDefaultRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>{roleLabel(r, 'en')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {rows.length > 0 && !result && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">
                Preview: {rows.length} user{rows.length === 1 ? '' : 's'} found
              </p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 text-left">{a.scColName}</th>
                      <th className="p-2 text-left">{a.phone}</th>
                      <th className="p-2 text-left">{a.role}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-t border-border/50">
                        <td className="p-2">{row.fullName || '—'}</td>
                        <td className="p-2">{row.phone || '—'}</td>
                        <td className="p-2">{row.role || defaultRole}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && (
                  <p className="text-[10px] text-muted-foreground text-center py-1">
                    …and {rows.length - 20} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-bold">{result.success} imported</span>
              </div>
              {result.failed > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-bold">{result.failed} failed</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setRows([]); setResult(null); onOpenChange(false); }}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || rows.length === 0 || !!result}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {importing ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {a.busyImporting}</>
            ) : result ? (
              <><CheckCircle2 className="h-4 w-4 mr-1" /> {a.biDone}</>
            ) : (
              <><Upload className="h-4 w-4 mr-1" /> Import {rows.length} user{rows.length === 1 ? '' : 's'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
