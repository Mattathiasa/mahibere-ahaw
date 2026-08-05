import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, MonitorCog,
  LayoutPanelLeft, MousePointerClick, ExternalLink, ScrollText, RefreshCw,
  LogIn, LogOut, FilePlus2, FilePen, FileX2, Smartphone, Monitor,
  ShieldCheck, Plus, Pencil, Trash2, Lock, Users as UsersIcon, UserPlus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  softwareControlService,
  DEFAULT_SOFTWARE_CONTROL,
  NAV_KEYS,
  NAV_LABELS,
  ELEMENT_KEYS,
  type SoftwareControlConfig,
} from '@/services/softwareControl';
import { auditLogService, type AuditLogEntry, type AuditAction } from '@/services/auditLog';
import {
  roleRegistryService, roleLabel, validateRegistry, DEFAULT_SIGNUP_ROLE,
  type Role,
} from '@/services/roleRegistry';
import { DEFAULT_ROLE_PERMISSIONS, type PermissionKey } from '@/lib/rolePermissions';
import { userService } from '@/services/users';
import { PermissionMatrix } from '@/components/PermissionMatrix';
import { RoleEditorDialog } from '@/components/RoleEditorDialog';
import { MembershipRequests } from '@/components/MembershipRequests';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const SoftwareControl: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reload: reloadPermissions, isSuperAdmin } = usePermissions();
  const [config, setConfig] = useState<SoftwareControlConfig>(DEFAULT_SOFTWARE_CONTROL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Role registry ─────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [registryVersion, setRegistryVersion] = useState(1);
  const [signupRole, setSignupRole] = useState(DEFAULT_SIGNUP_ROLE);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  /** roleKey → how many accounts carry it, so deletes can warn and reassign. */
  const [roleUsage, setRoleUsage] = useState<Record<string, number>>({});

  // The Atbiya registry moved to its own page at /atbiya-registry, so that
  // roles holding `canManageAtbiyas` can reach it without being super admins.

  // Audit logs
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | AuditAction>('all');
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Write the seed before anything reads it. Safe under both the old and
        // the new rules, and a no-op once siteConfig/roles exists.
        if (isSuperAdmin) {
          await roleRegistryService.ensureSeeded(user?.email ?? 'admin').catch(() => false);
        }
        const [cfg, registry] = await Promise.all([
          softwareControlService.get(),
          roleRegistryService.get(),
        ]);
        setConfig(cfg);
        setRoles(registry.roles);
        setRegistryVersion(registry.version);

        // Usage counts are advisory only — a failure here must not block the
        // page, so they are fetched separately and swallowed.
        try {
          const { users } = await userService.getAllUsers();
          const counts: Record<string, number> = {};
          for (const u of users as { hierarchyLevel?: string }[]) {
            const key = u.hierarchyLevel ?? '';
            if (key) counts[key] = (counts[key] ?? 0) + 1;
          }
          setRoleUsage(counts);
        } catch { /* counts stay empty */ }
      } catch { /* defaults already in state */ } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  // ── Role registry mutations (local until Save & Publish) ───────────────────
  function toggleRolePerm(roleKey: string, perm: PermissionKey) {
    setRoles((prev) => prev.map((r) => {
      if (r.key !== roleKey) return r;
      const has = r.permissions.includes(perm);
      return {
        ...r,
        permissions: has ? r.permissions.filter((p) => p !== perm) : [...r.permissions, perm],
      };
    }));
  }

  function resetRoleToDefault(roleKey: string) {
    setRoles((prev) => prev.map((r) =>
      r.key === roleKey ? { ...r, permissions: [...(DEFAULT_ROLE_PERMISSIONS[roleKey] ?? [])] } : r
    ));
  }

  function upsertRole(role: Role) {
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r.key === role.key);
      if (idx === -1) {
        // New roles start from the narrowest sensible baseline rather than
        // inheriting everything.
        return [...prev, { ...role, permissions: role.permissions.length ? role.permissions : [] }];
      }
      const next = [...prev];
      next[idx] = { ...role, permissions: prev[idx].permissions };
      return next;
    });
    setRoleDialogOpen(false);
    setEditingRole(null);
  }

  function deleteRole(role: Role) {
    if (role.isSystem) return;
    const count = roleUsage[role.key] ?? 0;
    if (count > 0) {
      setErrorMsg(
        `"${roleLabel(role, 'en')}" still has ${count} account${count === 1 ? '' : 's'}. ` +
        'Move those accounts to another role in User Management first — deleting it now would leave them with no permissions.'
      );
      setStatus('error');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.key !== role.key));
  }

  function moveRole(index: number, delta: number) {
    setRoles((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function loadLogs(action: 'all' | AuditAction = logFilter) {
    setLogsLoading(true);
    try {
      setLogs(await auditLogService.getRecent(250, action === 'all' ? undefined : action));
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleSave() {
    setErrorMsg(null);

    // Refuse client-side before writing anything — a registry with no admin
    // role would lock every human out of this page permanently.
    const problem = validateRegistry(roles);
    if (problem) {
      setErrorMsg(problem);
      setStatus('error');
      return;
    }

    setSaving(true);
    setStatus('idle');
    try {
      const nextVersion = await roleRegistryService.save(
        roles, user?.email ?? 'admin', registryVersion, signupRole
      );
      setRegistryVersion(nextVersion);
      await softwareControlService.save(config, user?.email ?? 'admin');
      await reloadPermissions();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Failed to save. Check your permissions.');
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  // navAccess: missing/empty = everyone. Toggling a level when missing first
  // seeds the full list so unchecking removes just that level.
  function toggleNavLevel(navKey: string, level: string) {
    setConfig((c) => {
      const current = c.navAccess[navKey] ?? roles.map((r) => r.key);
      const next = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level];
      return { ...c, navAccess: { ...c.navAccess, [navKey]: next } };
    });
  }

  function navHasLevel(navKey: string, level: string): boolean {
    const allowed = config.navAccess[navKey];
    if (!allowed || allowed.length === 0) return true;
    return allowed.includes(level);
  }

  function setElementVisible(key: string, visible: boolean) {
    setConfig((c) => ({
      ...c,
      elements: { ...c.elements, [key]: { ...c.elements[key], visible } },
    }));
  }

  function toggleElementLevel(key: string, level: string) {
    setConfig((c) => {
      const rule = c.elements[key] ?? {};
      const current = rule.levels ?? roles.map((r) => r.key);
      const next = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level];
      return { ...c, elements: { ...c.elements, [key]: { ...rule, levels: next } } };
    });
  }

  function elementHasLevel(key: string, level: string): boolean {
    const rule = config.elements[key];
    if (!rule?.levels || rule.levels.length === 0) return true;
    return rule.levels.includes(level);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <MonitorCog className="h-5 w-5" /> Software Control
              </h1>
              {config.meta?.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last saved: {new Date(config.meta.updatedAt).toLocaleString()} by {config.meta.updatedBy}
                </p>
              )}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'Saving…' : 'Save & Publish'}
          </Button>
        </div>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Saved — applies live to all signed-in users.
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{errorMsg ?? 'Failed to save. Check permissions.'}</span>
          </motion.div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        {/* Related control centers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Permission Control', desc: 'Role & per-user permissions', href: '/admin/permissions' },
            { label: 'Mobile App Control', desc: 'Kill switch, versions, flags', href: '/admin/mobile-control' },
            { label: 'Site Content Editor', desc: 'Landing page & UI text', href: '/admin/landing-editor' },
            { label: 'Module Configuration', desc: 'Members, Plans, Reports', href: '/admin/module-config' },
            { label: 'Atbiya Registry', desc: 'Parishes & their administrators', href: '/atbiya-registry' },
          ].map((l) => (
            <button key={l.href} onClick={() => navigate(l.href)}
              className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/50 transition-colors text-left">
              <div>
                <p className="text-sm font-bold">{l.label}</p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <Tabs defaultValue="roles" onValueChange={(v) => {
          // Loaded lazily so the page opens fast.
          if (v === 'audit' && logs.length === 0) loadLogs();
        }}>
          <TabsList className="mb-6 w-full flex-wrap h-auto">
            <TabsTrigger value="roles" className="flex-1 gap-2">
              <ShieldCheck className="h-4 w-4" /> Roles &amp; Access
            </TabsTrigger>
            <TabsTrigger value="tabs" className="flex-1 gap-2">
              <LayoutPanelLeft className="h-4 w-4" /> Navigation Tabs
            </TabsTrigger>
            <TabsTrigger value="buttons" className="flex-1 gap-2">
              <MousePointerClick className="h-4 w-4" /> Buttons & Actions
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1 gap-2">
              <UserPlus className="h-4 w-4" /> Requests
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 gap-2">
              <ScrollText className="h-4 w-4" /> Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* ════════ ROLES & ACCESS ════════ */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>
                    Every role in the system. The seven built-in roles come from the church
                    bylaws — their labels, permissions and flags are editable, but their keys
                    are permanent because existing accounts store them.
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => { setEditingRole(null); setRoleDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Add role
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {roles.map((role, i) => (
                  <div key={role.key}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveRole(i, -1)} disabled={i === 0}
                        className="text-[10px] leading-none px-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move up">▲</button>
                      <button onClick={() => moveRole(i, 1)} disabled={i === roles.length - 1}
                        className="text-[10px] leading-none px-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        aria-label="Move down">▼</button>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{roleLabel(role, 'en')}</span>
                        {role.labels.am && (
                          <span className="text-sm text-muted-foreground font-ethiopic">{role.labels.am}</span>
                        )}
                        <code className="text-[10px] text-muted-foreground">{role.key}</code>
                        {role.isSystem && (
                          <Badge variant="secondary" className="gap-1 text-[10px]">
                            <Lock className="h-2.5 w-2.5" /> Built-in
                          </Badge>
                        )}
                        {!role.active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] capitalize">{role.scope}</Badge>
                      {role.isAdmin && <Badge className="text-[10px]">Admin</Badge>}
                      {role.canApproveMembers && (
                        <Badge variant="secondary" className="text-[10px]">Approver</Badge>
                      )}
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <UsersIcon className="h-2.5 w-2.5" /> {roleUsage[role.key] ?? 0}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {role.permissions.length} perms
                      </Badge>
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditingRole(role); setRoleDialogOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 disabled:opacity-30"
                        disabled={role.isSystem}
                        title={role.isSystem ? 'Built-in roles cannot be deleted' : 'Delete role'}
                        onClick={() => deleteRole(role)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-border flex items-center gap-3 flex-wrap">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Role for new sign-ups</p>
                    <p className="text-xs text-muted-foreground">
                      Assigned automatically when someone registers from the public sign-up page.
                    </p>
                  </div>
                  <Select value={signupRole} onValueChange={setSignupRole}>
                    <SelectTrigger className="w-56 ml-auto"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.filter((r) => r.active !== false).map((r) => (
                        <SelectItem key={r.key} value={r.key}>{roleLabel(r, 'en')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  What each role may do. Columns follow the role list above. Per-user
                  exceptions live in Permission Control.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PermissionMatrix
                  roles={roles}
                  onToggle={toggleRolePerm}
                  onResetRole={resetRoleToDefault}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ NAV TAB ACCESS MATRIX ════════ */}
          <TabsContent value="tabs">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Tab Access</CardTitle>
                <CardDescription>
                  Check which hierarchy levels can see each tab. All boxes checked (or untouched) = visible to everyone. Super admins always see everything.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-4 text-xs uppercase tracking-wider text-muted-foreground">Tab</th>
                      {roles.map((role) => (
                        <th key={role.key} className="py-2 px-2 text-[10px] uppercase tracking-wide text-muted-foreground text-center whitespace-nowrap">
                          {roleLabel(role, 'en')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NAV_KEYS.map((navKey) => (
                      <tr key={navKey} className="border-b border-border/50">
                        <td className="py-2.5 pr-4 font-semibold whitespace-nowrap">{NAV_LABELS[navKey] ?? navKey}</td>
                        {roles.map((role) => (
                          <td key={role.key} className="py-2.5 px-2 text-center">
                            <Checkbox
                              checked={navHasLevel(navKey, role.key)}
                              onCheckedChange={() => toggleNavLevel(navKey, role.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ ELEMENT (BUTTON) CONTROL ════════ */}
          <TabsContent value="buttons">
            <Card>
              <CardHeader>
                <CardTitle>Buttons & Actions</CardTitle>
                <CardDescription>
                  Hide an action completely with the switch, or restrict it to specific hierarchy levels. Super admins always see everything.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ELEMENT_KEYS.map(({ key, label, page }) => {
                  const rule = config.elements[key] ?? {};
                  const visible = rule.visible !== false;
                  return (
                    <div key={key} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            <Badge variant="secondary" className="mr-2 text-[10px]">{page}</Badge>
                            <code className="text-[10px]">{key}</code>
                          </p>
                        </div>
                        <Switch checked={visible} onCheckedChange={(v) => setElementVisible(key, v)} />
                      </div>
                      {visible && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {roles.map((role) => (
                            <label key={role.key} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                              <Checkbox
                                checked={elementHasLevel(key, role.key)}
                                onCheckedChange={() => toggleElementLevel(key, role.key)}
                              />
                              {roleLabel(role, 'en')}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ MEMBERSHIP REQUESTS ════════ */}
          <TabsContent value="requests">
            <MembershipRequests />
          </TabsContent>

          {/* ════════ AUDIT LOGS ════════ */}
          <TabsContent value="audit">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>
                    Every login, logout, and data change across web and mobile — with the device used. Newest first (last 250).
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => loadLogs()}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {(['all', 'login', 'logout', 'create', 'update', 'delete'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => { setLogFilter(f); loadLogs(f); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors border ${
                        logFilter === f
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                  <div className="relative ml-auto w-full sm:w-64">
                    <Input
                      placeholder="Search user / description…"
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {logsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (() => {
                  const filtered = logs.filter((l) =>
                    logSearch.trim() === '' ||
                    [l.userName, l.userEmail, l.description, l.targetType]
                      .join(' ').toLowerCase().includes(logSearch.toLowerCase())
                  );
                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-muted-foreground">
                        <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No audit entries</p>
                        <p className="text-sm">Activity will appear here as users sign in and change data.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                            <th className="py-2 pr-4">When</th>
                            <th className="py-2 pr-4">User</th>
                            <th className="py-2 pr-4">Action</th>
                            <th className="py-2 pr-4">Details</th>
                            <th className="py-2">Device</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((l) => (
                            <tr key={l.id} className="border-b border-border/50">
                              <td className="py-2.5 pr-4 whitespace-nowrap text-xs text-muted-foreground">
                                {l.createdAt?.toDate ? l.createdAt.toDate().toLocaleString() : '—'}
                              </td>
                              <td className="py-2.5 pr-4">
                                <div className="font-medium">{l.userName ?? '—'}</div>
                                <div className="text-xs text-muted-foreground">{l.userEmail ?? l.userId}</div>
                              </td>
                              <td className="py-2.5 pr-4">{renderAction(l.action)}</td>
                              <td className="py-2.5 pr-4">
                                <div>{l.description ?? '—'}</div>
                                {l.targetType && <div className="text-xs text-muted-foreground">{l.targetType}{l.targetId ? ` · ${l.targetId.slice(0, 8)}` : ''}</div>}
                              </td>
                              <td className="py-2.5">
                                <span className="inline-flex items-center gap-1.5 text-xs">
                                  {l.platform === 'android' || l.platform === 'ios'
                                    ? <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                    : <Monitor className="h-3.5 w-3.5 text-muted-foreground" />}
                                  {l.device ?? l.platform ?? '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RoleEditorDialog
        open={roleDialogOpen}
        role={editingRole}
        existingKeys={roles.map((r) => r.key)}
        userCount={editingRole ? roleUsage[editingRole.key] ?? 0 : 0}
        onSave={upsertRole}
        onClose={() => { setRoleDialogOpen(false); setEditingRole(null); }}
      />
    </div>
  );
};

const ACTION_STYLES: Record<AuditAction, { label: string; cls: string; Icon: typeof LogIn }> = {
  login: { label: 'Login', cls: 'bg-green-500/10 text-green-700 border-green-500/30', Icon: LogIn },
  logout: { label: 'Logout', cls: 'bg-slate-500/10 text-slate-600 border-slate-500/30', Icon: LogOut },
  create: { label: 'Create', cls: 'bg-blue-500/10 text-blue-700 border-blue-500/30', Icon: FilePlus2 },
  update: { label: 'Update', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30', Icon: FilePen },
  delete: { label: 'Delete', cls: 'bg-red-500/10 text-red-700 border-red-500/30', Icon: FileX2 },
};

function renderAction(action: AuditAction) {
  const s = ACTION_STYLES[action] ?? ACTION_STYLES.update;
  const { Icon } = s;
  return (
    <Badge variant="outline" className={`gap-1 ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </Badge>
  );
}

export default SoftwareControl;
