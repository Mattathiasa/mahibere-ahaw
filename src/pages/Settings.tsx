import { SectionCard } from '@/components/ui/SectionCard';
import { ETHIOPIAN_REGIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Palette, Globe, Shield, LogOut, Monitor, Download, Trash, RefreshCw, Database, HardDrive, Wifi, Layout } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { authService } from '@/services/auth';
import { isRealEmail } from '@/services/atbiyaAdmins';
import { userService } from '@/services/users';
import { translationService, TranslationOverrides } from '@/services/translations';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/contexts/PermissionContext';
import { CloudinaryImageUpload } from '@/components/CloudinaryImageUpload';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Language } from '@/i18n/translations';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

const Settings = () => {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const { isSuperAdmin, isAdminRole } = usePermissions();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const [profilePicture, setProfilePicture] = useState((currentUser as any)?.profilePicture || '');
  const [profileData, setProfileData] = useState({
    fullName: currentUser?.fullName || '',
    fullNameAmharic: (currentUser as any)?.fullNameAmharic || '',
    phone: currentUser?.phone || '',
    dateOfBirth: currentUser?.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : '',
    gender: currentUser?.gender || 'Male',
    region: currentUser?.address?.region || '',
    zone: currentUser?.address?.zone || '',
    woreda: currentUser?.address?.woreda || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    meetings: true,
    reports: false,
    weekly: true,
    plans: true,
    finance: true,
  });

  const [preferences, setPreferences] = useState({
    compactMode: false,
    animations: true,
    dateFormat: 'gregorian',
    timeZone: 'eat',
  });

  const [translationOverrides, setTranslationOverrides] = useState<TranslationOverrides>({});
  // Gates the "Admin: Translations" tab. Driven by the role registry now.
  const isAdmin = isSuperAdmin || isAdminRole(currentUser?.hierarchyLevel);
  const { refreshTranslations } = useLanguage();

  // Load preferences from localStorage (Keep app preferences like Theme local for now)
  useEffect(() => {
    const savedPreferences = localStorage.getItem('preferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }

    if (isAdmin) {
      translationService.getOverrides().then(setTranslationOverrides);
    }
  }, [isAdmin]);

  // Initialize notifications from user profile
  useEffect(() => {
    if (currentUser?.notificationPreferences) {
      setNotifications(currentUser.notificationPreferences);
    } else {
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    }
  }, [currentUser]);

  // Update profile data when user changes
  useEffect(() => {
    if (currentUser) {
      setProfileData({
        fullName: currentUser.fullName || '',
        fullNameAmharic: (currentUser as any)?.fullNameAmharic || '',
        phone: currentUser.phone || '',
        dateOfBirth: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : '',
        gender: currentUser.gender || 'Male',
        region: currentUser.address?.region || '',
        zone: currentUser.address?.zone || '',
        woreda: currentUser.address?.woreda || '',
      });
      setProfilePicture((currentUser as any)?.profilePicture || '');
    }
  }, [currentUser]);

  const initials = currentUser?.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userService.updateUser(currentUser?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      authService.getCurrentUser(); // Refresh stored user
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => authService.changePassword(data),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully!');
    },
    // These were read as `error.response?.data?.message` — an axios shape that
    // a Firebase error never has — so every real reason ("Current password is
    // incorrect.") was swallowed and replaced with a generic failure.
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    },
  });

  // ── Username ──────────────────────────────────────────────────────────────
  const [username, setUsername] = useState(currentUser?.username ?? '');
  // currentUser is null on the first render while auth resolves, so seed the
  // field once it arrives — otherwise it stays blank until a manual edit.
  useEffect(() => {
    if (currentUser?.username) setUsername(currentUser.username);
  }, [currentUser?.username]);
  const changeUsernameMutation = useMutation({
    mutationFn: (next: string) => authService.changeUsername(next),
    onSuccess: async () => {
      await authService.getCurrentUser();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Username changed. Use the new one next time you sign in.');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not change the username');
    },
  });

  // Accounts created by an administrator often have no real email, which makes
  // password reset impossible for them. This is how the owner fixes that.
  const usesSyntheticEmail = !isRealEmail(currentUser?.email);
  const [recoveryData, setRecoveryData] = useState({ password: '', email: '' });
  const addRecoveryEmailMutation = useMutation({
    mutationFn: (d: { password: string; email: string }) =>
      authService.addRecoveryEmail(d.password, d.email),
    onSuccess: (_data, variables) => {
      setRecoveryData({ password: '', email: '' });
      toast.success(
        `Confirmation sent to ${variables.email}. Click the link in that email, then sign in with the new address.`,
        { duration: 10000 }
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Could not start the email change');
    },
  });

  const handleSaveProfile = () => {
    const updateData: any = {
      fullName: profileData.fullName,
      fullNameAmharic: profileData.fullNameAmharic,
      phone: profileData.phone,
      dateOfBirth: profileData.dateOfBirth,
      gender: profileData.gender,
      address: {
        region: profileData.region,
        zone: profileData.zone,
        woreda: profileData.woreda,
      },
    };

    if (profilePicture && profilePicture !== (currentUser as any)?.profilePicture) {
      updateData.profilePicture = profilePicture;
    }

    updateProfileMutation.mutate(updateData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handleSaveNotifications = () => {
    updateProfileMutation.mutate({
      notificationPreferences: notifications
    });
  };

  const handleSavePreferences = () => {
    localStorage.setItem('preferences', JSON.stringify(preferences));
    toast.success('Preferences saved!');
  };

  const handleLogout = () => {
    logout();
  };

  const handleSaveTranslations = async () => {
    try {
      await translationService.saveOverrides(translationOverrides);
      await refreshTranslations();
      toast.success('Translations updated successfully!');
    } catch (error) {
      toast.error('Failed to save translations');
    }
  };

  const updateTranslation = (lang: Language, section: string, key: string, value: string) => {
    setTranslationOverrides(prev => ({
      ...prev,
      [lang]: {
        ...(prev[lang as keyof TranslationOverrides] || {}),
        [section]: {
          ...((prev[lang as keyof TranslationOverrides] as any)?.[section] || {}),
          [key]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4 lg:grid-cols-7' : 'grid-cols-3 lg:grid-cols-6'}`}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          {isAdmin && <TabsTrigger value="translations" className="text-primary font-bold">Admin: Translations</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <SectionCard title="Profile Information" icon={User}>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary">
                  {profilePicture && <AvatarImage src={profilePicture} alt={currentUser?.fullName} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{currentUser?.fullName}</p>
                  <CloudinaryImageUpload
                    value={profilePicture}
                    onChange={setProfilePicture}
                    folder="mahibere-ahaw/avatars"
                    label="Upload profile picture"
                    variant="avatar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name (English)</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullNameAmharic">Full Name (Amharic)</Label>
                  <Input
                    id="fullNameAmharic"
                    value={profileData.fullNameAmharic}
                    onChange={(e) => setProfileData({ ...profileData, fullNameAmharic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">የትውልድ ቀን (Date of Birth)</Label>
                  <EthiopianDatePicker
                    value={profileData.dateOfBirth}
                    onChange={(isoDate) => setProfileData({ ...profileData, dateOfBirth: isoDate })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) => setProfileData({ ...profileData, gender: value as 'Male' | 'Female' })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={profileData.region}
                    onValueChange={(value) => setProfileData({ ...profileData, region: value })}
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
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    value={profileData.zone}
                    onChange={(e) => setProfileData({ ...profileData, zone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="woreda">Woreda</Label>
                  <Input
                    id="woreda"
                    value={profileData.woreda}
                    onChange={(e) => setProfileData({ ...profileData, woreda: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('File size must be less than 2MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfilePicture(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">Upload JPG, PNG, or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentUser) {
                      setProfileData({
                        fullName: currentUser.fullName || '',
                        fullNameAmharic: (currentUser as any)?.fullNameAmharic || '',
                        phone: currentUser.phone || '',
                        dateOfBirth: currentUser.dateOfBirth ? new Date(currentUser.dateOfBirth).toISOString().split('T')[0] : '',
                        gender: currentUser.gender || 'Male',
                        region: currentUser.address?.region || '',
                        zone: currentUser.address?.zone || '',
                        woreda: currentUser.address?.woreda || '',
                      });
                      setProfilePicture((currentUser as any)?.profilePicture || '');
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <SectionCard title="Notification Preferences" icon={Bell}>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">General Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive announcements via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get instant updates on your device
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Activity Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Meeting Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Notify before scheduled meetings
                      </p>
                    </div>
                    <Switch
                      checked={notifications.meetings}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, meetings: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Report Updates</p>
                      <p className="text-sm text-muted-foreground">
                        Notify when reports are commented
                      </p>
                    </div>
                    <Switch
                      checked={notifications.reports}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, reports: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Plan Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Notify when new plans are created or updated
                      </p>
                    </div>
                    <Switch
                      checked={notifications.plans}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, plans: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Finance Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Notify about financial transactions and reports
                      </p>
                    </div>
                    <Switch
                      checked={notifications.finance}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, finance: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Digest & Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly activity digest
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weekly}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weekly: checked })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Frequency</Label>
                    <Select defaultValue="immediate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quiet Hours</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">From</Label>
                        <Input type="time" defaultValue="22:00" />
                      </div>
                      <div>
                        <Label className="text-xs">To</Label>
                        <Input type="time" defaultValue="07:00" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      No notifications will be sent during these hours
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSaveNotifications}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <SectionCard title="Appearance Settings" icon={Palette}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={theme}
                  onValueChange={(value) => {
                    if (value === 'light' || value === 'dark') {
                      if (theme !== value) {
                        toggleTheme();
                      }
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color theme
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Show more content with reduced spacing
                  </p>
                </div>
                <Switch
                  checked={preferences.compactMode}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, compactMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Animations</p>
                  <p className="text-sm text-muted-foreground">
                    Enable smooth transitions and effects
                  </p>
                </div>
                <Switch
                  checked={preferences.animations}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, animations: checked })}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Language Tab */}
        <TabsContent value="language" className="space-y-6">
          <SectionCard title="Language & Region" icon={Globe}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Display Language</Label>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as Language)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="am">አማርኛ (Amharic)</SelectItem>
                    <SelectItem value="om">Afaan Oromoo</SelectItem>
                    <SelectItem value="ti">ትግርኛ (Tigrigna)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gregorian">Gregorian Calendar</SelectItem>
                    <SelectItem value="ethiopian">Ethiopian Calendar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Zone</Label>
                <Select
                  value={preferences.timeZone}
                  onValueChange={(value) => setPreferences({ ...preferences, timeZone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eat">East Africa Time (EAT)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Admin: Translations Tab */}
        {isAdmin && (
          <TabsContent value="translations" className="space-y-6">
            <SectionCard title="Custom Translation Overrides" icon={RefreshCw}>
              <div className="space-y-8">
                <p className="text-sm text-muted-foreground">
                  Override any text in the system. Changes will apply to all users instantly. 
                  Leave a field empty to use the default translation.
                </p>

                <Tabs defaultValue="en">
                  <TabsList className="w-full justify-start mb-4">
                    <TabsTrigger value="en">English Overrides</TabsTrigger>
                    <TabsTrigger value="am">Amharic Overrides</TabsTrigger>
                    <TabsTrigger value="om">Oromo Overrides</TabsTrigger>
                    <TabsTrigger value="ti">Tigrigna Overrides</TabsTrigger>
                  </TabsList>

                  {(['en', 'am', 'om', 'ti'] as Language[]).map((lang) => (
                    <TabsContent key={lang} value={lang} className="space-y-6">
                      <div className="grid gap-8">
                        {['nav', 'dashboard', 'common', 'home', 'footer', 'settings'].map((section) => (
                          <div key={section} className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-[#2E5E99] border-b pb-2">
                              {section} Section
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {Object.keys((t as any)[section] || {}).map((key) => (
                                <div key={key} className="space-y-1.5">
                                  <Label className="text-[10px] font-bold uppercase opacity-50">{key}</Label>
                                  <Input
                                    placeholder={(t as any)[section][key]}
                                    value={(translationOverrides[lang] as any)?.[section]?.[key] || ''}
                                    onChange={(e) => updateTranslation(lang, section, key, e.target.value)}
                                    className="bg-white/50"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex justify-end pt-6 border-t gap-3">
                  <Button variant="outline" onClick={() => translationService.getOverrides().then(setTranslationOverrides)}>
                    Reset to Saved
                  </Button>
                  <Button onClick={handleSaveTranslations} className="bg-[#2E5E99]">
                    Publish Changes
                  </Button>
                </div>
              </div>
            </SectionCard>
          </TabsContent>
        )}

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <SectionCard title="Security Settings" icon={Shield}>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">Current Password</Label>
                    <Input
                      id="current"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new">New Password</Label>
                    <Input
                      id="new"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirm New Password</Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changePasswordMutation.isPending || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  >
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-1">Password Recovery</h3>
                {usesSyntheticEmail ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your account signs in with a username, not a real email
                      address, so no reset link can reach you if you forget your
                      password. Add an email here to make recovery possible.
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recovery-password">Current Password</Label>
                        <Input
                          id="recovery-password"
                          type="password"
                          value={recoveryData.password}
                          onChange={(e) => setRecoveryData({ ...recoveryData, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recovery-email">Email Address</Label>
                        <Input
                          id="recovery-email"
                          type="email"
                          placeholder="you@example.com"
                          value={recoveryData.email}
                          onChange={(e) => setRecoveryData({ ...recoveryData, email: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        We send a confirmation link to that address. The change
                        only takes effect once you click it — until then, keep
                        signing in exactly as you do now. Afterwards, sign in
                        with the new email address.
                      </p>
                      <Button
                        onClick={() => addRecoveryEmailMutation.mutate(recoveryData)}
                        disabled={
                          addRecoveryEmailMutation.isPending ||
                          !recoveryData.password ||
                          !recoveryData.email
                        }
                      >
                        {addRecoveryEmailMutation.isPending ? 'Sending…' : 'Send Confirmation'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Your account is reachable at <strong>{currentUser?.email}</strong>.
                    If you forget your password, use "Forgot password?" on the
                    sign-in page and a reset link will be sent there.
                  </p>
                )}
              </div>

              {/* "Active Sessions" and "Enable 2FA" used to sit here. Both were
                  buttons with no handler and nothing behind them, which is
                  worse than not offering the feature at all. */}

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-1">Username</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  What you type to sign in. Changing it does not change your
                  password.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="abebe.k"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 3 characters: letters, digits, dot, dash or
                      underscore.
                      {usesSyntheticEmail && ' Your previous username may also keep working at sign-in, because it is built into this account’s internal address.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => changeUsernameMutation.mutate(username)}
                    disabled={
                      changeUsernameMutation.isPending ||
                      !username.trim() ||
                      username.trim() === (currentUser?.username ?? '')
                    }
                  >
                    {changeUsernameMutation.isPending ? 'Saving…' : 'Change Username'}
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-4">Account Actions</h3>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">Log Out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account and return to login page
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="ml-4"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <SectionCard title="System Information" icon={Monitor}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Application Version</span>
                    <span className="text-sm text-muted-foreground">v1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Browser</span>
                    <span className="text-sm text-muted-foreground">{navigator.userAgent.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Connection Status</span>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage Used</span>
                    <span className="text-sm text-muted-foreground">2.4 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cache Size</span>
                    <span className="text-sm text-muted-foreground">1.2 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Sync</span>
                    <span className="text-sm text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Server Status</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">Healthy</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Data Management" icon={Database}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Export Data</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Download your data in various formats
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Profile Data (JSON)
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Reports (PDF)
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Export Finance Data (Excel)
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Cache & Storage</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage local data and cache
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          localStorage.clear();
                          sessionStorage.clear();
                          toast.success('Cache cleared successfully');
                        }}
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Clear Cache
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          window.location.reload();
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Application
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <HardDrive className="h-4 w-4 mr-2" />
                        Optimize Storage
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Landing Page Editor — admin hierarchy levels plus super admins */}
          {isAdmin && (
            <SectionCard title="Landing Page Editor" icon={Layout}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Edit the public landing page content — hero text, stats, features, bank accounts, and footer — directly from here. Changes are saved to Firestore and go live immediately.
                </p>
                <Button onClick={() => navigate('/admin/landing-editor')} className="gap-2">
                  <Layout className="h-4 w-4" />
                  Open Landing Page Editor
                </Button>
              </div>
            </SectionCard>
          )}

          {/* Mobile App Control — admin hierarchy levels plus super admins */}
          {isAdmin && (
            <SectionCard title="Mobile App Control" icon={Shield}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Remotely control the mobile app — kill switch, forced updates, per-module feature flags — and audit which devices and app versions are in use.
                </p>
                <Button onClick={() => navigate('/admin/mobile-control')} className="gap-2">
                  <Shield className="h-4 w-4" />
                  Open Mobile App Control
                </Button>
              </div>
            </SectionCard>
          )}

          {/* Software Control — super admins only */}
          {isSuperAdmin && (
            <SectionCard title="Software Control" icon={Shield}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Declare roles and their access, control which navigation tabs and buttons each role sees, and review the full audit log — plus quick links to Mobile App Control and the Site Content Editor. Also available in the sidebar.
                </p>
                <Button onClick={() => navigate('/admin/software-control')} className="gap-2">
                  <Shield className="h-4 w-4" />
                  Open Software Control
                </Button>
              </div>
            </SectionCard>
          )}

          <SectionCard title="Advanced Settings" icon={Shield}>            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Developer Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Enable advanced debugging features
                    </p>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => {
                      setPreferences({ ...preferences, compactMode: checked });
                      if (checked) {
                        toast.info('Developer mode enabled');
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Beta Features</p>
                    <p className="text-sm text-muted-foreground">
                      Access experimental features (may be unstable)
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app by sharing usage data
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-destructive">Reset All Settings</p>
                    <p className="text-sm text-muted-foreground">
                      This will reset all your preferences to default values
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset all settings? This action cannot be undone.')) {
                        localStorage.removeItem('notifications');
                        localStorage.removeItem('preferences');
                        setNotifications({
                          email: true,
                          push: true,
                          meetings: true,
                          reports: false,
                          weekly: true,
                        });
                        setPreferences({
                          compactMode: false,
                          animations: true,
                          dateFormat: 'gregorian',
                          timeZone: 'eat',
                        });
                        toast.success('All settings have been reset to defaults');
                      }
                    }}
                  >
                    Reset Settings
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
