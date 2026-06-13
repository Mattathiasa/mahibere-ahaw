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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BriefcaseBusiness, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { hrService, type Employee, type EmployeeInput } from '@/services/hr';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useModuleConfig } from '@/hooks/useModuleConfig';

const humanize = (s: string) => s.replace(/([a-z])([A-Z])/g, '$1 $2');

const EMPTY: EmployeeInput = {
  fullName: '',
  position: '',
  department: '',
  employmentType: 'FullTime',
  salary: undefined,
  hireDate: '',
  phone: '',
  email: '',
  status: 'Active',
  notes: '',
};

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-green-500/10 text-green-700 border-green-500/30',
  OnLeave: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  Terminated: 'bg-red-500/10 text-red-700 border-red-500/30',
};

const HR = () => {
  const queryClient = useQueryClient();
  const { showElement } = useSoftwareControl();
  const moduleCfg = useModuleConfig('hr');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeInput>(EMPTY);
  const [search, setSearch] = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: hrService.getAll,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) await hrService.update(editing.id, form);
      else await hrService.create(form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(editing ? 'Employee updated' : 'Employee added');
      setDialogOpen(false);
    },
    onError: () => toast.error('Failed to save employee'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => hrService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee removed');
    },
    onError: () => toast.error('Failed to remove employee'),
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setDialogOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    const { id: _id, createdAt: _c, ...rest } = emp;
    setForm({ ...EMPTY, ...rest });
    setDialogOpen(true);
  }

  const filtered = employees.filter((e) =>
    [e.fullName, e.position, e.department]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <ConfigurablePageHeader
        module="hr"
        defaultTitle="Human Resources"
        defaultDescription="Manage church employees, positions, and employment records."
        badge="HR"
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {showElement('hr.add') && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Employee
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
            <BriefcaseBusiness className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No employees found</p>
            <p className="text-sm">Add your first employee record to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Position</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Hired</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b border-border/50">
                    <td className="py-3 pr-4">
                      <div className="font-semibold">{emp.fullName}</div>
                      <div className="text-xs text-muted-foreground">{emp.email || emp.phone || ''}</div>
                    </td>
                    <td className="py-3 pr-4">{emp.position}</td>
                    <td className="py-3 pr-4">{emp.department}</td>
                    <td className="py-3 pr-4">{emp.employmentType}</td>
                    <td className="py-3 pr-4">{emp.hireDate || '—'}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" className={STATUS_COLORS[emp.status] ?? ''}>
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(emp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {showElement('hr.delete') && (
                        <Button
                          variant="ghost" size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm(`Remove ${emp.fullName}?`)) deleteMutation.mutate(emp.id);
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
            <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Full Name</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Employment Type</Label>
              <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v as EmployeeInput['employmentType'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(moduleCfg.options.employmentTypes ?? ['FullTime', 'PartTime', 'Contract', 'Volunteer']).map((v) => (
                    <SelectItem key={v} value={v}>{humanize(v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as EmployeeInput['status'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(moduleCfg.options.statuses ?? ['Active', 'OnLeave', 'Terminated']).map((v) => (
                    <SelectItem key={v} value={v}>{humanize(v)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hire Date</Label>
              <Input type="date" value={form.hireDate ?? ''} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Salary (ETB)</Label>
              <Input
                type="number"
                value={form.salary ?? ''}
                onChange={(e) => setForm({ ...form, salary: e.target.value === '' ? undefined : Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
              disabled={saveMutation.isPending || !form.fullName.trim()}
            >
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HR;
