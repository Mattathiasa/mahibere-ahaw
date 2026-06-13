import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, MonitorCog,
  LayoutPanelLeft, MousePointerClick, ExternalLink,
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
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
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
  const [config, setConfig] = useState<SoftwareControlConfig>(DEFAULT_SOFTWARE_CONTROL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    softwareControlService.get().then(setConfig).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    try {
      await softwareControlService.save(config, user?.email ?? 'admin');
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
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Permission Control', desc: 'Role & per-user permissions', href: '/admin/permissions' },
            { label: 'Mobile App Control', desc: 'Kill switch, versions, flags', href: '/admin/mobile-control' },
            { label: 'Site Content Editor', desc: 'Landing page & UI text', href: '/admin/landing-editor' },
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

        <Tabs defaultValue="tabs">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="tabs" className="flex-1 gap-2">
              <LayoutPanelLeft className="h-4 w-4" /> Navigation Tabs
            </TabsTrigger>
            <TabsTrigger value="buttons" className="flex-1 gap-2">
              <MousePointerClick className="h-4 w-4" /> Buttons & Actions
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
};

export default SoftwareControl;
