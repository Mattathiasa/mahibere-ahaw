import { useState } from 'react';
import { toast } from 'sonner';
import { ETHIOPIAN_REGIONS } from '@/types';
import { isValidPhone, normalizeEthiopianPhone } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin, Briefcase, Check, Shield, Heart, Users } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n/translations';

interface MemberWizardProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

/**
 * The ministry name is stored on the member's record, so the token stays as it
 * is; only its label is translated.
 */
const MINISTRY_KEYS: Record<string, keyof Translations['people']> = {
  'Sunday School': 'ministrySundaySchool',
  'Youth Ministry': 'ministryYouthMinistry',
  'Women Ministry': 'ministryWomenMinistry',
  'Choir': 'ministryChoir',
  'Deacon Service': 'ministryDeaconService',
  'Prayer Team': 'ministryPrayerTeam',
  'Media Ministry': 'ministryMediaMinistry',
};
const ministryOptions = Object.keys(MINISTRY_KEYS);

const churchRoles = [
  'Member',
  'Leader',
  'Coordinator',
  'Preacher',
  'Teacher',
  'Administrator',
  'Elder',
];

export const MemberWizard = ({ onClose, onSubmit, initialData }: MemberWizardProps) => {
  const { t } = useTranslation();
  const moduleCfg = useModuleConfig('members');
  // Roles come from the registry rather than a local copy of the old 7-value list.
  const { roles, roleLabel } = usePermissions();
  const { t: tt } = useLanguage();
  const f = tt.forms;
  const a = tt.admin;
  const hierarchyLevels = roles.filter((r) => r.active !== false).map((r) => r.key);
  const fieldVisible = (key: string) => moduleCfg.fields.find((f) => f.key === key)?.visible ?? true;
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
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value],
    }));
  };

  /**
   * Returns a problem to show, or null when the form is sound.
   *
   * The asterisks on this wizard used to be decoration — nothing checked them,
   * so a member could be saved with no name and no phone number at all.
   */
  const validate = (): string | null => {
    if (!formData.fullNameEnglish.trim()) return a.needNameEn;
    if (!formData.fullNameAmharic.trim()) return a.needNameAm;
    if (!initialData) {
      if (!/^[a-zA-Z0-9._-]{3,}$/.test(formData.username.trim())) {
        return a.needUsername;
      }
      if (formData.password.length < 6) return a.needPassword;
    }
    // Email stays optional — the member signs in with their username, and many
    // members have no address at all.
    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      return a.badEmail;
    }
    if (!formData.phoneNumber.trim()) return a.needPhone;
    if (!isValidPhone(formData.phoneNumber)) {
      return a.badPhoneWizard;
    }
    return null;
  };

  const handleSubmit = () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    onSubmit({
      ...formData,
      phoneNumber: normalizeEthiopianPhone(formData.phoneNumber) ?? formData.phoneNumber.trim(),
    });
    onClose();
  };

  // If editing, we can skip the credentials step (Step 2)
  const baseSteps = [
    { number: 1, title: a.stepIdentity, icon: User },
    ...(initialData ? [] : [{ number: 2, title: a.stepCredentials, icon: Shield }]),
    { number: 3, title: a.stepStatus, icon: Heart },
    { number: 4, title: a.stepLocation, icon: MapPin },
    { number: 5, title: a.stepService, icon: Briefcase },
    { number: 6, title: a.stepReview, icon: Check },
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
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase transition-all">{a.identityDetails}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">{a.identityDetailsSub}</p>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.fullNameEnglish} *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.fullNameEnglish}
                      onChange={(e) => setFormData({ ...formData, fullNameEnglish: e.target.value })}
                      placeholder={f.namePlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.fullNameAmharic} *</Label>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.dateOfBirth} *</Label>
                    <EthiopianDatePicker
                      value={formData.dateOfBirth}
                      onChange={(isoDate) => setFormData({ ...formData, dateOfBirth: isoDate })}
                      className="h-14 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.gender} *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                        <SelectValue placeholder={a.gender} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{a.male}</SelectItem>
                        <SelectItem value="Female">{a.female}</SelectItem>
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
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">{a.systemCredentials}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">{a.systemCredentialsSub}</p>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.username} *</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="johndoe123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.password} *</Label>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.email}</Label>
                    <Input
                      type="email"
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder={f.emailPlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.phoneNumber} *</Label>
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
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">{a.lifeStewardship}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">{a.lifeStewardshipSub}</p>
              </CardHeader>
              <CardContent className="space-y-8 px-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {fieldVisible('workSchool') && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.workSchool}</Label>
                      <Input
                        className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                        value={formData.workSchool}
                        onChange={(e) => setFormData({ ...formData, workSchool: e.target.value })}
                        placeholder={f.occupationPlaceholder}
                      />
                    </div>
                  )}
                  {fieldVisible('maritalStatus') && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.maritalStatus}</Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
                      >
                        <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                          <SelectValue placeholder={a.maritalStatus} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">{a.single}</SelectItem>
                          <SelectItem value="Married">{a.married}</SelectItem>
                          <SelectItem value="Divorced">{a.divorced}</SelectItem>
                          <SelectItem value="Widowed">{a.widowed}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50/50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-black uppercase tracking-wider">{a.children}</Label>
                      <p className="text-[10px] text-muted-foreground">{a.hasChildrenQ}</p>
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
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.childrenCount}</Label>
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
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">{a.localPresence}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">{a.localPresenceSub}</p>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.region}</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                      <SelectValue placeholder={a.selectRegion} />
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
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.zone}</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      placeholder={f.woredaPlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.woreda}</Label>
                    <Input
                      className="h-14 rounded-2xl border-2 focus:border-[#2E5E99] bg-white/50 backdrop-blur-sm"
                      value={formData.woreda}
                      onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                      placeholder={f.subCityPlaceholder}
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
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">{a.divineService}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">{a.divineServiceSub}</p>
              </CardHeader>
              <CardContent className="space-y-10 px-0">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.hierarchyLevel} *</Label>
                  <Select
                    value={formData.hierarchyLevel}
                    onValueChange={(value) => setFormData({ ...formData, hierarchyLevel: value })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 bg-white/50">
                      <SelectValue placeholder={a.hierarchyLevel} />
                    </SelectTrigger>
                    <SelectContent>
                      {hierarchyLevels.map((level) => (
                        <SelectItem key={level} value={level}>{roleLabel(level)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.churchRoles}</Label>
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
                  <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">{a.ministryTeams}</Label>
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
                        <span className="text-[10px] font-bold uppercase tracking-widest italic">{MINISTRY_KEYS[ministry] ? tt.people[MINISTRY_KEYS[ministry]] : ministry}</span>
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
                <CardTitle className="text-2xl font-black italic tracking-tight uppercase">{a.reviewTitle}</CardTitle>
                <p className="text-sm text-muted-foreground font-medium">{a.reviewSub}</p>
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
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2E5E99]">{f.personalArchive}</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">{f.username}</span><span className="text-sm font-bold">{formData.username}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">{f.born}</span><span className="text-sm font-bold">{formData.dateOfBirth}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">{f.phoneNumber}</span><span className="text-sm font-bold">{formData.phoneNumber}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">{f.memberStatus}</span><span className="text-sm font-bold">{formData.maritalStatus} {formData.hasChildren ? `(${formData.childrenCount} Children)` : ''}</span></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2E5E99]">{f.divineAssignment}</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">{f.region}</span><span className="text-sm font-bold">{formData.region}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs opacity-50">{f.profession}</span><span className="text-sm font-bold truncate max-w-[150px]">{formData.workSchool || 'Independent'}</span></div>
                      <div className="flex flex-col gap-2 pt-2">
                        <span className="text-xs opacity-50">{f.assignedRoles}</span>
                        <div className="flex flex-wrap gap-2">
                          {formData.churchRoles.map((r: string) => <span key={r} className="px-3 py-1 bg-[#2E5E99]/10 text-[#2E5E99] rounded-full text-[9px] font-black uppercase">{r}</span>)}
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
          {step === 1 ? a.discard : a.goBack}
        </Button>
        <Button
          className="h-14 px-12 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[#2E5E99]/20"
          onClick={step === steps[steps.length - 1].number ? handleSubmit : nextStep}
        >
          {step === steps[steps.length - 1].number ? a.secureProfile : a.continue}
        </Button>
      </div>
    </div>
  );
};
