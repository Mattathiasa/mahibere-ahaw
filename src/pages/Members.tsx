import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Phone, MapPin, Download, Filter, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useModuleConfig } from '@/hooks/useModuleConfig';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/contexts/PermissionContext';
import { LearnMore } from '@/components/LearnMore';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/users';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MemberWizard } from '@/components/MemberWizard';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import { useLanguage } from '@/contexts/LanguageContext';
const Members = () => {
  const { t } = useTranslation();
  const { t: tree } = useLanguage();
  const pg = tree.pages;
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterHierarchy, setFilterHierarchy] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const permissions = useRolePermissions();
  const { showElement } = useSoftwareControl();
  const moduleCfg = useModuleConfig('members');
  const { user: currentUser } = useAuth();
  const { roleKeys, isHeadOffice, myAtbiyaId, roleLabel } = usePermissions();

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => userService.getAllUsers(),
  });

  const createMemberMutation = useMutation({
    mutationFn: (data: any) => userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(t('memberAddedSuccess'));
      setIsWizardOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || t('memberAddedError'));
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(pg.memberUpdated);
      setIsWizardOpen(false);
      setSelectedMember(null);
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Update failed');
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success(pg.memberRemoved);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Delete failed');
    }
  });

  const members = membersData?.users || [];

  // Hierarchy levels come from the role registry so a role added in Software
  // Control shows up in the filter and sort without a code change.
  const hierarchyLevels = roleKeys;

  // ── Parish-level scoping ──────────────────────────────────────────────────
  // A global-scope role sees every member; anything narrower sees only its own
  // parish. `myAtbiyaId` is empty when the account has no parish assigned, in
  // which case a non-head-office user correctly sees nothing.
  const myParishId = myAtbiyaId;
  const scopedMembers = isHeadOffice
    ? members
    : members.filter((m: any) => (m.parishId ?? m.atbiyaId ?? '') === myParishId);

  // Filter members
  const filteredMembers = scopedMembers.filter((member: any) => {
    const nameEn = member.fullNameEnglish || member.fullName || '';
    const nameAm = member.fullNameAmharic || '';
    const matchesSearch =
      nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nameAm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone && member.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.hierarchyLevel || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.address?.region && member.address.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.address?.zone && member.address.zone.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGender = filterGender === 'all' || member.gender === filterGender;
    const matchesHierarchy = filterHierarchy === 'all' || member.hierarchyLevel === filterHierarchy;

    return matchesSearch && matchesGender && matchesHierarchy;
  });

  // Sort members
  const sortedMembers = [...filteredMembers].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'name':
        return (a.fullNameEnglish || a.fullName || '').localeCompare(b.fullNameEnglish || b.fullName || '');
      case 'hierarchy':
        // Registry order is the display order set in Software Control.
        const ai = roleKeys.indexOf(a.hierarchyLevel || '');
        const bi = roleKeys.indexOf(b.hierarchyLevel || '');
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      case 'region':
        return (a.address?.region || '').localeCompare(b.address?.region || '');
      case 'zone':
        return (a.address?.zone || '').localeCompare(b.address?.zone || '');
      default:
        return 0;
    }
  });

  const handleExport = () => {
    const rows = sortedMembers;
    if (rows.length === 0) {
      toast.info(pg.nothingToExport);
      return;
    }
    const cols: { key: string; label: string }[] = [
      { key: 'fullNameEnglish', label: pg.csvFullNameEn },
      { key: 'fullNameAmharic', label: pg.csvFullNameAm },
      { key: 'gender', label: pg.csvGender },
      { key: 'phone', label: pg.csvPhone },
      { key: 'email', label: pg.csvEmail },
      { key: 'hierarchyLevel', label: pg.csvHierarchyLevel },
      { key: 'dateOfBirth', label: pg.csvDateOfBirth },
      { key: 'maritalStatus', label: pg.csvMaritalStatus },
      { key: 'workSchool', label: pg.csvWorkSchool },
    ];
    const esc = (v: unknown) => {
      const s = v === undefined || v === null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      cols.map((c) => c.label).join(','),
      ...rows.map((m: any) => cols.map((c) => esc(
        c.key === 'phone' ? (m.phone ?? m.phoneNumber)
          : c.key === 'fullNameEnglish' ? (m.fullNameEnglish ?? m.fullName)
          : m[c.key]
      )).join(',')),
    ].join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} members`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title={t('members')} description={t('membersHeaderDesc')} />
        <LoadingSkeleton type="card" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="flex flex-col gap-3">
          <PageHeader
            title={moduleCfg.headerTitle || t('members')}
            description={moduleCfg.headerDescription || t('membersHeaderDesc')}
            badge={`${sortedMembers.length} ${t('activeSouls')}`}
          />
          <LearnMore title={moduleCfg.headerTitle || t('members')} content={moduleCfg.learnMore} />
        </div>

        <div className="flex gap-4">
          {permissions.canExportData && showElement('members.export') && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Button
                variant="outline"
                onClick={handleExport}
                className="h-14 px-8 rounded-2xl border-[#2E5E99]/20 text-[#2E5E99] font-black uppercase tracking-widest hover:bg-[#2E5E99] hover:text-white transition-all duration-300 shadow-xl shadow-[#2E5E99]/5 bg-white/40 backdrop-blur-xl group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Download className="mr-3 h-5 w-5" />
                {t('export')}
              </Button>
            </motion.div>
          )}

          {permissions.canAddMembers && showElement('members.add') && (
            <Dialog open={isWizardOpen} onOpenChange={(open) => {
              setIsWizardOpen(open);
              if (!open) {
                setSelectedMember(null);
                setIsEditing(false);
              }
            }}>
              <DialogTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Button
                    className="h-14 px-8 rounded-2xl bg-[#2E5E99] hover:bg-[#204a7c] text-white font-black uppercase tracking-widest shadow-xl shadow-[#2E5E99]/20 transition-all duration-300 hover:scale-105 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Plus className="mr-3 h-6 w-6" />
                    {t('addMember')}
                  </Button>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none bg-white/90 backdrop-blur-2xl p-8">
                <DialogHeader>
                  <DialogTitle className="hidden">{isEditing ? tree.admin.editProfile : tree.admin.memberEnrollment}</DialogTitle>
                </DialogHeader>
                <MemberWizard
                  initialData={selectedMember}
                  onClose={() => {
                    setIsWizardOpen(false);
                    setSelectedMember(null);
                    setIsEditing(false);
                  }}
                  onSubmit={(data) => {
                    if (isEditing && selectedMember?.id) {
                      updateMemberMutation.mutate({ id: selectedMember.id, data });
                    } else {
                      // Stamp new members with the creating parish so parish
                      // admins only see their own; head office sees all.
                      // `parishName` used to be written as the creator's role
                      // (literally "Atbiya"), which made it useless as a label.
                      const stamped = isHeadOffice
                        ? data
                        : {
                            ...data,
                            parishId: myParishId,
                            atbiyaId: myParishId,
                            parishName: currentUser?.atbiyaName ?? '',
                          };
                      createMemberMutation.mutate(stamped);
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Member Details View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[3rem] border-none bg-white/95 backdrop-blur-2xl p-10 shadow-2xl">
          {selectedMember && (
            <div className="space-y-10">
              <div className="flex flex-col items-center text-center gap-6">
                <Avatar className="h-40 w-40 rounded-[3rem] border-8 border-white shadow-2xl">
                  {selectedMember.profilePicture && (
                    <AvatarImage src={selectedMember.profilePicture} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-[#2E5E99] to-[#0D2440] text-5xl text-white font-black">
                    {(selectedMember.fullNameEnglish || selectedMember.fullName || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h2 className="text-4xl font-black italic text-[#0D2440] tracking-tighter">
                    {selectedMember.fullNameEnglish || selectedMember.fullName}
                  </h2>
                  <p className="text-xl font-bold text-[#2E5E99] font-ethiopic">
                    {selectedMember.fullNameAmharic}
                  </p>
                  <Badge className="bg-[#2E5E99]/10 text-[#2E5E99] border-none px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest mt-4">
                    {selectedMember.hierarchyLevel} Level Soul
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-[#2E5E99]/10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t('personalContact')}</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-slate-700 font-bold italic">
                        <Phone className="h-5 w-5 text-[#2E5E99]" />
                        {selectedMember.phone || 'No phone'}
                      </div>
                      <div className="flex items-center gap-4 text-slate-700 font-bold italic line-clamp-1">
                        <Search className="h-5 w-5 text-[#2E5E99]" />
                        {selectedMember.email || selectedMember.username || 'No email'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t('jurisdiction')}</p>
                    <div className="flex items-center gap-4 text-slate-700 font-bold italic">
                      <MapPin className="h-5 w-5 text-[#2E5E99]" />
                      {selectedMember.address?.region}, {selectedMember.address?.zone}, {selectedMember.address?.woreda}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t('ministryRoles')}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.churchRoles?.map((r: string) => (
                        <Badge key={r} className="bg-[#2E5E99] text-white border-none rounded-xl text-[10px] font-black uppercase px-4 py-1.5 shadow-lg shadow-[#2E5E99]/20">
                          {r}
                        </Badge>
                      )) || 'General Member'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t('ministryTeams')}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.ministryType?.map((m: string) => (
                        <Badge key={m} className="bg-emerald-500 text-white border-none rounded-xl text-[10px] font-black uppercase px-4 py-1.5 shadow-lg shadow-emerald-500/20">
                          {m}
                        </Badge>
                      )) || 'None'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-10 border-t border-[#2E5E99]/10">
                <Button
                  onClick={() => setIsViewOpen(false)}
                  className="h-14 px-12 rounded-2xl bg-[#0D2440] text-white font-black uppercase tracking-widest hover:bg-[#1a3a5f] shadow-xl"
                >
                  {t('done')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters and Search - Premium Glass Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative p-8 rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500"
      >
        <div className="flex flex-col gap-8">
          <div className="relative group/search">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-[#2E5E99]/50 group-focus-within/search:text-[#2E5E99] transition-colors" />
            <Input
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-16 h-16 rounded-[2rem] border-none bg-white/60 dark:bg-black/20 text-xl font-medium tracking-tight italic placeholder:text-slate-400 focus:ring-2 ring-[#2E5E99] transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex-1 min-w-[240px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99]/60 mb-2 ml-4">{pg.orientation}</p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-14 rounded-2xl bg-white/60 dark:bg-black/20 border-none shadow-sm font-bold italic">
                  <SelectValue placeholder={t('sortBy')} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/40 backdrop-blur-xl">
                  <SelectItem value="name" className="rounded-xl font-bold italic">{t('sortByName')}</SelectItem>
                  <SelectItem value="hierarchy" className="rounded-xl font-bold italic">{t('sortByHierarchy')}</SelectItem>
                  <SelectItem value="region" className="rounded-xl font-bold italic">{t('sortByRegion')}</SelectItem>
                  <SelectItem value="zone" className="rounded-xl font-bold italic">{t('sortByZone')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[240px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99]/60 mb-2 ml-4">{pg.spectrum}</p>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger className="h-14 rounded-2xl bg-white/60 dark:bg-black/20 border-none shadow-sm font-bold italic">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 opacity-50" />
                    <SelectValue placeholder={pg.csvGender} />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/40 backdrop-blur-xl">
                  <SelectItem value="all" className="rounded-xl font-bold italic">{t('allGenders')}</SelectItem>
                  {(moduleCfg.options.genders ?? ['Male', 'Female']).map((g) => (
                    <SelectItem key={g} value={g} className="rounded-xl font-bold italic">
                      {g === 'Male' ? t('male') : g === 'Female' ? t('female') : g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[280px]">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2E5E99]/60 mb-2 ml-4">{pg.jurisdictionFilter}</p>
              <Select value={filterHierarchy} onValueChange={setFilterHierarchy}>
                <SelectTrigger className="h-14 rounded-2xl bg-white/60 dark:bg-black/20 border-none shadow-sm font-bold italic">
                  <SelectValue placeholder={pg.csvHierarchyLevel} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/40 backdrop-blur-xl max-h-[300px]">
                  <SelectItem value="all" className="rounded-xl font-bold italic">{t('allLevels')}</SelectItem>
                  {hierarchyLevels.map((level: any) => (
                    <SelectItem key={level} value={level} className="rounded-xl font-bold italic">
                      {roleLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Members Grid - High Fidelity Cards */}
      {sortedMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {sortedMembers.map((member: any, index: number) => {
              const displayName = member.fullNameEnglish || member.fullName || member.username || 'Unknown';
              const initials = displayName
                .split(' ')
                .map((n: string) => n[0] || '')
                .join('')
                .toUpperCase() || '?';

              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                >
                  <Card className="group relative h-full flex flex-col rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/60 dark:border-white/10 hover:shadow-[0_32px_64px_-16px_rgba(46,94,153,0.15)] transition-all duration-700 overflow-hidden border-2 hover:border-[#2E5E99]/20">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#204a7c] to-[#2E5E99] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <CardHeader className="p-8 pb-4">
                      <div className="flex flex-col items-center text-center gap-6">
                        <div className="relative">
                          <div className="absolute -inset-2 bg-gradient-to-br from-[#2E5E99] to-[#0D2440] rounded-[2rem] blur opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
                          <Avatar className="h-28 w-28 rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-2xl relative transition-transform duration-700 group-hover:scale-105 group-hover:rotate-2">
                            {member.profilePicture && <AvatarImage src={member.profilePicture} alt={member.fullName} className="object-cover" />}
                            <AvatarFallback className="bg-gradient-to-br from-[#2E5E99] to-[#0D2440] text-white text-3xl font-black">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="space-y-2">
                          <CardTitle className="text-2xl font-black text-[#0D2440] dark:text-white tracking-tight italic line-clamp-1">
                            {member.fullNameEnglish || member.fullName || member.username || 'Unknown'}
                          </CardTitle>
                          {member.fullNameAmharic && (
                            <p className="text-sm font-black font-ethiopic text-[#2E5E99] dark:text-blue-300 opacity-80 line-clamp-1">
                              {member.fullNameAmharic}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-8 pt-0 flex-1 flex flex-col justify-between space-y-8">
                      <div className="space-y-3">
                        <Badge className="w-full justify-center bg-[#2E5E99]/5 dark:bg-[#2E5E99]/10 text-[#2E5E99] dark:text-blue-300 border-none rounded-2xl py-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-inner font-ethiopic italic">
                          {member.hierarchyLevel}
                        </Badge>

                        <div className="space-y-2">
                          {member.phone && (
                            <div className="flex items-center gap-4 text-xs font-black text-[#0D2440]/60 dark:text-white/60 bg-white/40 dark:bg-black/20 p-3 rounded-2xl border border-white/20 transition-all group-hover:bg-[#2E5E99]/5">
                              <Phone className="h-4 w-4 text-[#2E5E99]/60" />
                              <span className="tracking-widest">{member.phone}</span>
                            </div>
                          )}
                          {(member.address?.region || member.address?.zone) && (
                            <div className="flex items-center gap-4 text-xs font-black text-[#0D2440]/60 dark:text-white/60 bg-white/40 dark:bg-black/20 p-3 rounded-2xl border border-white/20">
                              <MapPin className="h-4 w-4 text-[#2E5E99]/60" />
                              <span className="truncate tracking-wide">
                                {member.address.zone || member.address.region}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/20">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(member); setIsViewOpen(true); }} className="h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest text-[#2E5E99] hover:bg-[#2E5E99]/5">
                            {t('details')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(member); setIsEditing(true); setIsWizardOpen(true); }} className="h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest text-[#2E5E99] hover:bg-[#2E5E99]/5">
                            {t('edit')}
                          </Button>
                        </div>
                        <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Archive ${member.fullNameEnglish || member.fullName || 'this member'}?`)) {
                                deleteMemberMutation.mutate(member.id);
                              }
                            }}
                            className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          >
                            <Download className="h-4 w-4 rotate-180" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-40 bg-white/20 dark:bg-black/10 rounded-[4rem] border-2 border-dashed border-white/20"
        >
          <Users className="h-24 w-24 text-[#2E5E99]/20 mb-6" />
          <p className="text-2xl font-black text-[#0D2440]/20 dark:text-white/20 uppercase tracking-[0.3em]">{t('noMembersFound')}</p>
          <p className="font-bold text-muted-foreground mt-2 italic">{t('memberSearchDesc')}</p>
        </motion.div>
      )}
    </div>
  );
};

export default Members;
