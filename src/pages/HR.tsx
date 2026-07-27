import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BriefcaseBusiness, Plus, Pencil, Trash2, Loader2, Search, Eye, Upload, Users, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { hrService, type Employee } from '@/services/hr';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { EmployeeRegistrationWizard } from '@/components/EmployeeRegistrationWizard';
import { EmployeeDetailsDialog } from '@/components/EmployeeDetailsDialog';
import { ImportEmployeesDialog } from '@/components/ImportEmployeesDialog';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
  OnLeave: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  Terminated: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30',
  Inactive: 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30',
};

export default function HR() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const { showElement } = useSoftwareControl();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: hrService.getAll,
  });

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      openCreate();
    }
  }, [searchParams]);

  const saveMutation = useMutation({
    mutationFn: async (empData: Partial<Employee>) => {
      if (editingEmployee) await hrService.update(editingEmployee.id, empData as any);
      else await hrService.create(empData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(editingEmployee ? 'Employee updated' : 'Employee registered');
      setWizardOpen(false);
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
    setEditingEmployee(null);
    setWizardOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    setWizardOpen(true);
  }

  function openDetails(emp: Employee) {
    setSelectedEmployee(emp);
    setDetailsOpen(true);
  }

  const filtered = employees.filter((e) =>
    [e.fullName, e.employeeId, e.position, e.department]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCount = employees.filter(e => e.status === 'Active').length;
  const inactiveCount = employees.filter(e => e.status !== 'Active').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <ConfigurablePageHeader
        module="hr"
        defaultTitle="Human Resources"
        defaultDescription="Manage church employees, positions, payroll, and staff profiles."
        badge="HR"
      />

      {/* Top 3 Stat Cards Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#2E5E99]/10 border-[#2E5E99]/20 shadow-md backdrop-blur-xl">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-bold text-[#0D2440] dark:text-white">
                  {employees.length}
                </p>
                <p className="text-xs uppercase font-bold tracking-wider text-[#2E5E99] dark:text-[#7BA4D0] mt-4">
                  Total Employees
                </p>
              </div>
              <div className="p-3 bg-[#2E5E99]/20 rounded-full">
                <Users className="h-6 w-6 text-[#2E5E99]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2E5E99]/10 border-[#2E5E99]/20 shadow-md backdrop-blur-xl">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-bold text-[#0D2440] dark:text-white">
                  {activeCount}
                </p>
                <p className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 mt-4">
                  Total Active Employees
                </p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#2E5E99]/10 border-[#2E5E99]/20 shadow-md backdrop-blur-xl">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-4xl font-bold text-[#0D2440] dark:text-white">
                  {inactiveCount}
                </p>
                <p className="text-xs uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400 mt-4">
                  Total Inactive Employees
                </p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-full">
                <UserX className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {showElement('hr.add') && (
          <Button onClick={openCreate} className="bg-[#2E5E99] hover:bg-[#204a7c] text-white font-semibold gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => setImportOpen(true)}
          className="border-[#2E5E99]/30 text-[#2E5E99] dark:text-[#7BA4D0] font-semibold gap-2 rounded-xl"
        >
          <Upload className="h-4 w-4" /> Import Employees
        </Button>
      </div>

      {/* Employee List Banner & Search Header */}
      <div className="bg-[#2E5E99] text-white rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-sm">
          Employee List
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

      {/* Employee Data Table matching Screenshot 11.19.28 AM */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#40A8B1]" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <BriefcaseBusiness className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No employees found</p>
            <p className="text-sm">Register your first employee to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b text-left text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-4">Employee ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Gross</th>
                  <th className="py-3.5 px-4">Deduction</th>
                  <th className="py-3.5 px-4">Benefit</th>
                  <th className="py-3.5 px-4">Net</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((emp) => {
                  const gross = emp.grossSalary || emp.salary || 0;
                  const deduction = emp.deduction || emp.tax || 0;
                  const benefit = emp.benefit || 0;
                  const net = emp.netSalary || (gross + benefit - deduction);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-4 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                        {emp.employeeId || `EMP-${emp.id.slice(0, 4).toUpperCase()}`}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-900 dark:text-white">
                        {emp.fullName}
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {gross > 0 ? gross.toLocaleString() : '—'}
                      </td>
                      <td className="py-4 px-4 text-rose-600 font-medium">
                        {deduction > 0 ? deduction.toLocaleString() : '—'}
                      </td>
                      <td className="py-4 px-4 text-emerald-600 font-medium">
                        {benefit > 0 ? benefit.toLocaleString() : '—'}
                      </td>
                      <td className="py-4 px-4 font-bold text-cyan-600">
                        {net > 0 ? net.toLocaleString() : '—'}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={`px-2.5 py-0.5 font-bold uppercase text-[10px] ${STATUS_COLORS[emp.status] ?? STATUS_COLORS.Active}`}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-xs">
                        {emp.hireDate || '—'}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetails(emp)}
                          className="text-slate-600 hover:text-cyan-600"
                          title="View Employee Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(emp)} title="Edit Employee">
                          <Pencil className="h-4 w-4 text-slate-600" />
                        </Button>
                        {showElement('hr.delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Remove ${emp.fullName}?`)) deleteMutation.mutate(emp.id);
                            }}
                            title="Remove Employee"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 7-Step Registration Wizard */}
      <EmployeeRegistrationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSubmit={(empData) => saveMutation.mutate(empData)}
        editingEmployee={editingEmployee}
      />

      {/* Detailed Employee Profile Viewer */}
      <EmployeeDetailsDialog
        employee={selectedEmployee}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Import Employees CSV Dialog */}
      <ImportEmployeesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </div>
  );
}
