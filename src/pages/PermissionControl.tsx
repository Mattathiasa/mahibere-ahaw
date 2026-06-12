import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle,
  Users, Crown, ChevronDown, ChevronRight, Search, RotateCcw,
  Eye, EyeOff, Lock, Unlock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/contexts/PermissionContext';
import { permissionService } from '@/services/permissionService';
import { userService } from '@/services/users';
import {
  ALL_PERMISSIONS, PERMISSION_META, PERMISSION_GROUPS,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionKey, type RolePermissionOverrides, type UserPermissionOverrides,
} from '@/lib/rolePermissions';
import type { HierarchyLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Constants ────────────────────────────────────────────────────────────────

const HIERARCHY_LEVELS: HierarchyLevel[] = [
  'Sinodos', 'KuamiSinodos', 'Memriya', 'Zone',
  'Atbiya', 'EnkesekaseMaikel', 'HiyawanMahderat',
];

const LEVEL_COLORS: Record<HierarchyLevel, string> = {
  Sinodos:           'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  KuamiSinodos:      'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Memriya:           'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Zone:              'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Atbiya:            'bg-orange-500/10 text-orange-600 border-orange-500/20',
  EnkesekaseMaikel:  'bg-rose-500/10 text-rose-600 border-rose-500/20',
  HiyawanMahderat:   'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

// ─── Component ────────────────────────────────────────────────────────────────

const PermissionControl: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reload: reloadPermissions } = usePermissions();

  // ── State ─────────────────────────────────────────────────────────────────
  const [roleOverrides, setRoleOverrides] = useState<RolePermissionOverrides>({});
  const [userOverrides, setUserOverrides] = useState<UserPermissionOverrides>({});
  const [superAdmins, setSuperAdmins] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [searchUser, setSearchUser] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(PERMISSION_GROUPS));
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      permissionService.getRolePermissions(),
      permissionService.getUserOverrides(),
      permissionService.getSuperAdmins(),
      userService.getAllUsers(),
    ]).then(([ro, uo, sa, usersData]) => {
      setRoleOverrides(ro);
      setUserOverrides(uo);
      setSuperAdmins(sa);
      setUsers((usersData as any).users ?? []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getRolePerms(role: HierarchyLevel): Set<PermissionKey> {
    return new Set(roleOverrides[role] ?? DEFAULT_ROLE_PERMISSIONS[role] ?? []);
  }

  function toggleRolePerm(role: HierarchyLevel, perm: PermissionKey) {
    const current = getRolePerms(role);
    if (current.has(perm)) current.delete(perm);
    else current.add(perm);
    setRoleOverrides(prev => ({ ...prev, [role]: [...current] }));
  }

  function resetRoleToDefault(role: HierarchyLevel) {
    setRoleOverrides(prev => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
  }

  function getUserPerm(userId: string, perm: PermissionKey): boolean | undefined {
    return userOverrides[userId]?.[perm];
  }

  function setUserPerm(userId: string, perm: PermissionKey, value: boolean | undefined) {
    setUserOverrides(prev => {
      const userEntry = { ...(prev[userId] ?? {}) };
      if (value === undefined) delete userEntry[perm];
      else userEntry[perm] = value;
      return { ...prev, [userId]: userEntry };
    });
  }

  function clearUserOverrides(userId: string) {
    setUserOverrides(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }

  function toggleSuperAdmin(userId: string) {
    setSuperAdmins(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await Promise.all([
        permissionService.saveRolePermissions(roleOverrides, user?.email ?? 'admin'),
        permissionService.saveUserOverrides(userOverrides, user?.email ?? 'admin'),
        permissionService.setSuperAdmins(superAdmins, user?.email ?? 'admin'),
      ]);
      await reloadPermissions();
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  // ── Filtered users ────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const name = (u.fullNameEnglish || u.fullName || u.username || '').toLowerCase();
    return name.includes(searchUser.toLowerCase()) || (u.email || '').toLowerCase().includes(searchUser.toLowerCase());
  });

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Permission Control</h1>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving…' : 'Save All Changes'}
          </Button>
        </div>
        {saveStatus === 'success' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Changes saved and applied to all users immediately.
          </motion.div>
        )}
        {saveStatus === 'error' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> Failed to save. Check your connection.
          </motion.div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="roles">
          <TabsList className="mb-6">
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" /> Role Permissions
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> User Overrides
            </TabsTrigger>
            <TabsTrigger value="superadmin" className="gap-2">
              <Crown className="h-4 w-4" /> Super Admins
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════
              ROLE PERMISSIONS TAB
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="roles">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Role-Level Permissions</CardTitle>
                  <CardDescription>
                    Set which permissions each hierarchy level has by default. These apply to all users at that level unless overridden individually.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Permission matrix */}
              <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 font-bold w-64 sticky left-0 bg-muted/50 z-10">
                        Permission
                      </th>
                      {HIERARCHY_LEVELS.map(level => (
                        <th key={level} className="px-3 py-3 text-center min-w-[110px]">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant="outline" className={`text-[10px] font-black uppercase ${LEVEL_COLORS[level]}`}>
                              {level}
                            </Badge>
                            <button
                              onClick={() => resetRoleToDefault(level)}
                              className="text-[9px] text-muted-foreground hover:text-primary transition-colors"
                              title="Reset to default"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_GROUPS.map(group => (
                      <React.Fragment key={group}>
                        {/* Group header row */}
                        <tr
                          className="bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedGroups(prev => {
                            const next = new Set(prev);
                            if (next.has(group)) next.delete(group);
                            else next.add(group);
                            return next;
                          })}
                        >
                          <td colSpan={HIERARCHY_LEVELS.length + 1} className="px-4 py-2 sticky left-0 bg-muted/30">
                            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                              {expandedGroups.has(group)
                                ? <ChevronDown className="h-3.5 w-3.5" />
                                : <ChevronRight className="h-3.5 w-3.5" />
                              }
                              {group}
                            </div>
                          </td>
                        </tr>

                        {/* Permission rows */}
                        {expandedGroups.has(group) && ALL_PERMISSIONS
                          .filter(p => PERMISSION_META[p].group === group)
                          .map((perm, i) => (
                            <tr key={perm} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                              <td className="px-4 py-2.5 sticky left-0 bg-background z-10">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="cursor-help">
                                      <p className="font-medium text-sm">{PERMISSION_META[perm].label}</p>
                                      <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                                        {PERMISSION_META[perm].description}
                                      </p>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right">
                                    <p className="text-xs max-w-xs">{PERMISSION_META[perm].description}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">{perm}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                              {HIERARCHY_LEVELS.map(level => {
                                const hasDefault = DEFAULT_ROLE_PERMISSIONS[level]?.includes(perm);
                                const hasOverride = roleOverrides[level] !== undefined;
                                const hasPerm = getRolePerms(level).has(perm);
                                const changed = hasOverride && hasPerm !== hasDefault;
                                return (
                                  <td key={level} className="px-3 py-2.5 text-center">
                                    <div className="flex items-center justify-center">
                                      <Switch
                                        checked={hasPerm}
                                        onCheckedChange={() => toggleRolePerm(level, perm)}
                                        className={changed ? 'ring-2 ring-amber-400 ring-offset-1' : ''}
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        }
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full ring-2 ring-amber-400 bg-background" />
                Amber ring = changed from default. Click the ↺ icon on a column header to reset that level to defaults.
              </p>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              USER OVERRIDES TAB
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User list */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Select User</CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users…"
                      value={searchUser}
                      onChange={e => setSearchUser(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredUsers.map(u => {
                      const hasOverrides = Object.keys(userOverrides[u.id] ?? {}).length > 0;
                      const isSA = superAdmins.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => setSelectedUser(u)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${selectedUser?.id === u.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {(u.fullNameEnglish || u.fullName || u.username || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {u.fullNameEnglish || u.fullName || u.username}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${LEVEL_COLORS[u.hierarchyLevel as HierarchyLevel] ?? ''}`}>
                                {u.hierarchyLevel ?? 'Unknown'}
                              </Badge>
                              {isSA && <Crown className="h-3 w-3 text-amber-500" />}
                              {hasOverrides && <span className="text-[9px] text-amber-600 font-bold">OVERRIDES</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Permission overrides for selected user */}
              <div className="lg:col-span-2">
                {!selectedUser ? (
                  <Card className="h-full flex items-center justify-center min-h-[300px]">
                    <div className="text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">Select a user to manage their permissions</p>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {(selectedUser.fullNameEnglish || selectedUser.fullName || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {selectedUser.fullNameEnglish || selectedUser.fullName || selectedUser.username}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-[10px] ${LEVEL_COLORS[selectedUser.hierarchyLevel as HierarchyLevel] ?? ''}`}>
                                {selectedUser.hierarchyLevel}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearUserOverrides(selectedUser.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                          Clear All Overrides
                        </Button>
                      </div>
                      <CardDescription className="mt-2">
                        Overrides are applied on top of the <strong>{selectedUser.hierarchyLevel}</strong> role permissions.
                        <span className="ml-1 text-emerald-600">Green = granted</span>,{' '}
                        <span className="text-red-600">Red = revoked</span>,{' '}
                        <span className="text-muted-foreground">Grey = inherited from role</span>.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {PERMISSION_GROUPS.map(group => {
                          const groupPerms = ALL_PERMISSIONS.filter(p => PERMISSION_META[p].group === group);
                          return (
                            <div key={group}>
                              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                <div className="h-px flex-1 bg-border" />
                                {group}
                                <div className="h-px flex-1 bg-border" />
                              </h3>
                              <div className="space-y-2">
                                {groupPerms.map(perm => {
                                  const roleHas = getRolePerms(selectedUser.hierarchyLevel).has(perm);
                                  const override = getUserPerm(selectedUser.id, perm);
                                  const effective = override !== undefined ? override : roleHas;

                                  return (
                                    <div key={perm} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                                      override === true ? 'border-emerald-200 bg-emerald-50/50' :
                                      override === false ? 'border-red-200 bg-red-50/50' :
                                      'border-border bg-muted/20'
                                    }`}>
                                      <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-lg ${effective ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                          {effective ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium">{PERMISSION_META[perm].label}</p>
                                          <p className="text-[11px] text-muted-foreground">{PERMISSION_META[perm].description}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {override !== undefined && (
                                          <button
                                            onClick={() => setUserPerm(selectedUser.id, perm, undefined)}
                                            className="text-[10px] text-muted-foreground hover:text-primary"
                                            title="Remove override, revert to role default"
                                          >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                        <Switch
                                          checked={effective}
                                          onCheckedChange={val => setUserPerm(selectedUser.id, perm, val === roleHas ? undefined : val)}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════
              SUPER ADMINS TAB
          ══════════════════════════════════════════════════════════════ */}
          <TabsContent value="superadmin">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Super Admin Management
                  </CardTitle>
                  <CardDescription>
                    Super Admins bypass all permission checks and have full access to everything including this control panel.
                    Assign this role with extreme care.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map(u => {
                  const isSA = superAdmins.includes(u.id);
                  return (
                    <motion.div
                      key={u.id}
                      layout
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        isSA ? 'border-amber-300 bg-amber-50/50' : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback className={`font-bold text-sm ${isSA ? 'bg-amber-500/20 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                            {(u.fullNameEnglish || u.fullName || u.username || '?').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{u.fullNameEnglish || u.fullName || u.username}</p>
                            {isSA && <Crown className="h-4 w-4 text-amber-500" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${LEVEL_COLORS[u.hierarchyLevel as HierarchyLevel] ?? ''}`}>
                              {u.hierarchyLevel ?? 'Unknown'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isSA}
                        onCheckedChange={() => toggleSuperAdmin(u.id)}
                        className={isSA ? 'data-[state=checked]:bg-amber-500' : ''}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {superAdmins.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardContent className="pt-4">
                    <p className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Current Super Admins ({superAdmins.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {superAdmins.map(uid => {
                        const u = users.find(x => x.id === uid);
                        return (
                          <Badge key={uid} className="bg-amber-500/10 text-amber-700 border-amber-300 gap-1.5">
                            <Crown className="h-3 w-3" />
                            {u ? (u.fullNameEnglish || u.fullName || u.username) : uid}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom save */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? 'Saving…' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PermissionControl;
