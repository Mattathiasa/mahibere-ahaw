import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Scale, BookText, ClipboardList, Plus, Trash2, Save, Loader2, Pencil } from 'lucide-react';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  churchRulesService, DEFAULT_CHURCH_RULES,
  type ChurchRulesData, type RuleItem,
} from '@/services/churchRules';

type CategoryKey = 'denb' | 'memerya' | 'policies';

const CATEGORIES: { key: CategoryKey; label: string; amharic: string; icon: typeof Scale; color: string }[] = [
  { key: 'denb', label: 'Regulations', amharic: 'ደንብ', icon: Scale, color: 'text-indigo-500' },
  { key: 'memerya', label: 'Directives', amharic: 'መመሪያ', icon: BookText, color: 'text-emerald-500' },
  { key: 'policies', label: 'Policies', amharic: 'ፖሊሲ', icon: ClipboardList, color: 'text-amber-500' },
];

// Matches the siteConfig Firestore write rule (Sinodos/KuamiSinodos/SuperAdmin).
const EDIT_LEVELS = ['Sinodos', 'KuamiSinodos'];

const ChurchLaws = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<ChurchRulesData>(DEFAULT_CHURCH_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const canEdit =
    EDIT_LEVELS.includes(user?.hierarchyLevel ?? '') ||
    user?.role === 'SuperAdmin' || user?.role === 'Admin';

  useEffect(() => {
    churchRulesService.get().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function updateItem(cat: CategoryKey, i: number, key: keyof RuleItem, value: string) {
    setData((d) => {
      const items = [...d[cat]];
      items[i] = { ...items[i], [key]: value };
      return { ...d, [cat]: items };
    });
  }
  function addItem(cat: CategoryKey) {
    setData((d) => ({ ...d, [cat]: [...d[cat], { title: '', content: '' }] }));
  }
  function removeItem(cat: CategoryKey, i: number) {
    setData((d) => ({ ...d, [cat]: d[cat].filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await churchRulesService.save(data, user?.email ?? 'admin');
      toast.success('Church rules saved');
      setEditMode(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <ConfigurablePageHeader
          module="churchRules"
          defaultTitle={t('churchRules')}
          defaultDescription={t('churchRulesHeaderDesc')}
          badge="Canonical Law"
        />
        {canEdit && (
          <div className="flex gap-2">
            {editMode ? (
              <>
                <Button variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Edit
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="denb" className="space-y-8">
        <TabsList className="bg-white/40 dark:bg-black/20 p-1.5 rounded-2xl border border-white/40 dark:border-white/10 backdrop-blur-xl h-auto flex flex-wrap gap-2">
          {CATEGORIES.map(({ key, label, amharic, icon: Icon }) => (
            <TabsTrigger key={key} value={key}
              className="rounded-xl px-6 py-2.5 data-[state=active]:bg-[#2E5E99] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold gap-2">
              <Icon className="h-4 w-4" /> {label} <span className="font-ethiopic opacity-70">({amharic})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map(({ key, label, color }) => (
          <TabsContent key={key} value={key}>
            <div className="space-y-4">
              {data[key].length === 0 && !editMode && (
                <Card className="rounded-3xl"><CardContent className="py-12 text-center text-muted-foreground">No {label.toLowerCase()} yet.</CardContent></Card>
              )}
              {data[key].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 shadow-lg overflow-hidden">
                    <CardContent className="p-6">
                      {editMode ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Input value={item.title} placeholder="Title"
                              onChange={(e) => updateItem(key, i, 'title', e.target.value)} className="font-bold" />
                            <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => removeItem(key, i)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <Textarea rows={3} value={item.content} placeholder="Content"
                            onChange={(e) => updateItem(key, i, 'content', e.target.value)} />
                        </div>
                      ) : (
                        <>
                          <h3 className={`font-black text-xl mb-2 ${color}`}>{item.title}</h3>
                          <p className="text-[#0D2440]/70 dark:text-white/70 leading-relaxed font-medium italic">{item.content}</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {editMode && (
                <Button variant="outline" onClick={() => addItem(key)} className="gap-2">
                  <Plus className="h-4 w-4" /> Add {label.replace(/s$/, '')}
                </Button>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ChurchLaws;
