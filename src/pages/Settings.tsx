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

import { useFormatters } from '@/lib/formatters';
import { errorMessage } from '@/lib/appError';
import { genderLabel } from '@/i18n/enums';
import { LANGUAGE_CYCLE, LANGUAGE_ENDONYM } from '@/i18n/languages';
const Settings = () => {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const { formatDate, formatTime } = useFormatters();
  const { isSuperAdmin, isAdminRole } = usePermissions();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useLanguage();
  const a = t.admin;
  const f = t.forms;
  const pg = t.pages;
  const pe = t.people;
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
      // Merged over the current defaults rather than replacing them: every field
      // on the stored object is optional, and a record saved before a switch
      // existed would otherwise leave that switch undefined.
      setNotifications((current) => ({ ...current, ...currentUser.notificationPreferences }));
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

  // `?.` on the wrong link: it guarded `currentUser` but not `fullName`, which is
  // optional, so a member whose record has no name crashed this page rather than
  // falling through to 'U'.
  const initials = (currentUser?.fullName ?? '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userService.updateUser(currentUser?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      authService.getCurrentUser(); // Refresh stored user
      toast.success(a.setProfileUpdated);
    },
    onError: (error) => {
      toast.error(errorMessage(t, error));
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => authService.changePassword(data),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(a.setPasswordChanged);
    },
    // These were read as `error.response?.data?.message` — an axios shape that
    // a Firebase error never has — so every real reason ("Current password is
    // incorrect.") was swallowed and replaced with a generic failure.
    onError: (error) => {
      toast.error(errorMessage(t, error));
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
      toast.success(a.setUsernameChanged);
    },
    onError: (error) => {
      toast.error(errorMessage(t, error));
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
      toast.error(errorMessage(t, error));
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
      toast.error(a.setPasswordsDoNotMatch);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error(a.setPasswordTooShort);
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
    toast.success(a.setPrefsSaved);
  };

  const handleLogout = () => {
    logout();
  };

  const handleSaveTranslations = async () => {
    try {
      await translationService.saveOverrides(translationOverrides);
      await refreshTranslations();
      toast.success(a.setTranslationsUpdated);
    } catch (error) {
      toast.error(a.setTranslationsFailed);
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
        <h1 className="text-3xl font-bold text-foreground">{a.setTitle}</h1>
        <p className="text-muted-foreground mt-1">{a.setSubtitle}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4 lg:grid-cols-7' : 'grid-cols-3 lg:grid-cols-6'}`}>
          <TabsTrigger value="profile">{a.setTabProfile}</TabsTrigger>
          <TabsTrigger value="notifications">{a.setTabNotifications}</TabsTrigger>
          <TabsTrigger value="appearance">{a.setTabAppearance}</TabsTrigger>
          <TabsTrigger value="language">{a.setTabLanguage}</TabsTrigger>
          <TabsTrigger value="security">{a.setTabSecurity}</TabsTrigger>
          <TabsTrigger value="system">{a.setTabSystem}</TabsTrigger>
          {isAdmin && <TabsTrigger value="translations" className="text-primary font-bold">{a.setTabTranslations}</TabsTrigger>}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <SectionCard title={a.setProfileInfo} icon={User}>
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
                    label={a.setUploadPicture}
                    variant="avatar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{pg.csvFullNameEn}</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullNameAmharic">{pg.csvFullNameAm}</Label>
                  <Input
                    id="fullNameAmharic"
                    value={profileData.fullNameAmharic}
                    onChange={(e) => setProfileData({ ...profileData, fullNameAmharic: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{f.phoneNumber}</Label>
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
                    allowGregorian
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">{f.gender}</Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) => setProfileData({ ...profileData, gender: value as 'Male' | 'Female' })}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">{genderLabel(t, 'Male')}</SelectItem>
                      <SelectItem value="Female">{genderLabel(t, 'Female')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">{f.region}</Label>
                  <Select
                    value={profileData.region}
                    onValueChange={(value) => setProfileData({ ...profileData, region: value })}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder={a.setSelectRegion} />
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
                  <Label htmlFor="zone">{a.setZone}</Label>
                  <Input
                    id="zone"
                    value={profileData.zone}
                    onChange={(e) => setProfileData({ ...profileData, zone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="woreda">{a.setWoreda}</Label>
                  <Input
                    id="woreda"
                    value={profileData.woreda}
                    onChange={(e) => setProfileData({ ...profileData, woreda: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profilePicture">{a.setProfilePicture}</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error(a.setFileTooLarge);
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
                  <p className="text-xs text-muted-foreground">{a.setUploadHint}</p>
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
                  {updateProfileMutation.isPending ? a.busySaving : a.saveChanges}
                </Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <SectionCard title={a.setNotificationPrefs} icon={Bell}>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">{a.setGeneralNotifications}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{a.setEmailNotifications}</p>
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
                      <p className="font-medium">{a.setPushNotifications}</p>
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
                <h3 className="font-semibold mb-4">{a.setActivityNotifications}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{a.setMeetingReminders}</p>
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
                      <p className="font-medium">{a.setReportUpdates}</p>
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
                      <p className="font-medium">{a.setPlanNotifications}</p>
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
                      <p className="font-medium">{a.setFinanceNotifications}</p>
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
                <h3 className="font-semibold mb-4">{a.setDigestSummary}</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{a.setWeeklySummary}</p>
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
                    <Label>{a.setNotificationFrequency}</Label>
                    <Select defaultValue="immediate">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">{a.setFreqImmediate}</SelectItem>
                        <SelectItem value="hourly">{a.setFreqHourly}</SelectItem>
                        <SelectItem value="daily">{a.setFreqDaily}</SelectItem>
                        <SelectItem value="weekly">{a.setFreqWeekly}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{a.setQuietHours}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{a.setFrom}</Label>
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
          <SectionCard title={a.setAppearance} icon={Palette}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{a.setTheme}</Label>
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
                    <SelectItem value="light">{a.setThemeLight}</SelectItem>
                    <SelectItem value="dark">{a.setThemeDark}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred color theme
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.setCompactMode}</p>
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
                  <p className="font-medium">{a.setAnimations}</p>
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
          <SectionCard title={a.setLanguageRegion} icon={Globe}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>{a.setDisplayLanguage}</Label>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as Language)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_CYCLE.map((code) => (
                      <SelectItem key={code} value={code}>{LANGUAGE_ENDONYM[code]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{a.setDateFormat}</Label>
                <Select
                  value={preferences.dateFormat}
                  onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gregorian">{a.setCalendarGregorian}</SelectItem>
                    <SelectItem value="ethiopian">{a.setCalendarEthiopian}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{a.setTimeZone}</Label>
                <Select
                  value={preferences.timeZone}
                  onValueChange={(value) => setPreferences({ ...preferences, timeZone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eat">{a.setTimeZoneEat}</SelectItem>
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
            <SectionCard title={a.setCustomOverrides} icon={RefreshCw}>
              <div className="space-y-8">
                <p className="text-sm text-muted-foreground">
                  Override any text in the system. Changes will apply to all users instantly. 
                  Leave a field empty to use the default translation.
                </p>

                <Tabs defaultValue="en">
                  <TabsList className="w-full justify-start mb-4">
                    <TabsTrigger value="en">{a.setOverridesEnglish}</TabsTrigger>
                    <TabsTrigger value="am">{a.setOverridesAmharic}</TabsTrigger>
                    <TabsTrigger value="om">{a.setOverridesOromo}</TabsTrigger>
                    <TabsTrigger value="ti">{a.setOverridesTigrinya}</TabsTrigger>
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
          <SectionCard title={a.setSecurity} icon={Shield}>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">{a.setChangePassword}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current">{a.setCurrentPassword}</Label>
                    <Input
                      id="current"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new">{a.setNewPassword}</Label>
                    <Input
                      id="new"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">{a.setConfirmNewPassword}</Label>
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
                    {changePasswordMutation.isPending ? a.busyUpdating : a.updatePassword}
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-1">{a.setPasswordRecovery}</h3>
                {usesSyntheticEmail ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your account signs in with a username, not a real email
                      address, so no reset link can reach you if you forget your
                      password. Add an email here to make recovery possible.
                    </p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="recovery-password">{a.setCurrentPassword}</Label>
                        <Input
                          id="recovery-password"
                          type="password"
                          value={recoveryData.password}
                          onChange={(e) => setRecoveryData({ ...recoveryData, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="recovery-email">{a.setEmailAddress}</Label>
                        <Input
                          id="recovery-email"
                          type="email"
                          placeholder={f.emailPlaceholder}
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
                        {addRecoveryEmailMutation.isPending ? a.busySending : a.sendConfirmation}
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
                <h3 className="font-semibold mb-1">{f.username}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  What you type to sign in. Changing it does not change your
                  password.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{f.username}</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={pe.usernameExample}
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
                    {changeUsernameMutation.isPending ? a.busySaving : a.changeUsername}
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-4">{a.setAccountActions}</h3>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{t.nav.logout}</p>
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
          <SectionCard title={a.setSystemInfo} icon={Monitor}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setAppVersion}</span>
                    <span className="text-sm text-muted-foreground">v1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setLastUpdated}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(new Date())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setBrowser}</span>
                    <span className="text-sm text-muted-foreground">{navigator.userAgent.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setConnectionStatus}</span>
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">{a.setOnline}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setStorageUsed}</span>
                    <span className="text-sm text-muted-foreground">2.4 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setCacheSize}</span>
                    <span className="text-sm text-muted-foreground">1.2 MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setLastSync}</span>
                    <span className="text-sm text-muted-foreground">{formatTime(new Date())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{a.setServerStatus}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600">{a.setHealthy}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={a.setDataManagement} icon={Database}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{a.setExportData}</h4>
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
                    <h4 className="font-medium mb-2">{a.setCacheStorage}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Manage local data and cache
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          // Named keys, not localStorage.clear(). Clearing
                          // everything also wiped `theme` and `app-language`, so
                          // "clear cache" silently threw the reader back to the
                          // default theme and language.
                          for (const key of ['user', 'notifications', 'preferences']) {
                            localStorage.removeItem(key);
                          }
                          sessionStorage.clear();
                          toast.success(a.setCacheCleared);
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
            <SectionCard title={a.setLandingEditor} icon={Layout}>
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
            <SectionCard title={a.setMobileControl} icon={Shield}>
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
            <SectionCard title={a.setSoftwareControl} icon={Shield}>
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

          <SectionCard title={a.setAdvanced} icon={Shield}>            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.setDeveloperMode}</p>
                    <p className="text-sm text-muted-foreground">
                      Enable advanced debugging features
                    </p>
                  </div>
                  <Switch
                    checked={preferences.compactMode}
                    onCheckedChange={(checked) => {
                      setPreferences({ ...preferences, compactMode: checked });
                      if (checked) {
                        toast.info(a.setDeveloperModeOn);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.setBetaFeatures}</p>
                    <p className="text-sm text-muted-foreground">
                      Access experimental features (may be unstable)
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{a.setAnalytics}</p>
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
                    <p className="font-medium text-destructive">{a.setResetAll}</p>
                    <p className="text-sm text-muted-foreground">
                      This will reset all your preferences to default values
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(a.setResetConfirm)) {
                        localStorage.removeItem('notifications');
                        localStorage.removeItem('preferences');
                        // Every switch, not five of seven — `plans` and `finance`
                        // were missing, so "reset to defaults" left them at
                        // whatever they happened to be.
                        setNotifications({
                          email: true,
                          push: true,
                          meetings: true,
                          reports: false,
                          plans: false,
                          finance: false,
                          weekly: true,
                        });
                        setPreferences({
                          compactMode: false,
                          animations: true,
                          dateFormat: 'gregorian',
                          timeZone: 'eat',
                        });
                        toast.success(a.setResetDone);
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
