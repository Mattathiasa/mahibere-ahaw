import { useState } from 'react';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, UserPlus, History, Search, Pencil, Trash2, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/users';
import { hierarchyService } from '@/services/hierarchy';
import { isValidPhone, normalizeEthiopianPhone } from '@/lib/phone';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { InviteUsersDialog } from '@/components/InviteUsersDialog';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

import { useFormatters } from '@/lib/formatters';
import { ETHIOPIAN_REGIONS } from '@/types';
interface UserFormData {
  username: string;
  password: string;
  fullName: string;
  fullNameAmharic: string;
  phone: string;
  region: string;
  zone: string;
  woreda: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  ministryType: string;
  hierarchyLevel: string;
  hierarchyEntityId: string;
  atbiyaId: string;
  mahderatId: string;
  profilePicture: string;
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  work: string;
  skill: string;
  hasChildren: boolean;
  numberOfChildren: number;
  volunteerMinistries: string[];
  memriyaRole: string;
}

interface EntityFormData {
  name: string;
  nameAmharic: string;
  entityType: 'Zone' | 'Atbiya' | 'EnkesekaseMaikel' | 'Mahderat';
  parentEntityId: string;
  description: string;
  location: string;
}

// Regions come from the canonical list in src/types; this file used to keep a
// second copy of the names in English.
const REGIONS = ETHIOPIAN_REGIONS;

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { formatDateTime } = useFormatters();
  const { can, roles, roleLabel, scopeOf } = usePermissions();
  const { t } = useLanguage();
  const pe = t.people;
  const f = t.forms;
  const a = t.admin;
  const assignableRoles = roles.filter((r) => r.active !== false);
  /**
   * Which roles need a parish assigned. Previously only HiyawanMahderat was
   * asked, so an Atbiya-level account never got an atbiyaId — which is why
   * parish scoping and membership approval had nothing to match on.
   */
  const needsAtbiya = (roleKey: string) => {
    const s = scopeOf(roleKey);
    return s === 'atbiya' || s === 'mahder';
  };
  /** Only a 'mahder'-scoped role sits inside a small group. */
  const needsMahderat = (roleKey: string) => scopeOf(roleKey) === 'mahder';

  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateEntityDialog, setShowCreateEntityDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'admins' | 'logs' | 'roles'>('admins');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFormData, setEntityFormData] = useState<EntityFormData>({
    name: '',
    nameAmharic: '',
    entityType: 'Zone',
    parentEntityId: '',
    description: '',
    location: '',
  });
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    password: '',
    fullName: '',
    fullNameAmharic: '',
    phone: '',
    region: '',
    zone: '',
    woreda: '',
    dateOfBirth: '',
    gender: 'Male',
    ministryType: 'General Member',
    hierarchyLevel: 'Zone',
    hierarchyEntityId: '',
    atbiyaId: '',
    mahderatId: '',
    profilePicture: '',
    maritalStatus: 'Single',
    work: '',
    skill: '',
    hasChildren: false,
    numberOfChildren: 0,
    volunteerMinistries: [],
    memriyaRole: '',
  });

  // Fetch users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getAllUsers(),
  });

  // Fetch Atbiya list (churches)
  const { data: atbiyaData } = useQuery({
    queryKey: ['atbiya'],
    queryFn: () => hierarchyService.getEntitiesByLevel('Atbiya'),
  });

  // Fetch Mahderat list (small groups within selected Atbiya)
  const { data: mahderatData } = useQuery({
    queryKey: ['mahderat', formData.atbiyaId],
    queryFn: () => hierarchyService.getEntitiesByParent(formData.atbiyaId),
    enabled: !!formData.atbiyaId && needsMahderat(formData.hierarchyLevel),
  });

  /**
   * The parish placement fields to write, for both create and update.
   *
   * Every key is always present, and empty when the role does not need it.
   * These used to be added only when non-blank and only for the hardcoded
   * 'HiyawanMahderat' role, so an Atbiya-level account could never be given a
   * parish at all, and a reassignment could set a new parish but never clear
   * the old one. `atbiyaName` is denormalized alongside the id because the
   * requests queue and member lists read the name without joining.
   */
  const atbiyaFields = (f: UserFormData) => {
    const atbiyaId = needsAtbiya(f.hierarchyLevel) ? f.atbiyaId.trim() : '';
    const match = (atbiyaData as { id: string; name?: string }[] | undefined)
      ?.find((a) => a.id === atbiyaId);
    return {
      atbiyaId,
      atbiyaName: match?.name ?? '',
      mahderatId: needsMahderat(f.hierarchyLevel) ? f.mahderatId.trim() : '',
    };
  };

  // Fetch parent entities for entity creation
  const { data: parentEntitiesData } = useQuery({
    queryKey: ['parentEntities', entityFormData.entityType],
    queryFn: () => {
      if (entityFormData.entityType === 'Zone') {
        return hierarchyService.getEntitiesByLevel('Memriya');
      } else if (entityFormData.entityType === 'Atbiya') {
        return hierarchyService.getEntitiesByLevel('Zone');
      } else if (entityFormData.entityType === 'EnkesekaseMaikel' || entityFormData.entityType === 'Mahderat') {
        return hierarchyService.getEntitiesByLevel('Atbiya');
      }
      return [];
    },
    enabled: !!entityFormData.entityType,
  });

  // Fetch available Zones for user creation
  const { data: zonesData } = useQuery({
    queryKey: ['zones'],
    queryFn: () => hierarchyService.getEntitiesByLevel('Zone'),
  });

  // Create entity mutation
  const createEntityMutation = useMutation({
    mutationFn: (entityData: any) => hierarchyService.createEntity(entityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['atbiya'] });
      queryClient.invalidateQueries({ queryKey: ['mahderat'] });
      queryClient.invalidateQueries({ queryKey: ['parentEntities'] });
      toast.success(a.entityCreated);
      setShowCreateEntityDialog(false);
      setEntityFormData({
        name: '',
        nameAmharic: '',
        entityType: 'Zone',
        parentEntityId: '',
        description: '',
        location: '',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || a.createEntityFailed;
      toast.error(message);
    },
  });

  // Fetch audit logs
  const { data: auditData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => userService.getAuditLogs(10),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a.userCreated);
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || a.createUserFailed;
      toast.error(message);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a.userUpdated);
      setShowEditDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || a.updateUserFailed;
      toast.error(message);
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(a.userDeleted);
      setShowDeleteDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete user';
      toast.error(message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Phone is the one contact detail the church relies on, so it is checked
    // rather than merely marked with an asterisk.
    if (!isValidPhone(formData.phone)) {
      toast.error(a.badPhone);
      return;
    }

    // Optional: an account's data scope comes from its atbiyaId, not from this
    // field, and requiring it meant no user at all could be created until
    // somebody had created a Zone entity first.
    const hierarchyEntityId = formData.hierarchyEntityId || currentUser?.hierarchyEntityId || '';

    const userData: any = {
      ...formData,
      phone: normalizeEthiopianPhone(formData.phone),
      hierarchyEntityId,
      address: {
        region: formData.region,
        zone: formData.zone,
        woreda: formData.woreda,
      },
    };

    Object.assign(userData, atbiyaFields(formData));

    createUserMutation.mutate(userData);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData({
      username: user.username || '',
      password: '',
      fullName: user.fullName,
      fullNameAmharic: user.fullNameAmharic || '',
      phone: user.phone,
      region: user.address?.region || '',
      zone: user.address?.zone || '',
      woreda: user.address?.woreda || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.gender,
      ministryType: user.ministryType,
      hierarchyLevel: user.hierarchyLevel,
      hierarchyEntityId: user.hierarchyEntityId,
      atbiyaId: user.atbiyaId || '',
      mahderatId: user.mahderatId || '',
      profilePicture: user.profilePicture || '',
      maritalStatus: user.maritalStatus || 'Single',
      work: user.work || user.occupation || '',
      skill: user.skill || '',
      hasChildren: user.hasChildren || false,
      numberOfChildren: user.numberOfChildren || 0,
      volunteerMinistries: user.volunteerMinistries || [],
      memriyaRole: user.memriyaRole || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (!isValidPhone(formData.phone)) {
      toast.error(a.badPhone);
      return;
    }

    const updateData: any = {
      fullName: formData.fullName,
      fullNameAmharic: formData.fullNameAmharic,
      phone: normalizeEthiopianPhone(formData.phone),
      address: {
        region: formData.region,
        zone: formData.zone,
        woreda: formData.woreda,
      },
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      ministryType: formData.ministryType,
      hierarchyLevel: formData.hierarchyLevel,
      hierarchyEntityId: formData.hierarchyEntityId || currentUser?.hierarchyEntityId,
      maritalStatus: formData.maritalStatus,
      work: formData.work,
      skill: formData.skill,
      hasChildren: formData.hasChildren,
      numberOfChildren: formData.numberOfChildren,
      volunteerMinistries: formData.volunteerMinistries,
      memriyaRole: formData.memriyaRole,
    };

    // Include profile picture if changed
    if (formData.profilePicture && formData.profilePicture !== selectedUser.profilePicture) {
      updateData.profilePicture = formData.profilePicture;
    }

    Object.assign(updateData, atbiyaFields(formData));

    updateUserMutation.mutate({ id: selectedUser.id, data: updateData });
  };

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      fullNameAmharic: '',
      phone: '',
      region: '',
      zone: '',
      woreda: '',
      dateOfBirth: '',
      gender: 'Male',
      ministryType: 'General Member',
      hierarchyLevel: 'Zone',
      hierarchyEntityId: '',
      atbiyaId: '',
      mahderatId: '',
      profilePicture: '',
      maritalStatus: 'Single',
      work: '',
      skill: '',
      hasChildren: false,
      numberOfChildren: 0,
      volunteerMinistries: [],
      memriyaRole: '',
    });
  };

  const users = usersData?.users || [];
  const filteredUsers = users.filter((user: any) =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const auditLogs = auditData?.logs || [];

  // Was hardcoded to `hierarchyLevel === 'Memriya'`, which locked out Sinodos
  // and super admins. Now driven by the permission matrix.
  const canManageUsers = can('canViewUserManagement');

  if (!canManageUsers) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{a.usersTitle}</h1>
          <p className="text-muted-foreground mt-1">{a.manageUsersRoles}</p>
        </div>
        <SectionCard title={a.accessDenied} icon={Users}>
          <p className="text-muted-foreground">
            Your role does not include the "View User Management" permission. A super
            admin can grant it in Software Control → Roles.
          </p>
        </SectionCard>
      </div>
    );
  }

  if (isLoadingUsers) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{a.usersTitle}</h1>
          <p className="text-muted-foreground mt-1">{pe.umSubtitle}</p>
        </div>
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{a.usersTitle}</h1>
          <p className="text-muted-foreground mt-1">{a.usersDesc}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateEntityDialog} onOpenChange={setShowCreateEntityDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" />
                {a.createEntity}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{a.createEntityTitle}</DialogTitle>
                <DialogDescription>
                  {a.createEntityDesc}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const entityData: any = {
                  name: entityFormData.name,
                  nameAmharic: entityFormData.nameAmharic,
                  level: entityFormData.entityType,
                  location: entityFormData.location,
                  description: entityFormData.description,
                };

                // Only include parentId if it's not a Zone (Zone has no parent)
                if (entityFormData.entityType !== 'Zone') {
                  entityData.parentId = entityFormData.parentEntityId || null;
                } else {
                  entityData.parentId = null;
                }

                createEntityMutation.mutate(entityData);
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entity-name">{a.entityName} *</Label>
                    <Input
                      id="entity-name"
                      value={entityFormData.name}
                      onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })}
                      placeholder={pe.dioceseExample}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-nameAmharic">{a.entityNameAm} *</Label>
                    <Input
                      id="entity-nameAmharic"
                      value={entityFormData.nameAmharic}
                      onChange={(e) => setEntityFormData({ ...entityFormData, nameAmharic: e.target.value })}
                      placeholder="ምስራቅ ሸዋ ዞን"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">{a.entityType} *</Label>
                    <Select
                      value={entityFormData.entityType}
                      onValueChange={(value: any) => setEntityFormData({
                        ...entityFormData,
                        entityType: value,
                        // Clear parent when Zone is selected since it doesn't need one
                        parentEntityId: value === 'Zone' ? '' : entityFormData.parentEntityId
                      })}
                    >
                      <SelectTrigger id="entity-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Zone">{a.scopeDiocese}</SelectItem>
                        <SelectItem value="Atbiya">{a.scopeCongregation}</SelectItem>
                        <SelectItem value="EnkesekaseMaikel">Enkesekase Maikel / እንቀሰቃሴ ማዕከል</SelectItem>
                        <SelectItem value="Mahderat">Mahderat (Small Group) / ማህደራት (ትንሽ ቡድን)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {entityFormData.entityType !== 'Zone' && (
                    <div className="space-y-2">
                      <Label htmlFor="entity-parent">{a.parentEntity} *</Label>
                      <Select
                        value={entityFormData.parentEntityId}
                        onValueChange={(value) => setEntityFormData({ ...entityFormData, parentEntityId: value })}
                      >
                        <SelectTrigger id="entity-parent">
                          <SelectValue placeholder={a.selectParentEntity} />
                        </SelectTrigger>
                        <SelectContent>
                          {parentEntitiesData?.map((entity: any) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.name} / {entity.nameAmharic}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {entityFormData.entityType === 'Atbiya' && a.belongsToDiocese}
                        {entityFormData.entityType === 'EnkesekaseMaikel' && 'Enkesekase Maikel belongs to Atbiya'}
                        {entityFormData.entityType === 'Mahderat' && a.belongsToCongregation}
                      </p>
                    </div>
                  )}
                  {entityFormData.entityType === 'Zone' && (
                    <div className="space-y-2">
                      <Label>{a.parentEntity}</Label>
                      <div className="p-3 border rounded-md bg-muted/50">
                        <p className="text-sm text-muted-foreground">{a.dioceseUnderMemriya}</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="entity-location">{a.entityLocation}</Label>
                    <Input
                      id="entity-location"
                      value={entityFormData.location}
                      onChange={(e) => setEntityFormData({ ...entityFormData, location: e.target.value })}
                      placeholder={pe.addressExampleShort}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="entity-description">{a.entityDescription}</Label>
                    <Input
                      id="entity-description"
                      value={entityFormData.description}
                      onChange={(e) => setEntityFormData({ ...entityFormData, description: e.target.value })}
                      placeholder={a.entityDescPlaceholder}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateEntityDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEntityMutation.isPending}>
                    {createEntityMutation.isPending ? a.creating : a.createEntity}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Create New User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{a.createNewUser}</DialogTitle>
                <DialogDescription>
                  {a.addUserDesc}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{a.username} *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder={pe.usernameExampleShort}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{a.password} *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={a.minChars}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{a.fullNameEnglish} *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder={pe.personNameExample}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullNameAmharic">{a.fullNameAmharic} *</Label>
                    <Input
                      id="fullNameAmharic"
                      value={formData.fullNameAmharic}
                      onChange={(e) => setFormData({ ...formData, fullNameAmharic: e.target.value })}
                      placeholder="ዮሐንስ ተስፋዬ"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profilePicture">{a.profilePicture}</Label>
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, profilePicture: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">{a.uploadHint}</p>
                    {formData.profilePicture && (
                      <div className="mt-2">
                        <img src={formData.profilePicture} alt={pe.umPreview} className="h-20 w-20 rounded-full object-cover border-2 border-primary" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{a.phoneNumber} *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251911234567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">የትውልድ ቀን (Date of Birth) *</Label>
                    <EthiopianDatePicker
                      value={formData.dateOfBirth}
                      onChange={(isoDate) => setFormData({ ...formData, dateOfBirth: isoDate })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">{a.gender} *</Label>
                    <Select value={formData.gender} onValueChange={(value: 'Male' | 'Female') => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger id="gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">{a.male}</SelectItem>
                        <SelectItem value="Female">{a.female}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maritalStatus">{a.maritalStatus}</Label>
                    <Select value={formData.maritalStatus} onValueChange={(value: any) => setFormData({ ...formData, maritalStatus: value })}>
                      <SelectTrigger id="maritalStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">{a.single}</SelectItem>
                        <SelectItem value="Married">{a.married}</SelectItem>
                        <SelectItem value="Widowed">{a.widowed}</SelectItem>
                        <SelectItem value="Divorced">{a.divorced}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work">{a.work}</Label>
                    <Input
                      id="work"
                      value={formData.work}
                      onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                      placeholder={pe.professionPlaceholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skill">{a.specialSkill}</Label>
                    <Input
                      id="skill"
                      value={formData.skill}
                      onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                      placeholder={pe.interestsPlaceholder}
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="hasChildren"
                      checked={formData.hasChildren}
                      onChange={(e) => setFormData({ ...formData, hasChildren: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="hasChildren">{a.hasChildren}</Label>
                  </div>
                  {formData.hasChildren && (
                    <div className="space-y-2">
                      <Label htmlFor="numberOfChildren">{a.childrenCount}</Label>
                      <Input
                        id="numberOfChildren"
                        type="number"
                        min="0"
                        value={formData.numberOfChildren}
                        onChange={(e) => setFormData({ ...formData, numberOfChildren: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-2">
                    <Label>{a.volunteerMinistries}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['Ebet Metreg', 'Natanim Agelgelot', 'Choir', 'Ushering', 'Sunday School', 'Charity', 'Evangelism'].map((ministry) => (
                        <div key={ministry} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`ministry-${ministry}`}
                            checked={formData.volunteerMinistries.includes(ministry)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, volunteerMinistries: [...formData.volunteerMinistries, ministry] });
                              } else {
                                setFormData({ ...formData, volunteerMinistries: formData.volunteerMinistries.filter(m => m !== ministry) });
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor={`ministry-${ministry}`} className="text-sm cursor-pointer select-none">
                            {ministry}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hierarchyLevel">{a.hierarchyLevel} *</Label>
                    <Select
                      value={formData.hierarchyLevel}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          hierarchyLevel: value,
                          // Keep the placement only while the new role still
                          // uses it, so switching to a head-office role clears
                          // the parish rather than leaving a stale one behind.
                          atbiyaId: needsAtbiya(value) ? formData.atbiyaId : '',
                          mahderatId: needsMahderat(value) ? formData.mahderatId : '',
                        });
                      }}
                    >
                      <SelectTrigger id="hierarchyLevel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map((r) => (
                          <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.hierarchyLevel === 'Memriya' && (
                    <div className="space-y-2">
                      <Label htmlFor="memriyaRole">{a.memriyaRole}</Label>
                      <Select
                        value={formData.memriyaRole}
                        onValueChange={(value) => setFormData({ ...formData, memriyaRole: value })}
                      >
                        <SelectTrigger id="memriyaRole">
                          <SelectValue placeholder={a.selectRole} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrator">{pe.roleAdministrator}</SelectItem>
                          <SelectItem value="Secretary">{pe.roleSecretary}</SelectItem>
                          <SelectItem value="FinanceHead">{pe.roleFinanceHead}</SelectItem>
                          <SelectItem value="DepartmentHead">{pe.roleDepartmentHead}</SelectItem>
                          <SelectItem value="Staff">{pe.roleStaff}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="hierarchyEntityId">{a.assignToDiocese}</Label>
                    <Select
                      value={formData.hierarchyEntityId || 'none'}
                      onValueChange={(value) =>
                        setFormData({ ...formData, hierarchyEntityId: value === 'none' ? '' : value })}
                    >
                      <SelectTrigger id="hierarchyEntityId">
                        <SelectValue placeholder={a.notAssigned} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Radix rejects an empty-string item value, so absence
                            is carried by this sentinel rather than by ''. */}
                        <SelectItem value="none">{a.notAssigned}</SelectItem>
                        {zonesData?.map((zone: any) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name} / {zone.nameAmharic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {a.assignToDioceseHint}
                    </p>
                  </div>
                  {needsAtbiya(formData.hierarchyLevel) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="atbiyaId">{a.scopeCongregation} *</Label>
                        <Select
                          value={formData.atbiyaId}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              atbiyaId: value,
                              mahderatId: '', // Reset Mahderat when Atbiya changes
                            });
                          }}
                        >
                          <SelectTrigger id="atbiyaId">
                            <SelectValue placeholder={a.selectCongregation} />
                          </SelectTrigger>
                          <SelectContent>
                            {atbiyaData?.map((atbiya: any) => (
                              <SelectItem key={atbiya.id} value={atbiya.id}>
                                {atbiya.name} / {atbiya.nameAmharic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  {needsMahderat(formData.hierarchyLevel) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="mahderatId">{a.tabMahderat} *</Label>
                        <Select
                          value={formData.mahderatId}
                          onValueChange={(value) => setFormData({ ...formData, mahderatId: value })}
                          disabled={!formData.atbiyaId}
                        >
                          <SelectTrigger id="mahderatId">
                            <SelectValue placeholder={formData.atbiyaId ? a.selectMahderat : a.selectCongregationFirst} />
                          </SelectTrigger>
                          <SelectContent>
                            {mahderatData?.map((mahderat: any) => (
                              <SelectItem key={mahderat.id} value={mahderat.id}>
                                {mahderat.name} / {mahderat.nameAmharic}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {a.mahderatHint}
                        </p>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="ministryType">{a.ministryType} *</Label>
                    <Select value={formData.ministryType} onValueChange={(value) => setFormData({ ...formData, ministryType: value })}>
                      <SelectTrigger id="ministryType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Priest">{pe.rolePriest}</SelectItem>
                        <SelectItem value="Deacon">{pe.roleDeacon}</SelectItem>
                        <SelectItem value="Sunday School Teacher">{pe.roleSundaySchoolTeacher}</SelectItem>
                        <SelectItem value="Choir Member">{pe.roleChoirMember}</SelectItem>
                        <SelectItem value="Youth Leader">{pe.roleYouthLeader}</SelectItem>
                        <SelectItem value="Women Ministry">{pe.roleWomenMinistry}</SelectItem>
                        <SelectItem value="Men Ministry">{pe.roleMenMinistry}</SelectItem>
                        <SelectItem value="Elder">{pe.roleElder}</SelectItem>
                        <SelectItem value="General Member">{pe.roleGeneralMember}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">{a.region}</Label>
                    <Select
                      value={formData.region}
                      onValueChange={(value) => setFormData({ ...formData, region: value })}
                    >
                      <SelectTrigger id="region">
                        <SelectValue placeholder={a.selectRegion} />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zone">{a.zone}</Label>
                    <Input
                      id="zone"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      placeholder={pe.woredaExample}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="woreda">{a.woreda}</Label>
                    <Input
                      id="woreda"
                      value={formData.woreda}
                      onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                      placeholder={pe.subCityExample}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? a.creating : a.createUser}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => setShowInviteDialog(true)}
            className="bg-[#2E5E99] hover:bg-[#204a7c] text-white font-semibold gap-2 rounded-xl"
          >
            <UserPlus className="h-4 w-4" /> Invite users
          </Button>
        </div>
      </div>

      {/* Top Stat Card */}
      <div className="w-full sm:w-80">
        <div className="bg-[#2E5E99]/10 border border-[#2E5E99]/20 p-6 rounded-2xl flex justify-between items-start shadow-sm backdrop-blur-xl">
          <div>
            <span className="text-4xl font-bold text-[#0D2440] dark:text-white">
              {users.length || 1}
            </span>
            <p className="text-xs uppercase font-bold tracking-wider text-[#2E5E99] dark:text-[#7BA4D0] mt-4">
              {a.totalUsers}
            </p>
          </div>
          <div className="p-3 bg-[#2E5E99]/20 rounded-full">
            <Users className="h-6 w-6 text-[#2E5E99]" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-[#2E5E99] text-white rounded-2xl p-2 flex items-center gap-2 shadow-md">
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
            activeTab === 'admins'
              ? 'bg-white text-[#2E5E99] shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          {a.systemAdmins}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-white text-[#2E5E99] shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold transition-all ${
            activeTab === 'roles'
              ? 'bg-white text-[#2E5E99] shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
        >
          Role management
        </button>
      </div>

      {activeTab === 'admins' && (
        <SectionCard title={`All Users (${filteredUsers.length})`} icon={Users} description={a.viewManageUsers}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={a.searchUsersByName}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{pe.umColName}</TableHead>
                    <TableHead>{pe.umColRole}</TableHead>
                    <TableHead>{a.lastLoggedOn}</TableHead>
                    <TableHead>{f.phoneNumber}</TableHead>
                    <TableHead>{f.email}</TableHead>
                    <TableHead>{pe.umColActive}</TableHead>
                    <TableHead className="text-right">{a.operations}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        {a.noUsersFound}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: any) => {
                      const initials = user.fullName
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase();

                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-primary">
                                {user.profilePicture && <AvatarImage src={user.profilePicture} alt={user.fullName} />}
                                <AvatarFallback className="bg-[#40A8B1] text-white text-sm font-bold">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
                                {user.fullNameAmharic && (
                                  <p className="text-xs text-muted-foreground">{user.fullNameAmharic}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-[#40A8B1] text-white font-bold text-[10px] px-2.5 py-0.5 uppercase">
                              {user.role || user.hierarchyLevel || 'OWNER'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-medium">
                            2 minutes ago
                          </TableCell>
                          <TableCell className="text-xs">{user.phone || '—'}</TableCell>
                          <TableCell className="text-xs">{user.email || `${user.username || 'user'}@mahibereahaw.org`}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold text-[10px]">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(user)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </SectionCard>
      )}

      {activeTab === 'logs' && (
        <SectionCard title={a.auditLog} icon={History} description={a.auditLogDesc}>
          {isLoadingAudit ? (
            <div className="text-center py-4 text-muted-foreground">{a.loadingAuditLogs}</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">{a.noAuditLogs}</div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {log.action}: <span className="text-primary">{log.targetUserName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {log.performedByName} ({log.performedByRole}) • {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'roles' && (
        <SectionCard title={a.roleManagement} icon={Users} description={a.roleManagementDesc}>
          <div className="p-6 text-slate-600 dark:text-slate-400 text-sm border-2 border-dashed rounded-xl text-center">
            {a.roleManagementActive}
          </div>
        </SectionCard>
      )}

      {/* Invite Users Dialog */}
      <InviteUsersDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{a.editUser}</DialogTitle>
            <DialogDescription>
              {a.editUserDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">{pe.umFullNameEnRequired}</Label>
                <Input
                  id="edit-fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fullNameAmharic">Full Name (Amharic) * / ሙሉ ስም (አማርኛ) *</Label>
                <Input
                  id="edit-fullNameAmharic"
                  value={formData.fullNameAmharic}
                  onChange={(e) => setFormData({ ...formData, fullNameAmharic: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-profilePicture">{pe.umProfilePictureOptional}</Label>
                <Input
                  id="edit-profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({ ...formData, profilePicture: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">{a.uploadHint}</p>
                {formData.profilePicture && (
                  <div className="mt-2">
                    <img src={formData.profilePicture} alt={pe.umPreview} className="h-20 w-20 rounded-full object-cover border-2 border-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{a.phoneNumber} *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dateOfBirth">የትውልድ ቀን (Date of Birth) *</Label>
                <EthiopianDatePicker
                  value={formData.dateOfBirth}
                  onChange={(isoDate) => setFormData({ ...formData, dateOfBirth: isoDate })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender">{a.gender} *</Label>
                <Select value={formData.gender} onValueChange={(value: 'Male' | 'Female') => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger id="edit-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{a.male}</SelectItem>
                    <SelectItem value="Female">{a.female}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hierarchyLevel">{a.hierarchyLevel} *</Label>
                <Select
                  value={formData.hierarchyLevel}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      hierarchyLevel: value,
                      atbiyaId: needsAtbiya(value) ? formData.atbiyaId : '',
                      mahderatId: needsMahderat(value) ? formData.mahderatId : '',
                    });
                  }}
                >
                  <SelectTrigger id="edit-hierarchyLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.hierarchyLevel === 'Memriya' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-memriyaRole">{a.memriyaRole}</Label>
                  <Select
                    value={formData.memriyaRole}
                    onValueChange={(value) => setFormData({ ...formData, memriyaRole: value })}
                  >
                    <SelectTrigger id="edit-memriyaRole">
                      <SelectValue placeholder={a.selectRole} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrator">{pe.roleAdministrator}</SelectItem>
                      <SelectItem value="Secretary">{pe.roleSecretary}</SelectItem>
                      <SelectItem value="FinanceHead">{pe.roleFinanceHead}</SelectItem>
                      <SelectItem value="DepartmentHead">{pe.roleDepartmentHead}</SelectItem>
                      <SelectItem value="Staff">{pe.roleStaff}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-ministryType">{a.ministryType} *</Label>
                <Select value={formData.ministryType} onValueChange={(value) => setFormData({ ...formData, ministryType: value })}>
                  <SelectTrigger id="edit-ministryType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Priest">{pe.rolePriest}</SelectItem>
                    <SelectItem value="Deacon">{pe.roleDeacon}</SelectItem>
                    <SelectItem value="Sunday School Teacher">{pe.roleSundaySchoolTeacher}</SelectItem>
                    <SelectItem value="Choir Member">{pe.roleChoirMember}</SelectItem>
                    <SelectItem value="Youth Leader">{pe.roleYouthLeader}</SelectItem>
                    <SelectItem value="Women Ministry">{pe.roleWomenMinistry}</SelectItem>
                    <SelectItem value="Men Ministry">{pe.roleMenMinistry}</SelectItem>
                    <SelectItem value="Elder">{pe.roleElder}</SelectItem>
                    <SelectItem value="General Member">{pe.roleGeneralMember}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {needsAtbiya(formData.hierarchyLevel) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-atbiyaId">{a.scopeCongregation} *</Label>
                    <Select
                      value={formData.atbiyaId}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          atbiyaId: value,
                          mahderatId: '',
                        });
                      }}
                    >
                      <SelectTrigger id="edit-atbiyaId">
                        <SelectValue placeholder={a.selectCongregation} />
                      </SelectTrigger>
                      <SelectContent>
                        {atbiyaData?.map((atbiya: any) => (
                          <SelectItem key={atbiya.id} value={atbiya.id}>
                            {atbiya.name} / {atbiya.nameAmharic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {needsMahderat(formData.hierarchyLevel) && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-mahderatId">{a.tabMahderat} *</Label>
                    <Select
                      value={formData.mahderatId}
                      onValueChange={(value) => setFormData({ ...formData, mahderatId: value })}
                      disabled={!formData.atbiyaId}
                    >
                      <SelectTrigger id="edit-mahderatId">
                        <SelectValue placeholder={formData.atbiyaId ? a.selectMahderat : a.selectCongregationFirst} />
                      </SelectTrigger>
                      <SelectContent>
                        {mahderatData?.map((mahderat: any) => (
                          <SelectItem key={mahderat.id} value={mahderat.id}>
                            {mahderat.name} / {mahderat.nameAmharic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-region">{a.region}</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger id="edit-region">
                    <SelectValue placeholder={a.selectRegion} />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-zone">{a.zone}</Label>
                <Input
                  id="edit-zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-woreda">{a.woreda}</Label>
                <Input
                  id="edit-woreda"
                  value={formData.woreda}
                  onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? a.updating : a.updateUser}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{a.suspendAccount}</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser?.fullName}</strong> will immediately lose access to
              everything in the system and will not be able to sign in. Their record is
              kept, so you can restore access later by setting their status back to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteUserMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUserMutation.isPending ? a.busySuspending : a.suspend}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
