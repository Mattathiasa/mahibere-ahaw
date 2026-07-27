import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Plus, Trash2, Calendar as CalendarIcon, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { Employee, EducationItem } from '@/services/hr';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

interface EmployeeRegistrationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (employeeData: Partial<Employee>) => void;
  editingEmployee?: Employee | null;
}

const STEPS = [
  'Employer Information',
  'Personal Info',
  'Family Information',
  'Education Background',
  'Job',
  'Bank and TIN',
  'Emergency Contact',
];

export function EmployeeRegistrationWizard({
  open,
  onOpenChange,
  onSubmit,
  editingEmployee,
}: EmployeeRegistrationWizardProps) {
  const [activeStep, setActiveStep] = useState(0);

  // Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    fullName: editingEmployee?.fullName || '',
    position: editingEmployee?.position || '',
    department: editingEmployee?.department || 'Administration',
    category: editingEmployee?.category || 'Staff',
    employmentType: editingEmployee?.employmentType || 'FullTime',
    status: editingEmployee?.status || 'Active',

    // Step 1: Employer Information
    employerName: editingEmployee?.employerName || 'Mahibere Ahaw Church',
    employerLocation: editingEmployee?.employerLocation || 'Addis Ababa',
    employerHouseNumber: editingEmployee?.employerHouseNumber || '',
    employerPhone: editingEmployee?.employerPhone || '+251',

    // Step 2: Personal Info
    gender: editingEmployee?.gender || 'Male',
    dateOfBirth: editingEmployee?.dateOfBirth || '',
    phone: editingEmployee?.phone || '+251',
    email: editingEmployee?.email || '',
    address: editingEmployee?.address || '',

    // Step 3: Family Information
    spouseName: editingEmployee?.spouseName || '',
    spousePhone: editingEmployee?.spousePhone || '',
    childrenCount: editingEmployee?.childrenCount || 0,

    // Step 4: Education Background
    educationBackground: editingEmployee?.educationBackground || [
      { academicStatus: 'Degree', institution: '', fieldOfStudy: '', graduationDate: '' }
    ],

    // Step 5: Job
    hireDate: editingEmployee?.hireDate || '',
    haveWorkExperience: editingEmployee?.haveWorkExperience ?? false,

    // Step 6: Bank & TIN / Payroll
    salaryBankName: editingEmployee?.salaryBankName || 'Commercial Bank of Ethiopia',
    salaryBankAccount: editingEmployee?.salaryBankAccount || '',
    pfBankName: editingEmployee?.pfBankName || '',
    pfBankAccount: editingEmployee?.pfBankAccount || '',
    socialId: editingEmployee?.socialId || '',
    tin: editingEmployee?.tin || '',
    grossSalary: editingEmployee?.grossSalary || 0,
    overtime: editingEmployee?.overtime || 0,
    transportAllowance: editingEmployee?.transportAllowance || 0,
    houseAllowance: editingEmployee?.houseAllowance || 0,
    communicationAllowance: editingEmployee?.communicationAllowance || 0,
    bonus: editingEmployee?.bonus || 0,
    tax: editingEmployee?.tax || 0,
    pension: editingEmployee?.pension || 0,
    providentFund: editingEmployee?.providentFund || 0,
    credit: editingEmployee?.credit || 0,
    penalty: editingEmployee?.penalty || 0,
    netSalary: editingEmployee?.netSalary || 0,

    // Step 7: Emergency Contact
    emergencySalutation: editingEmployee?.emergencySalutation || 'Mr.',
    emergencyFirstName: editingEmployee?.emergencyFirstName || '',
    emergencyMiddleName: editingEmployee?.emergencyMiddleName || '',
    emergencyLastName: editingEmployee?.emergencyLastName || '',
    emergencyRelationship: editingEmployee?.emergencyRelationship || '',
    emergencyPhone: editingEmployee?.emergencyPhone || '+251',
    emergencyAddress: editingEmployee?.emergencyAddress || '',
  });

  // Calculate Net Salary Automatically
  const calculateNetSalary = () => {
    const gross = Number(formData.grossSalary || 0);
    const overtime = Number(formData.overtime || 0);
    const transport = Number(formData.transportAllowance || 0);
    const house = Number(formData.houseAllowance || 0);
    const comm = Number(formData.communicationAllowance || 0);
    const bonus = Number(formData.bonus || 0);

    const totalIncome = gross + overtime + transport + house + comm + bonus;

    // Ethiopian Pension (7% of Gross Salary)
    const pension = Math.round(gross * 0.07);

    // Ethiopian Progressive Tax
    let tax = 0;
    if (gross > 10900) tax = (gross * 0.35) - 1500;
    else if (gross > 7800) tax = (gross * 0.30) - 955;
    else if (gross > 5250) tax = (gross * 0.25) - 565;
    else if (gross > 3200) tax = (gross * 0.20) - 305;
    else if (gross > 1650) tax = (gross * 0.15) - 142.5;
    else if (gross > 600) tax = (gross * 0.10) - 60;

    tax = Math.max(0, Math.round(tax));

    const credit = Number(formData.credit || 0);
    const pf = Number(formData.providentFund || 0);
    const penalty = Number(formData.penalty || 0);

    const totalDeduction = tax + pension + pf + credit + penalty;
    const net = Math.max(0, totalIncome - totalDeduction);

    setFormData(prev => ({
      ...prev,
      tax,
      pension,
      deduction: totalDeduction,
      benefit: transport + house + comm + bonus,
      netSalary: net,
    }));
  };

  const handleFieldChange = (field: keyof Employee, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      return next;
    });
  };

  const addEducationItem = () => {
    const current = formData.educationBackground || [];
    setFormData({
      ...formData,
      educationBackground: [
        ...current,
        { academicStatus: 'Degree', institution: '', fieldOfStudy: '', graduationDate: '' },
      ],
    });
  };

  const removeEducationItem = (index: number) => {
    const current = [...(formData.educationBackground || [])];
    current.splice(index, 1);
    setFormData({ ...formData, educationBackground: current });
  };

  const handleEducationChange = (index: number, key: keyof EducationItem, val: string) => {
    const current = [...(formData.educationBackground || [])];
    current[index] = { ...current[index], [key]: val };
    setFormData({ ...formData, educationBackground: current });
  };

  const handleSubmit = () => {
    calculateNetSalary();
    onSubmit({
      ...formData,
      employeeId: formData.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
      salary: formData.grossSalary,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        {/* Wizard Header Bar */}
        <div className="bg-[#2E5E99] text-white p-4 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <DialogTitle className="text-xl font-bold tracking-wide">
            Employee Registration
          </DialogTitle>
          <button onClick={() => onOpenChange(false)} className="hover:bg-white/20 p-1.5 rounded-full transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Tabs Navbar */}
        <div className="flex flex-wrap border-b bg-slate-50 dark:bg-slate-900 p-2 gap-1 overflow-x-auto">
          {STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStep(idx)}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeStep === idx
                  ? 'bg-[#2E5E99] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {step}
            </button>
          ))}
        </div>

        {/* Step Contents */}
        <div className="p-6 min-h-[380px]">
          {/* Step 1: Employer Information */}
          {activeStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Employer Name (Church Name)</Label>
                <Input
                  value={formData.employerName}
                  onChange={(e) => handleFieldChange('employerName', e.target.value)}
                  placeholder="Mahibere Ahaw Church"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  value={formData.employerLocation}
                  onChange={(e) => handleFieldChange('employerLocation', e.target.value)}
                  placeholder="Addis Ababa, Ethiopia"
                />
              </div>

              <div className="space-y-1.5">
                <Label>House Number</Label>
                <Input
                  value={formData.employerHouseNumber}
                  onChange={(e) => handleFieldChange('employerHouseNumber', e.target.value)}
                  placeholder="House No."
                />
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  value={formData.employerPhone}
                  onChange={(e) => handleFieldChange('employerPhone', e.target.value)}
                  placeholder="+251 9..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {activeStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                  placeholder="e.g. Abebe Bikila"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={(v) => handleFieldChange('gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>የትውልድ ቀን (Date of Birth)</Label>
                <EthiopianDatePicker
                  value={formData.dateOfBirth}
                  onChange={(isoDate) => handleFieldChange('dateOfBirth', isoDate)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label>Residential Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 3: Family Information */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Spouse Full Name</Label>
                <Input
                  value={formData.spouseName}
                  onChange={(e) => handleFieldChange('spouseName', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Spouse Phone Number</Label>
                <Input
                  value={formData.spousePhone}
                  onChange={(e) => handleFieldChange('spousePhone', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Number of Children</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.childrenCount}
                  onChange={(e) => handleFieldChange('childrenCount', Number(e.target.value))}
                />
              </div>
            </div>
          )}

          {/* Step 4: Education Background matching Screenshots 11.20.54 & 11.20.58 AM */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label>CV Document</Label>
                <div className="border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                  <Input type="file" accept=".pdf,.doc,.docx" className="text-xs" />
                  <Upload className="h-4 w-4 text-slate-500" />
                </div>
              </div>

              {formData.educationBackground?.map((edu, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl p-4 space-y-3 relative bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-semibold text-xs text-slate-500">Education #{idx + 1}</span>
                    {idx > 0 && (
                      <button onClick={() => removeEducationItem(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Academic Status</Label>
                      <Input
                        value={edu.academicStatus}
                        onChange={(e) => handleEducationChange(idx, 'academicStatus', e.target.value)}
                        placeholder="e.g. Bachelor Degree"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                        placeholder="e.g. Addis Ababa University"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Field Of Study</Label>
                      <Input
                        value={edu.fieldOfStudy}
                        onChange={(e) => handleEducationChange(idx, 'fieldOfStudy', e.target.value)}
                        placeholder="e.g. Accounting, Theology"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Graduation Date (AMH - YYYY)</Label>
                      <Input
                        value={edu.graduationDate}
                        onChange={(e) => handleEducationChange(idx, 'graduationDate', e.target.value)}
                        placeholder="AMH - 2014"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addEducationItem}
                className="w-full border-cyan-500 text-cyan-600 hover:bg-cyan-50 font-medium text-xs gap-2"
              >
                <Plus className="h-4 w-4" /> Add Education Background
              </Button>
            </div>
          )}

          {/* Step 5: Job matching Screenshot 11.21.11 AM */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Current Position *</Label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                  placeholder="e.g. Accountant, Priest, Administrator"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Employment Date (AMH - YYYY)</Label>
                <div className="relative">
                  <Input
                    value={formData.hireDate}
                    onChange={(e) => handleFieldChange('hireDate', e.target.value)}
                    placeholder="AMH - 2016"
                  />
                  <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Employment Type</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(v) => handleFieldChange('employmentType', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FullTime">Full Time</SelectItem>
                    <SelectItem value="PartTime">Part Time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Volunteer">Volunteer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                <Label>Have Work Experience?</Label>
                <RadioGroup
                  value={formData.haveWorkExperience ? 'Yes' : 'No'}
                  onValueChange={(v) => handleFieldChange('haveWorkExperience', v === 'Yes')}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Yes" id="r-yes" />
                    <Label htmlFor="r-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="No" id="r-no" />
                    <Label htmlFor="r-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Step 6: Bank and TIN (Payroll & Financials) matching Screenshot 11.21.23 AM */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Salary Bank Name</Label>
                  <Input
                    value={formData.salaryBankName}
                    onChange={(e) => handleFieldChange('salaryBankName', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Salary Bank Account</Label>
                  <Input
                    value={formData.salaryBankAccount}
                    onChange={(e) => handleFieldChange('salaryBankAccount', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">PF Bank Name</Label>
                  <Input
                    value={formData.pfBankName}
                    onChange={(e) => handleFieldChange('pfBankName', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">PF Bank Account</Label>
                  <Input
                    value={formData.pfBankAccount}
                    onChange={(e) => handleFieldChange('pfBankAccount', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Social Identification Number</Label>
                  <Input
                    value={formData.socialId}
                    onChange={(e) => handleFieldChange('socialId', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tax Identification Number (TIN)</Label>
                  <Input
                    value={formData.tin}
                    onChange={(e) => handleFieldChange('tin', e.target.value)}
                  />
                </div>
              </div>

              {/* Salary Breakdown & Auto-calculators */}
              <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Gross Salary (ETB) *</Label>
                  <Input
                    type="number"
                    value={formData.grossSalary || ''}
                    onChange={(e) => {
                      handleFieldChange('grossSalary', Number(e.target.value));
                      setTimeout(calculateNetSalary, 50);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Overtime (ETB)</Label>
                  <Input
                    type="number"
                    value={formData.overtime || ''}
                    onChange={(e) => {
                      handleFieldChange('overtime', Number(e.target.value));
                      setTimeout(calculateNetSalary, 50);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Transport Allowance</Label>
                  <Input
                    type="number"
                    value={formData.transportAllowance || ''}
                    onChange={(e) => {
                      handleFieldChange('transportAllowance', Number(e.target.value));
                      setTimeout(calculateNetSalary, 50);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">House Allowance</Label>
                  <Input
                    type="number"
                    value={formData.houseAllowance || ''}
                    onChange={(e) => {
                      handleFieldChange('houseAllowance', Number(e.target.value));
                      setTimeout(calculateNetSalary, 50);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tax Deduction (ETB)</Label>
                  <Input
                    type="number"
                    value={formData.tax || ''}
                    readOnly
                    className="bg-slate-100 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pension Deduction (7%)</Label>
                  <Input
                    type="number"
                    value={formData.pension || ''}
                    readOnly
                    className="bg-slate-100 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Net Salary Preview Banner */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-bold">Net Salary</span>
                <span className="text-2xl font-black text-cyan-400">
                  {formData.netSalary ? formData.netSalary.toLocaleString() : '0.00'} ETB
                </span>
              </div>
            </div>
          )}

          {/* Step 7: Emergency Contact matching Screenshot 11.21.31 AM */}
          {activeStep === 6 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Salutation</Label>
                <Input
                  value={formData.emergencySalutation}
                  onChange={(e) => handleFieldChange('emergencySalutation', e.target.value)}
                  placeholder="Mr., Mrs., Dr."
                />
              </div>

              <div className="space-y-1">
                <Label>First Name</Label>
                <Input
                  value={formData.emergencyFirstName}
                  onChange={(e) => handleFieldChange('emergencyFirstName', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Middle Name</Label>
                <Input
                  value={formData.emergencyMiddleName}
                  onChange={(e) => handleFieldChange('emergencyMiddleName', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input
                  value={formData.emergencyLastName}
                  onChange={(e) => handleFieldChange('emergencyLastName', e.target.value)}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label>Relationship</Label>
                <Input
                  value={formData.emergencyRelationship}
                  onChange={(e) => handleFieldChange('emergencyRelationship', e.target.value)}
                  placeholder="e.g. Spouse, Brother, Sister"
                />
              </div>

              <div className="space-y-1">
                <Label>Phone Number</Label>
                <Input
                  value={formData.emergencyPhone}
                  onChange={(e) => handleFieldChange('emergencyPhone', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Address</Label>
                <Input
                  value={formData.emergencyAddress}
                  onChange={(e) => handleFieldChange('emergencyAddress', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <div className="flex gap-2">
            {activeStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setActiveStep(prev => prev - 1)}
                className="gap-2 border-cyan-600 text-cyan-600"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}

            {activeStep < STEPS.length - 1 ? (
              <Button
                onClick={() => setActiveStep(prev => prev + 1)}
                className="bg-[#40A8B1] hover:bg-[#348b93] text-white gap-2"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!formData.fullName?.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Submit & Save
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
