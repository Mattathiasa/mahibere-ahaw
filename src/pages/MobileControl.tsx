import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, Smartphone,
  Power, ShieldAlert, RefreshCw, Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  mobileAppControlService,
  DEFAULT_MOBILE_APP_CONFIG,
  MOBILE_FEATURE_KEYS,
  type MobileAppConfig,
  type MobileAuditRecord,
} from '@/services/mobileAppControl';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FEATURE_LABELS: Record<string, string> = {
  announcements: 'Announcements',
  plans: 'Plans & Ministry',
  reports: 'Reports',
  members: 'Members',
  meetings: 'Meetings',
  finance: 'Finance',
  hr: 'Human Resources',
  inventory: 'Inventory',
  hierarchy: 'Hierarchy',
  higeDenb: 'HigeDenb',
  churchRules: 'Church Rules',
  teachings: 'Teachings',
  documents: 'Documents',
  missionary: 'Missionary',
  volunteer: 'Volunteer',
  partner: 'Partner Contact',
  strategicPlan: 'Strategic Plan',
  notifications: 'Notifications',
  userManagement: 'User Management',
  permissionControl: 'Permission Control',
};

function formatWhen(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

const MobileControl: React.FC = () => {
  const { t } = useLanguage();
  const a = t.admin;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [config, setConfig] = useState<MobileAppConfig>(DEFAULT_MOBILE_APP_CONFIG);
  const [audit, setAudit] = useState<MobileAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [auditError, setAuditError] = useState(false);

  useEffect(() => {
    Promise.all([
      mobileAppControlService.getConfig(),
      mobileAppControlService.getAuditRecords().catch(() => {
        setAuditError(true);
        return [] as MobileAuditRecord[];
      }),
    ])
      .then(([cfg, records]) => {
        setConfig(cfg);
        setAudit(records);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await mobileAppControlService.saveConfig(config, user?.email ?? 'admin');
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function refreshAudit() {
    try {
      setAuditError(false);
      setAudit(await mobileAppControlService.getAuditRecords());
    } catch {
      setAuditError(true);
    }
  }

  function setFeature(key: string, enabled: boolean) {
    setConfig((c) => ({ ...c, features: { ...c.features, [key]: enabled } }));
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
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Smartphone className="h-5 w-5" /> Mobile App Control
              </h1>
              {config.meta?.updatedAt && (
                <p className="text-xs text-muted-foreground">
                  Last saved: {formatWhen(config.meta.updatedAt)} by {config.meta.updatedBy}
                </p>
              )}
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            {saving ? 'Saving…' : 'Save & Publish'}
          </Button>
        </div>

        {saveStatus === 'success' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Saved. Mobile apps pick this up on next launch or within seconds if open.
          </motion.div>
        )}
        {saveStatus === 'error' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> Failed to save. Check your connection and permissions.
          </motion.div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Tabs defaultValue="control">
          <TabsList className="mb-6 w-full">
            <TabsTrigger value="control" className="flex-1 gap-2">
              <Power className="h-4 w-4" /> Remote Control
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex-1 gap-2">
              <Users className="h-4 w-4" /> Device Audit ({audit.length})
            </TabsTrigger>
          </TabsList>

          {/* ════════ REMOTE CONTROL ════════ */}
          <TabsContent value="control" className="space-y-6">

            {/* Kill switch */}
            <Card className={config.killSwitch ? 'border-red-500/50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className={`h-5 w-5 ${config.killSwitch ? 'text-red-500' : ''}`} />
                  Kill Switch
                </CardTitle>
                <CardDescription>
                  When enabled, every mobile app shows the maintenance message and blocks all usage immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                  <div>
                    <p className="font-semibold">{config.killSwitch ? 'App is LOCKED' : 'App is live'}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.killSwitch
                        ? 'Mobile users currently see the maintenance screen.'
                        : 'Mobile users can use the app normally.'}
                    </p>
                  </div>
                  <Switch
                    checked={config.killSwitch}
                    onCheckedChange={(v) => setConfig((c) => ({ ...c, killSwitch: v }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Maintenance message
                  </Label>
                  <Textarea
                    rows={2}
                    value={config.maintenanceMessage}
                    onChange={(e) => setConfig((c) => ({ ...c, maintenanceMessage: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Version gate */}
            <Card>
              <CardHeader>
                <CardTitle>{a.mcVersionGate}</CardTitle>
                <CardDescription>
                  Force outdated installs to update before they can continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Minimum build number
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={config.minBuildNumber}
                    onChange={(e) => setConfig((c) => ({ ...c, minBuildNumber: parseInt(e.target.value || '1', 10) }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Builds below this are blocked.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Latest version name
                  </Label>
                  <Input
                    value={config.latestVersionName}
                    onChange={(e) => setConfig((c) => ({ ...c, latestVersionName: e.target.value }))}
                    placeholder="1.2.0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Update URL
                  </Label>
                  <Input
                    value={config.updateUrl}
                    onChange={(e) => setConfig((c) => ({ ...c, updateUrl: e.target.value }))}
                    placeholder="https://play.google.com/store/apps/details?id=…"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Feature flags */}
            <Card>
              <CardHeader>
                <CardTitle>{a.mcFeatureFlags}</CardTitle>
                <CardDescription>
                  Turn individual modules on or off in the mobile app without shipping an update. Disabled modules disappear from the app menu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-3">
                  {MOBILE_FEATURE_KEYS.map((key) => {
                    const enabled = config.features[key] !== false;
                    return (
                      <div key={key}
                        className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                        <span className={`text-sm font-medium ${enabled ? '' : 'opacity-50 line-through'}`}>
                          {FEATURE_LABELS[key] ?? key}
                        </span>
                        <Switch checked={enabled} onCheckedChange={(v) => setFeature(key, v)} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ════════ DEVICE AUDIT ════════ */}
          <TabsContent value="audit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{a.mcDevices}</CardTitle>
                  <CardDescription>
                    Every mobile login reports its device, app version, and last activity here.
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={refreshAudit}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {auditError && (
                  <p className="text-sm text-red-600 mb-4">
                    Could not load audit records. Make sure the updated Firestore rules are deployed.
                  </p>
                )}
                {audit.length === 0 && !auditError ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No mobile sessions reported yet</p>
                    <p className="text-sm">Records appear after users sign in on the updated app.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="py-2 pr-4">User</th>
                          <th className="py-2 pr-4">Level</th>
                          <th className="py-2 pr-4">Device</th>
                          <th className="py-2 pr-4">App</th>
                          <th className="py-2 pr-4">Sessions</th>
                          <th className="py-2">Last seen</th>
                        </tr>
                      </thead>
                      <tbody>
                        {audit.map((r) => {
                          const outdated = (r.buildNumber ?? 0) < config.minBuildNumber;
                          return (
                            <tr key={r.id} className="border-b border-border/50">
                              <td className="py-2.5 pr-4">
                                <div className="font-medium">{r.displayName ?? '—'}</div>
                                <div className="text-xs text-muted-foreground">{r.email ?? r.id}</div>
                              </td>
                              <td className="py-2.5 pr-4">
                                {r.hierarchyLevel ? <Badge variant="secondary">{r.hierarchyLevel}</Badge> : '—'}
                              </td>
                              <td className="py-2.5 pr-4">
                                <div>{r.deviceModel ?? '—'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {[r.platform, r.osVersion].filter(Boolean).join(' ')}
                                </div>
                              </td>
                              <td className="py-2.5 pr-4">
                                <span className={outdated ? 'text-red-600 font-semibold' : ''}>
                                  {r.appVersion ?? '—'}{r.buildNumber ? ` (${r.buildNumber})` : ''}
                                </span>
                                {outdated && <div className="text-[10px] text-red-600 uppercase">Outdated</div>}
                              </td>
                              <td className="py-2.5 pr-4">{r.sessionCount ?? '—'}</td>
                              <td className="py-2.5">{formatWhen(r.lastSeen)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MobileControl;
