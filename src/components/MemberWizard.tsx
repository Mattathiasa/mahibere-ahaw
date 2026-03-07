import { useState } from 'react';
import { ETHIOPIAN_REGIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin, Briefcase, Check, Shield, Heart, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

interface MemberWizardProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const ministryOptions = [
  'Sunday School',
  'Youth Ministry',
  'Women Ministry',
  'Choir',
  'Deacon Service',
  'Prayer Team',
  'Media Ministry',
];

const churchRoles = [
  'Member',
  'Leader',
  'Coordinator',
  'Preacher',
  'Teacher',
  'Administrator',
  'Elder',
];

const hierarchyLevels = [
  'Sinodos',
  'KuamiSinodos',
  'Memriya',
  'Zone',
  'Atbiya',
  'EnkesekaseMaikel',
  'HiyawanMahderat'
];

export const MemberWizard = ({ onClose, onSubmit, initialData }: MemberWizardProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullNameEnglish: initialData?.fullNameEnglish || initialData?.fullName || '',
    fullNameAmharic: initialData?.fullNameAmharic || '',
    username: initialData?.username || '',
    password: '',
    email: initialData?.email || '',
    phoneNumber: initialData?.phoneNumber || initialData?.phone || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    gender: initialData?.gender || 'Male',
    hierarchyLevel: initialData?.hierarchyLevel || 'Atbiya',
    ministryType: initialData?.ministryType || [],
    churchRoles: initialData?.churchRoles || [],
    workSchool: initialData?.workSchool || initialData?.work || '',
    maritalStatus: initialData?.maritalStatus || 'Single',
    hasChildren: initialData?.hasChildren || false,
    childrenCount: initialData?.childrenCount || initialData?.numberOfChildren || 0,
    region: initialData?.region || initialData?.address?.region || '',
    zone: initialData?.zone || initialData?.address?.zone || '',
    woreda: initialData?.woreda || initialData?.address?.woreda || '',
  });

  const handleToggle = (field: 'ministryType' | 'churchRoles', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  // If editing, we can skip the credentials step (Step 2)
  const baseSteps = [
    { number: 1, title: 'Identity', icon: User },
    ...(initialData ? [] : [{ number: 2, title: 'Credentials', icon: Shield }]),
    { number: 3, title: 'Status', icon: Heart },
    { number: 4, title: 'Location', icon: MapPin },
    { number: 5, title: 'Service', icon: Briefcase },
    { number: 6, title: 'Review', icon: Check },
  ];

  // Adjust numbers for the UI
  const steps = baseSteps.map((s, i) => ({ ...s, displayOrder: i + 1 }));

  const nextStep = () => setStep(prev => {
    const currentIndex = steps.findIndex(s => s.number === prev);
    if (currentIndex < steps.length - 1) return steps[currentIndex + 1].number;
    return prev;
  });

  const prevStep = () => setStep(prev => {
    const currentIndex = steps.findIndex(s => s.number === prev);
    if (currentIndex > 0) return steps[currentIndex - 1].number;
    return prev;
  });

  return (
    <div className="space-y-8 p-1">
      {/* Progress Steps */}
      <div className="hidden md:flex items-center justify-between mb-12 overflow-x-auto pb-4">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = step === s.number;
          const isComplete = step > s.number;

          return (
            <div key={s.number} className="flex items-center flex-1 min-w-[100px]">
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: isComplete || isActive ? '#2E5E99' : 'transparent',
                    borderColor: isComplete || isActive ? '#2E5E99' : '#e2e8f0',
                    color: isComplete || isActive ? '#ffffff' : '#94a3b8'
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-sm"
                >
                  {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </motion.div>
                <p className={`text-[10px] font-black uppercase mt-2 tracking-widest ${isActive ? 'text-[#2E5E99]' : 'text-[#94a3b8]'}`}>
                  {s.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-[2px] w-full mx-2 ${step > s.number ? 'bg-[#2E5E99]' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Personal Identity */}
          {step === 1 && (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase transition-all">Identity Details</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Sacred names and birth record.</p>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Full Name (English) *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.fullNameEnglish}
                      onChange={(e) => setFormData({ ...formData, fullNameEnglish: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Full Name (Amharic) *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.fullNameAmharic}
                      onChange={(e) => setFormData({ ...formData, fullNameAmharic: e.target.value })}
                      placeholder="ዮሐንስ ደቡብ"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Date of Birth *</Label>
                    <Input
                      type="date"
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Gender *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Credentials */}
          {step === 2 && (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">System Credentials</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Digital access and communication.</p>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Username *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="johndoe123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Password *</Label>
                    <Input
                      type="password"
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Email Address</Label>
                    <Input
                      type="email"
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Phone Number *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+251 911 22 33 44"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Social & Life Status */}
          {step === 3 && (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">Life Stewardship</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Family and daily occupation.</p>
              </CardHeader>
              <CardContent className="space-y-8 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Work / School</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.workSchool}
                      onChange={(e) => setFormData({ ...formData, workSchool: e.target.value })}
                      placeholder="Occupation or Institution"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Marital Status</Label>
                    <Select
                      value={formData.maritalStatus}
                      onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase tracking-wider">Children</Label>
                      <p className="text-[10px] text-muted-foreground">Does the member have any children?</p>
                    </div>
                    <Checkbox
                      checked={formData.hasChildren}
                      onCheckedChange={(checked) => setFormData({ ...formData, hasChildren: !!checked })}
                      className="h-6 w-6 rounded-lg"
                    />
                  </div>

                  {formData.hasChildren && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 pt-4 border-t border-slate-200"
                    >
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Number of Children</Label>
                      <Input
                        type="number"
                        className="h-14 rounded-2xl border-2 mt-2 bg-white"
                        value={formData.childrenCount}
                        onChange={(e) => setFormData({ ...formData, childrenCount: parseInt(e.target.value) || 0 })}
                        min={1}
                      />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">Local Presence</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Physical address and region.</p>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Region *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHIOPIAN_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Zone *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      placeholder="e.g. Bole"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Woreda *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.woreda}
                      onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                      placeholder="e.g. Sub City"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Service & Roles */}
          {step === 5 && (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">Divine Service</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Organizational level and spiritual roles.</p>
              </CardHeader>
              <CardContent className="space-y-10 px-0">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Hierarchy Level *</Label>
                  <Select
                    value={formData.hierarchyLevel}
                    onValueChange={(value) => setFormData({ ...formData, hierarchyLevel: value })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {hierarchyLevels.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Church Roles</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {churchRoles.map((role) => (
                      <div
                        key={role}
                        onClick={() => handleToggle('churchRoles', role)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${formData.churchRoles.includes(role)
                          ? 'bg-[#2E5E99] border-[#2E5E99] text-white shadow-lg'
                          : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}
                      >
                        <Shield className={`h-4 w-4 ${formData.churchRoles.includes(role) ? 'text-white' : 'text-[#2E5E99]'}`} />
                        <span className="text-[11px] font-black uppercase tracking-tight">{role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Ministry Teams</Label>
                  <div className="flex flex-wrap gap-3">
                    {ministryOptions.map((ministry) => (
                      <div
                        key={ministry}
                        onClick={() => handleToggle('ministryType', ministry)}
                        className={`px-6 py-3 rounded-full border-2 cursor-pointer transition-all flex items-center gap-2 ${formData.ministryType.includes(ministry)
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg'
                          : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest italic">{ministry}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <Card className="border-none shadow-none bg-transparent">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">Holy Record Verification</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">Finalizing the member profile.</p>
              </CardHeader>
              <CardContent className="space-y-10 px-0">
                <div className="flex items-center gap-6 p-8 rounded-[3rem] bg-white shadow-2xl">
                  <Avatar className="h-24 w-24 border-4 border-[#2E5E99] shadow-xl">
                    <AvatarFallback className="bg-gradient-to-br from-[#2E5E99] to-[#0D2440] text-3xl text-white font-black italic">
                      {formData.fullNameEnglish ? formData.fullNameEnglish.charAt(0) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-3xl font-black italic tracking-tighter text-[#0D2440]">{formData.fullNameEnglish}</h3>
                    <p className="text-sm font-black uppercase text-[#2E5E99] tracking-widest">{formData.fullNameAmharic}</p>
                    <div className="flex items-center gap-2 opacity-50 text-[10px] font-black uppercase tracking-widest">
                      <Users className="h-3 w-3" />
                      {formData.hierarchyLevel} Level Soul
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 px-4">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2E5E99]">Personal Archive</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">Username</span><span className="text-sm font-bold">{formData.username}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">Born</span><span className="text-sm font-bold">{formData.dateOfBirth}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">Phone</span><span className="text-sm font-bold">{formData.phoneNumber}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">Status</span><span className="text-sm font-bold">{formData.maritalStatus} {formData.hasChildren ? `(${formData.childrenCount} Children)` : ''}</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2E5E99]">Divine Assignment</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">Region</span><span className="text-sm font-bold">{formData.region}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">Profession</span><span className="text-sm font-bold truncate max-w-[150px]">{formData.workSchool || 'Independent'}</span></div>
                      <div className="flex flex-col gap-2 pt-2">
                        <span className="text-xs opacity-50">Assigned Roles</span>
                        <div className="flex flex-wrap gap-2">
                          {formData.churchRoles.map(r => <span key={r} className="px-3 py-1 bg-[#2E5E99]/10 text-[#2E5E99] rounded-full text-[9px] font-black uppercase">{r}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-8 border-t border-slate-100">
        <Button
          variant="ghost"
          className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50"
          onClick={step === 1 ? onClose : prevStep}
        >
          {step === 1 ? 'Discard' : 'Go Back'}
        </Button>
        <Button
          className="h-14 px-12 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#2E5E99]/20"
          onClick={step === steps[steps.length - 1].number ? handleSubmit : nextStep}
        >
          {step === steps[steps.length - 1].number ? 'Secure Profile' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};
