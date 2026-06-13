import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, MonitorCog,
  LayoutPanelLeft, MousePointerClick, ExternalLink, ScrollText, RefreshCw,
  LogIn, LogOut, FilePlus2, FilePen, FileX2, Smartphone, Monitor,
  ShieldCheck, ChevronDown, RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  softwareControlService,
  DEFAULT_SOFTWARE_CONTROL,
  HIERARCHY_LEVELS,
  NAV_KEYS,
  ELEMENT_KEYS,
  type SoftwareControlConfig,
} from '@/services/softwareControl';
import { auditLogService, type AuditLogEntry, type AuditAction } from '@/services/auditLog';
import { permissionService } from '@/services/permissionService';
import {
  ALL_PERMISSIONS, PERMISSION_META, PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS,
  type PermissionKey, type RolePermissionOverrides,
} from '@/lib/rolePermissions';
import type { HierarchyLevel } from '@/types';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NAV_LABELS: Record<string, string> = {
  dashboard: 'Dashboard', announcements: 'Announcements', plans: 'Plans',
  reports: 'Reports', members: 'Members', meetings: 'Meetings',
  finance: 'Finance', hr: 'Human Resources', inventory: 'Inventory',
  churchRules: 'Church Rules', higeDenb: 'HigeDenb', strategicPlan: 'Strategic Plan',
  documents: 'Documents', userManagement: 'User Management',
  hierarchy: 'Hierarchy', settings: 'Settings',
};

const SoftwareControl: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reload: reloadPermissions } = usePermissions();
  const [config, setConfig] = useState<SoftwareControlConfig>(DEFAULT_SOFTWARE_CONTROL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Roles & access (role → permission overrides)
  const [roleOverrides, setRoleOverrides] = useState<RolePermissionOverrides>({});
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(PERMISSION_GROUPS));

  // Audit logs
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | AuditAction>('all');
  const [logSearch, setLogSearch] = useState('');

  useEffect(() => {
    Promise.all([
      softwareControlService.get(),
      permissionService.getRolePermissions().catch(() => ({} as RolePermissionOverrides)),
    ])
      .then(([cfg, roles]) => { setConfig(cfg); setRoleOverrides(roles); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // A role's effective permission list = override if present, else default.
  function rolePerms(level: HierarchyLevel): PermissionKey[] {
    return roleOverrides[level] ?? DEFAULT_ROLE_PERMISSIONS[level] ?? [];
  }
  function roleHasPerm(level: HierarchyLevel, perm: PermissionKey): boolean {
    return rolePerms(level).includes(perm);
  }
  function toggleRolePerm(level: HierarchyLevel, perm: PermissionKey) {
    setRoleOverrides((prev) => {
      const current = prev[level] ?? DEFAULT_ROLE_PERMISSIONS[level] ?? [];
      const next = current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm];
      return { ...prev, [level]: next };
    });
  }
  function resetRoleToDefault(level: HierarchyLevel) {
    setRoleOverrides((prev) => {
      const next = { ...prev };
      delete next[level];
      return next;
    });
  }
  function toggleGroup(group: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
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
    setSaving(true);
    setStatus('idle');
    try {
      await Promise.all([
        softwareControlService.save(config, user?.email ?? 'admin'),
        permissionService.saveRolePermissions(roleOverrides, user?.email ?? 'admin'),
      ]);
      await reloadPermissions();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  // navAccess: missing/empty = everyone. Toggling a level when missing first
  // seeds the full list so unchecking removes just that level.
  function toggleNavLevel(navKey: string, level: string) {
    setConfig((c) => {
      const current = c.navAccess[navKey] ?? [...HIERARCHY_LEVELS];
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
      const current = rule.levels ?? [...HIERARCHY_LEVELS];
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
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> Failed to save. Check permissions.
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

        <Tabs defaultValue="roles" onValueChange={(v) => { if (v === 'audit' && logs.length === 0) loadLogs(); }}>
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
            <TabsTrigger value="audit" className="flex-1 gap-2">
              <ScrollText className="h-4 w-4" /> Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* ════════ ROLES & ACCESS ════════ */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Roles &amp; Access</CardTitle>
                <CardDescription>
                  Declare what each role (hierarchy level) is allowed to do. Toggle a permission for a role; changes apply live on Save. Per-user exceptions live in Permission Control.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PERMISSION_GROUPS.map((group) => {
                  const perms = ALL_PERMISSIONS.filter((p) => PERMISSION_META[p].group === group);
                  const isOpen = openGroups.has(group);
                  return (
                    <div key={group} className="rounded-xl border border-border overflow-hidden">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm font-bold">{group}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      </button>
                      {isOpen && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left">
                                <th className="py-2 px-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold min-w-[180px]">
                                  Permission
                                </th>
                                {HIERARCHY_LEVELS.map((level) => (
                                  <th key={level} className="py-2 px-2 text-[10px] uppercase tracking-wide text-muted-foreground text-center">
                                    {level}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {perms.map((perm) => (
                                <tr key={perm} className="border-b border-border/50">
                                  <td className="py-2 px-4">
                                    <div className="font-medium">{PERMISSION_META[perm].label}</div>
                                    <div className="text-[11px] text-muted-foreground">{PERMISSION_META[perm].description}</div>
                                  </td>
                                  {HIERARCHY_LEVELS.map((level) => (
                                    <td key={level} className="py-2 px-2 text-center">
                                      <Checkbox
                                        checked={roleHasPerm(level as HierarchyLevel, perm)}
                                        onCheckedChange={() => toggleRolePerm(level as HierarchyLevel, perm)}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-xs text-muted-foreground self-center mr-1">Reset a role to defaults:</span>
                  {HIERARCHY_LEVELS.map((level) => (
                    <Button key={level} size="sm" variant="outline" className="gap-1 text-xs"
                      onClick={() => resetRoleToDefault(level as HierarchyLevel)}>
                      <RotateCcw className="h-3 w-3" /> {level}
                    </Button>
                  ))}
                </div>
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
                      {HIERARCHY_LEVELS.map((level) => (
                        <th key={level} className="py-2 px-2 text-[10px] uppercase tracking-wide text-muted-foreground text-center">
                          {level}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {NAV_KEYS.map((navKey) => (
                      <tr key={navKey} className="border-b border-border/50">
                        <td className="py-2.5 pr-4 font-semibold whitespace-nowrap">{NAV_LABELS[navKey] ?? navKey}</td>
                        {HIERARCHY_LEVELS.map((level) => (
                          <td key={level} className="py-2.5 px-2 text-center">
                            <Checkbox
                              checked={navHasLevel(navKey, level)}
                              onCheckedChange={() => toggleNavLevel(navKey, level)}
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
                          {HIERARCHY_LEVELS.map((level) => (
                            <label key={level} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                              <Checkbox
                                checked={elementHasLevel(key, level)}
                                onCheckedChange={() => toggleElementLevel(key, level)}
                              />
                              {level}
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
