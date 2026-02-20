import { useState } from 'react';
import { ETHIOPIAN_REGIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, MapPin, Briefcase, Check } from 'lucide-react';
import { MinistryType } from '@/lib/mockData';

interface MemberWizardProps {
  onClose: () => void;
}

const ministryOptions: MinistryType[] = [
  'Sunday School',
  'Youth Ministry',
  'Women Ministry',
  'Choir',
  'Deacon Service',
  'Prayer Team',
  'Media Ministry',
];

export const MemberWizard = ({ onClose }: MemberWizardProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    region: '',
    zone: '',
    woreda: '',
    ministryType: [] as MinistryType[],
  });

  const handleMinistryToggle = (ministry: MinistryType) => {
    setFormData((prev) => ({
      ...prev,
      ministryType: prev.ministryType.includes(ministry)
        ? prev.ministryType.filter((m) => m !== ministry)
        : [...prev.ministryType, ministry],
    }));
  };

  const handleSubmit = () => {
    console.log('Member data:', formData);
    onClose();
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Address', icon: MapPin },
    { number: 3, title: 'Ministry', icon: Briefcase },
    { number: 4, title: 'Review', icon: Check },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = step === s.number;
          const isComplete = step > s.number;

          return (
            <div key={s.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isComplete
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isActive
                      ? 'border-primary text-primary'
                      : 'border-muted text-muted-foreground'
                    }`}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <p
                  className={`text-xs mt-2 ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                    }`}
                >
                  {s.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${step > s.number ? 'bg-primary' : 'bg-muted'
                    }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="+251..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth *</Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
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

      {/* Step 2: Address */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Address Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {ETHIOPIAN_REGIONS.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Zone *</Label>
              <Input
                id="zone"
                value={formData.zone}
                onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                placeholder="e.g., Bole"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="woreda">Woreda *</Label>
              <Input
                id="woreda"
                value={formData.woreda}
                onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                placeholder="e.g., Bole Sub City"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Ministry */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Ministry Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select all ministries this member is involved in:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ministryOptions.map((ministry) => (
                  <div key={ministry} className="flex items-center space-x-2">
                    <Checkbox
                      id={ministry}
                      checked={formData.ministryType.includes(ministry)}
                      onCheckedChange={() => handleMinistryToggle(ministry)}
                    />
                    <Label htmlFor={ministry} className="cursor-pointer">
                      {ministry}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-4 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {formData.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{formData.fullName}</h3>
                <p className="text-sm text-muted-foreground">{formData.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Phone</p>
                <p>{formData.phoneNumber}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Gender</p>
                <p>{formData.gender}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Date of Birth</p>
                <p>{formData.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Region</p>
                <p>{formData.region}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Zone</p>
                <p>{formData.zone}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">Woreda</p>
                <p>{formData.woreda}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Ministries</p>
              <div className="flex flex-wrap gap-2">
                {formData.ministryType.map((ministry) => (
                  <span
                    key={ministry}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {ministry}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
        >
          {step === 1 ? 'Cancel' : 'Previous'}
        </Button>
        <Button onClick={() => (step === 4 ? handleSubmit() : setStep(step + 1))}>
          {step === 4 ? 'Add Member' : 'Next'}
        </Button>
      </div>
    </div>
  );
};
