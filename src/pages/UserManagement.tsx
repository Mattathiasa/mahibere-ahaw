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
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/users';
import { hierarchyService } from '@/services/hierarchy';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { InviteUsersDialog } from '@/components/InviteUsersDialog';
import { EthiopianDatePicker } from '@/components/ui/EthiopianDatePicker';

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

const ETHIOPIAN_REGIONS = [
  "Addis Ababa",
  "Afar",
  "Amhara",
  "Benishangul-Gumuz",
  "Dire Dawa",
  "Gambela",
  "Harari",
  "Oromia",
  "Sidama",
  "Somali",
  "Tigray"
];

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { can, roles, roleLabel } = usePermissions();
  const assignableRoles = roles.filter((r) => r.active !== false);
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
    enabled: !!formData.atbiyaId && formData.hierarchyLevel === 'HiyawanMahderat',
  });

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
      toast.success('Entity created successfully!');
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
      const message = error.response?.data?.message || 'Failed to create entity';
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
      toast.success('User created successfully!');
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('User updated successfully!');
      setShowEditDialog(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user';
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
      toast.success('User deleted successfully!');
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

    // Validate hierarchyEntityId
    const hierarchyEntityId = formData.hierarchyEntityId || currentUser?.hierarchyEntityId;

    if (!hierarchyEntityId || hierarchyEntityId.trim() === '') {
      toast.error('Hierarchy entity is required. Please create a Zone first or ensure you are logged in properly.');
      return;
    }

    // Use current user's hierarchyEntityId if not provided
    const userData: any = {
      ...formData,
      hierarchyEntityId,
      address: {
        region: formData.region,
        zone: formData.zone,
        woreda: formData.woreda,
      },
    };

    // Include Atbiya and Mahderat for HiyawanMahderat users (only if they have valid values)
    if (formData.hierarchyLevel === 'HiyawanMahderat') {
      if (formData.atbiyaId && formData.atbiyaId.trim() !== '') {
        userData.atbiyaId = formData.atbiyaId;
      }
      if (formData.mahderatId && formData.mahderatId.trim() !== '') {
        userData.mahderatId = formData.mahderatId;
      }
    }

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

    const updateData: any = {
      fullName: formData.fullName,
      fullNameAmharic: formData.fullNameAmharic,
      phone: formData.phone,
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

    // Include Atbiya and Mahderat for HiyawanMahderat users (only if they have values)
    if (formData.hierarchyLevel === 'HiyawanMahderat') {
      if (formData.atbiyaId && formData.atbiyaId.trim() !== '') {
        updateData.atbiyaId = formData.atbiyaId;
      }
      if (formData.mahderatId && formData.mahderatId.trim() !== '') {
        updateData.mahderatId = formData.mahderatId;
      }
    }

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
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage system users and roles</p>
        </div>
        <SectionCard title="Access Denied" icon={Users}>
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
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage system users</p>
        </div>
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage system users and organizational entities</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateEntityDialog} onOpenChange={setShowCreateEntityDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" />
                Create Entity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Organizational Entity</DialogTitle>
                <DialogDescription>
                  Create a new Zone, Atbiya (Church), Enkesekase Maikel, or Mahderat (Small Group)
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
                    <Label htmlFor="entity-name">Name (English) *</Label>
                    <Input
                      id="entity-name"
                      value={entityFormData.name}
                      onChange={(e) => setEntityFormData({ ...entityFormData, name: e.target.value })}
                      placeholder="East Shewa Zone"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-nameAmharic">Name (Amharic) * / ስም (አማርኛ) *</Label>
                    <Input
                      id="entity-nameAmharic"
                      value={entityFormData.nameAmharic}
                      onChange={(e) => setEntityFormData({ ...entityFormData, nameAmharic: e.target.value })}
                      placeholder="ምስራቅ ሸዋ ዞን"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entity-type">Entity Type *</Label>
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
                        <SelectItem value="Zone">Zone / ዞን</SelectItem>
                        <SelectItem value="Atbiya">Atbiya (Church) / አትብያ (ቤተክርስቲያን)</SelectItem>
                        <SelectItem value="EnkesekaseMaikel">Enkesekase Maikel / እንቀሰቃሴ ማዕከል</SelectItem>
                        <SelectItem value="Mahderat">Mahderat (Small Group) / ማህደራት (ትንሽ ቡድን)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {entityFormData.entityType !== 'Zone' && (
                    <div className="space-y-2">
                      <Label htmlFor="entity-parent">Parent Entity *</Label>
                      <Select
                        value={entityFormData.parentEntityId}
                        onValueChange={(value) => setEntityFormData({ ...entityFormData, parentEntityId: value })}
                      >
                        <SelectTrigger id="entity-parent">
                          <SelectValue placeholder="Select parent entity" />
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
                        {entityFormData.entityType === 'Atbiya' && 'Atbiya belongs to a Zone'}
                        {entityFormData.entityType === 'EnkesekaseMaikel' && 'Enkesekase Maikel belongs to Atbiya'}
                        {entityFormData.entityType === 'Mahderat' && 'Mahderat belongs to Atbiya'}
                      </p>
                    </div>
                  )}
                  {entityFormData.entityType === 'Zone' && (
                    <div className="space-y-2">
                      <Label>Parent Entity</Label>
                      <div className="p-3 border rounded-md bg-muted/50">
                        <p className="text-sm text-muted-foreground">Zone belongs directly to Memriya (no selection needed)</p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="entity-location">Location</Label>
                    <Input
                      id="entity-location"
                      value={entityFormData.location}
                      onChange={(e) => setEntityFormData({ ...entityFormData, location: e.target.value })}
                      placeholder="Addis Ababa, Bole"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="entity-description">Description</Label>
                    <Input
                      id="entity-description"
                      value={entityFormData.description}
                      onChange={(e) => setEntityFormData({ ...entityFormData, description: e.target.value })}
                      placeholder="Brief description of the entity"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateEntityDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEntityMutation.isPending}>
                    {createEntityMutation.isPending ? 'Creating...' : 'Create Entity'}
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
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. All fields are required.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="john.doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name (English) *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullNameAmharic">Full Name (Amharic) * / ሙሉ ስም (አማርኛ) *</Label>
                    <Input
                      id="fullNameAmharic"
                      value={formData.fullNameAmharic}
                      onChange={(e) => setFormData({ ...formData, fullNameAmharic: e.target.value })}
                      placeholder="ዮሐንስ ተስፋዬ"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
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
                    <p className="text-xs text-muted-foreground">Upload JPG, PNG, or GIF. Max size 2MB.</p>
                    {formData.profilePicture && (
                      <div className="mt-2">
                        <img src={formData.profilePicture} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-primary" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
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
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value: 'Male' | 'Female') => setFormData({ ...formData, gender: value })}>
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
                    <Label htmlFor="maritalStatus">Marital Status</Label>
                    <Select value={formData.maritalStatus} onValueChange={(value: any) => setFormData({ ...formData, maritalStatus: value })}>
                      <SelectTrigger id="maritalStatus">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="work">Work / Occupation</Label>
                    <Input
                      id="work"
                      value={formData.work}
                      onChange={(e) => setFormData({ ...formData, work: e.target.value })}
                      placeholder="Teacher, Engineer..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skill">Special Skill / Liyu Muya</Label>
                    <Input
                      id="skill"
                      value={formData.skill}
                      onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                      placeholder="Music, IT, Painting..."
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
                    <Label htmlFor="hasChildren">Has Children?</Label>
                  </div>
                  {formData.hasChildren && (
                    <div className="space-y-2">
                      <Label htmlFor="numberOfChildren">Number of Children</Label>
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
                    <Label>Volunteer Ministries</Label>
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
                    <Label htmlFor="hierarchyLevel">Hierarchy Level *</Label>
                    <Select
                      value={formData.hierarchyLevel}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          hierarchyLevel: value,
                          // Reset Atbiya and Mahderat when changing hierarchy level
                          atbiyaId: value === 'HiyawanMahderat' ? formData.atbiyaId : '',
                          mahderatId: value === 'HiyawanMahderat' ? formData.mahderatId : '',
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
                      <Label htmlFor="memriyaRole">Memriya Role (Optional)</Label>
                      <Select
                        value={formData.memriyaRole}
                        onValueChange={(value) => setFormData({ ...formData, memriyaRole: value })}
                      >
                        <SelectTrigger id="memriyaRole">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Administrator">Administrator</SelectItem>
                          <SelectItem value="Secretary">Secretary</SelectItem>
                          <SelectItem value="FinanceHead">Finance Head</SelectItem>
                          <SelectItem value="DepartmentHead">Department Head</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="hierarchyEntityId">Assign to Zone *</Label>
                    <Select
                      value={formData.hierarchyEntityId}
                      onValueChange={(value) => setFormData({ ...formData, hierarchyEntityId: value })}
                    >
                      <SelectTrigger id="hierarchyEntityId">
                        <SelectValue placeholder="Select a Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zonesData?.length > 0 ? (
                          zonesData.map((zone: any) => (
                            <SelectItem key={zone.id} value={zone.id}>
                              {zone.name} / {zone.nameAmharic}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No Zones available - Create one first</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Select which Zone this user belongs to. Create a Zone first if none exist.
                    </p>
                  </div>
                  {formData.hierarchyLevel === 'HiyawanMahderat' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="atbiyaId">Atbiya (Church) * / አትብያ (ቤተክርስቲያን) *</Label>
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
                            <SelectValue placeholder="Select Atbiya" />
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
                      <div className="space-y-2">
                        <Label htmlFor="mahderatId">Mahderat (Small Group) * / ማህደራት (ትንሽ ቡድን) *</Label>
                        <Select
                          value={formData.mahderatId}
                          onValueChange={(value) => setFormData({ ...formData, mahderatId: value })}
                          disabled={!formData.atbiyaId}
                        >
                          <SelectTrigger id="mahderatId">
                            <SelectValue placeholder={formData.atbiyaId ? "Select Mahderat" : "Select Atbiya first"} />
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
                          Mahderat are small groups within Atbiya for people living close to each other
                        </p>
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="ministryType">Ministry Type *</Label>
                    <Select value={formData.ministryType} onValueChange={(value) => setFormData({ ...formData, ministryType: value })}>
                      <SelectTrigger id="ministryType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Priest">Priest</SelectItem>
                        <SelectItem value="Deacon">Deacon</SelectItem>
                        <SelectItem value="Sunday School Teacher">Sunday School Teacher</SelectItem>
                        <SelectItem value="Choir Member">Choir Member</SelectItem>
                        <SelectItem value="Youth Leader">Youth Leader</SelectItem>
                        <SelectItem value="Women Ministry">Women Ministry</SelectItem>
                        <SelectItem value="Men Ministry">Men Ministry</SelectItem>
                        <SelectItem value="Elder">Elder</SelectItem>
                        <SelectItem value="General Member">General Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      placeholder="Bole"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="woreda">Woreda *</Label>
                    <Input
                      id="woreda"
                      value={formData.woreda}
                      onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                      placeholder="Bole Sub City"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createUserMutation.isPending}>
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
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
              Total Users
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
          System Admins
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
        <SectionCard title={`All Users (${filteredUsers.length})`} icon={Users} description="View and manage all system users">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Logged on system</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No users found
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
        <SectionCard title="Audit Log" icon={History} description="Track of all user management activities">
          {isLoadingAudit ? (
            <div className="text-center py-4 text-muted-foreground">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No audit logs available</div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {log.action}: <span className="text-primary">{log.targetUserName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {log.performedByName} ({log.performedByRole}) • {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === 'roles' && (
        <SectionCard title="Role Management" icon={Users} description="System permissions and role configurations">
          <div className="p-6 text-slate-600 dark:text-slate-400 text-sm border-2 border-dashed rounded-xl text-center">
            Role management rules & permission matrix are active.
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
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Username cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Full Name (English) *</Label>
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
                <Label htmlFor="edit-profilePicture">Profile Picture (Optional)</Label>
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
                <p className="text-xs text-muted-foreground">Upload JPG, PNG, or GIF. Max size 2MB.</p>
                {formData.profilePicture && (
                  <div className="mt-2">
                    <img src={formData.profilePicture} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-primary" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number *</Label>
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
                <Label htmlFor="edit-gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value: 'Male' | 'Female') => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger id="edit-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hierarchyLevel">Hierarchy Level *</Label>
                <Select
                  value={formData.hierarchyLevel}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      hierarchyLevel: value,
                      atbiyaId: value === 'HiyawanMahderat' ? formData.atbiyaId : '',
                      mahderatId: value === 'HiyawanMahderat' ? formData.mahderatId : '',
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
                  <Label htmlFor="edit-memriyaRole">Memriya Role (Optional)</Label>
                  <Select
                    value={formData.memriyaRole}
                    onValueChange={(value) => setFormData({ ...formData, memriyaRole: value })}
                  >
                    <SelectTrigger id="edit-memriyaRole">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Secretary">Secretary</SelectItem>
                      <SelectItem value="FinanceHead">Finance Head</SelectItem>
                      <SelectItem value="DepartmentHead">Department Head</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-ministryType">Ministry Type *</Label>
                <Select value={formData.ministryType} onValueChange={(value) => setFormData({ ...formData, ministryType: value })}>
                  <SelectTrigger id="edit-ministryType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Priest">Priest</SelectItem>
                    <SelectItem value="Deacon">Deacon</SelectItem>
                    <SelectItem value="Sunday School Teacher">Sunday School Teacher</SelectItem>
                    <SelectItem value="Choir Member">Choir Member</SelectItem>
                    <SelectItem value="Youth Leader">Youth Leader</SelectItem>
                    <SelectItem value="Women Ministry">Women Ministry</SelectItem>
                    <SelectItem value="Men Ministry">Men Ministry</SelectItem>
                    <SelectItem value="Elder">Elder</SelectItem>
                    <SelectItem value="General Member">General Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.hierarchyLevel === 'HiyawanMahderat' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-atbiyaId">Atbiya (Church) * / አትብያ (ቤተክርስቲያን) *</Label>
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
                        <SelectValue placeholder="Select Atbiya" />
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
                  <div className="space-y-2">
                    <Label htmlFor="edit-mahderatId">Mahderat (Small Group) * / ማህደራት (ትንሽ ቡድን) *</Label>
                    <Select
                      value={formData.mahderatId}
                      onValueChange={(value) => setFormData({ ...formData, mahderatId: value })}
                      disabled={!formData.atbiyaId}
                    >
                      <SelectTrigger id="edit-mahderatId">
                        <SelectValue placeholder={formData.atbiyaId ? "Select Mahderat" : "Select Atbiya first"} />
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
                <Label htmlFor="edit-region">Region *</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger id="edit-region">
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
                <Label htmlFor="edit-zone">Zone *</Label>
                <Input
                  id="edit-zone"
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-woreda">Woreda *</Label>
                <Input
                  id="edit-woreda"
                  value={formData.woreda}
                  onChange={(e) => setFormData({ ...formData, woreda: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend this account?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedUser?.fullName}</strong> will immediately lose access to
              everything in the system and will not be able to sign in. Their record is
              kept, so you can restore access later by setting their status back to active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteUserMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteUserMutation.isPending ? 'Suspending…' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
