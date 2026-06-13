import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Loader2, CheckCircle2, AlertCircle, SlidersHorizontal,
  Plus, Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  moduleConfigService, DEFAULT_MODULE_CONFIG,
  type ModuleConfig, type ModuleKey, type SingleModuleConfig, type FieldConfig,
} from '@/services/moduleConfig';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'members', label: 'Members' },
  { key: 'plans', label: 'Plans' },
  { key: 'reports', label: 'Reports' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'finance', label: 'Finance' },
  { key: 'hr', label: 'HR' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'teachings', label: 'Teachings' },
  { key: 'documents', label: 'Documents' },
  { key: 'hierarchy', label: 'Hierarchy' },
  { key: 'missionary', label: 'Missionary' },
  { key: 'volunteer', label: 'Volunteer' },
  { key: 'strategicPlan', label: 'Strategic Plan' },
  { key: 'churchRules', label: 'Church Rules' },
  { key: 'higeDenb', label: 'HigeDenb' },
];

const ModuleConfigPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState<ModuleConfig>(DEFAULT_MODULE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    moduleConfigService.get().then(setConfig).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    try {
      await moduleConfigService.save(config, user?.email ?? 'admin');
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  function patch(key: ModuleKey, updater: (m: SingleModuleConfig) => SingleModuleConfig) {
    setConfig((c) => ({ ...c, [key]: updater(c[key]) }));
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
                <SlidersHorizontal className="h-5 w-5" /> Module Configuration
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
            <CheckCircle2 className="h-4 w-4" /> Saved — applies live to Members, Plans and Reports.
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" /> Failed to save. Check permissions.
          </motion.div>
        )}
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Tabs defaultValue="members">
          <TabsList className="mb-6 w-full flex-wrap h-auto gap-1">
            {MODULES.map((m) => (
              <TabsTrigger key={m.key} value={m.key}>{m.label}</TabsTrigger>
            ))}
          </TabsList>

          {MODULES.map((m) => {
            const mod = config[m.key];
            return (
              <TabsContent key={m.key} value={m.key} className="space-y-6">
                {/* Page header */}
                <Card>
                  <CardHeader>
                    <CardTitle>Page Header</CardTitle>
                    <CardDescription>Overrides the title/description shown on the {m.label} page. Leave blank to use the translated default.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</Label>
                      <Input value={mod.headerTitle} placeholder="(translated default)"
                        onChange={(e) => patch(m.key, (x) => ({ ...x, headerTitle: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                      <Textarea rows={2} value={mod.headerDescription} placeholder="(translated default)"
                        onChange={(e) => patch(m.key, (x) => ({ ...x, headerDescription: e.target.value }))} />
                    </div>
                  </CardContent>
                </Card>

                {/* Learn More */}
                <Card>
                  <CardHeader>
                    <CardTitle>Learn More Content</CardTitle>
                    <CardDescription>Shown behind a "Learn More" button on the {m.label} page. Line breaks are preserved.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea rows={6} value={mod.learnMore}
                      onChange={(e) => patch(m.key, (x) => ({ ...x, learnMore: e.target.value }))} />
                  </CardContent>
                </Card>

                {/* Fields */}
                {mod.fields.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Form Fields</CardTitle>
                    <CardDescription>Toggle which fields appear and whether they're required.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {mod.fields.map((f, i) => (
                      <div key={f.key} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border bg-muted/20">
                        <div>
                          <p className="text-sm font-semibold">{f.label}</p>
                          <code className="text-[10px] text-muted-foreground">{f.key}</code>
                        </div>
                        <div className="flex items-center gap-5">
                          <label className="flex items-center gap-2 text-xs font-medium">
                            Visible
                            <Switch checked={f.visible}
                              onCheckedChange={(v) => patch(m.key, (x) => {
                                const fields = [...x.fields]; fields[i] = { ...fields[i], visible: v }; return { ...x, fields };
                              })} />
                          </label>
                          <label className="flex items-center gap-2 text-xs font-medium">
                            Required
                            <Switch checked={f.required} disabled={!f.visible}
                              onCheckedChange={(v) => patch(m.key, (x) => {
                                const fields = [...x.fields]; fields[i] = { ...fields[i], required: v }; return { ...x, fields };
                              })} />
                          </label>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                )}

                {/* Option lists */}
                {Object.keys(mod.options).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Option Lists</CardTitle>
                    <CardDescription>The selectable values used by this module's dropdowns.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {Object.entries(mod.options).map(([listName, values]) => (
                      <OptionListEditor
                        key={listName}
                        name={listName}
                        values={values}
                        onChange={(next) => patch(m.key, (x) => ({ ...x, options: { ...x.options, [listName]: next } }))}
                      />
                    ))}
                  </CardContent>
                </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

function OptionListEditor({ name, values, onChange }: {
  name: string; values: string[]; onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground capitalize">{name}</Label>
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-sm">
            {v}
            <button onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={draft} placeholder={`Add to ${name}…`} className="h-9"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { onChange([...values, draft.trim()]); setDraft(''); } }} />
        <Button type="button" variant="outline" size="sm"
          onClick={() => { if (draft.trim()) { onChange([...values, draft.trim()]); setDraft(''); } }}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default ModuleConfigPage;
