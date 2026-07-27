import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/services/hr';
import { User, Briefcase, Phone, Mail, Building, GraduationCap, DollarSign, HeartHandshake, MapPin } from 'lucide-react';

interface EmployeeDetailsDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeDetailsDialog({ employee, open, onOpenChange }: EmployeeDetailsDialogProps) {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between pr-6">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-600" />
                {employee.fullName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-mono">
                Employee ID: {employee.employeeId || `EMP-${employee.id.slice(0, 5).toUpperCase()}`}
              </p>
            </div>
            <Badge className={employee.status === 'Active' ? 'bg-green-600' : 'bg-amber-500'}>
              {employee.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Job & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Position</span>
              <p className="text-sm font-bold">{employee.position || 'N/A'}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Department</span>
              <p className="text-sm font-bold">{employee.department || 'Administration'}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">Employment Type</span>
              <p className="text-sm font-bold">{employee.employmentType}</p>
            </div>
          </div>

          {/* Payroll Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4" /> Payroll & Financials
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-500 block">Gross Salary</span>
                <span className="font-bold text-sm">{(employee.grossSalary || employee.salary || 0).toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Benefits</span>
                <span className="font-bold text-sm text-emerald-600">+{(employee.benefit || 0).toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Deductions</span>
                <span className="font-bold text-sm text-rose-600">-{(employee.deduction || employee.tax || 0).toLocaleString()} ETB</span>
              </div>
              <div>
                <span className="text-slate-500 block">Net Salary</span>
                <span className="font-bold text-sm text-cyan-600">{(employee.netSalary || employee.salary || 0).toLocaleString()} ETB</span>
              </div>
            </div>
          </div>

          {/* Education */}
          {employee.educationBackground && employee.educationBackground.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" /> Education Background
              </h4>
              <div className="space-y-2">
                {employee.educationBackground.map((edu, i) => (
                  <div key={i} className="border p-3 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold">{edu.academicStatus} - {edu.fieldOfStudy}</p>
                      <p className="text-slate-500">{edu.institution}</p>
                    </div>
                    <span className="font-mono text-slate-400">{edu.graduationDate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {employee.emergencyFirstName && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 flex items-center gap-1.5">
                <HeartHandshake className="h-4 w-4" /> Emergency Contact
              </h4>
              <div className="border p-3 rounded-lg text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Name:</span> {employee.emergencySalutation} {employee.emergencyFirstName} {employee.emergencyLastName}
                </div>
                <div>
                  <span className="text-slate-500">Relationship:</span> {employee.emergencyRelationship}
                </div>
                <div>
                  <span className="text-slate-500">Phone:</span> {employee.emergencyPhone}
                </div>
                <div>
                  <span className="text-slate-500">Address:</span> {employee.emergencyAddress}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
