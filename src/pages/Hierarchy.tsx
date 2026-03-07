import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, ChevronDown, ChevronRight, Users, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';

interface HierarchyNode {
  id: string;
  name: string;
  level: string;
  members: number;
  children?: HierarchyNode[];
}

const hierarchyData: HierarchyNode = {
  id: '1',
  name: 'Ethiopian Orthodox Tewahedo Church',
  level: 'Sinodos',
  members: 1,
  children: [
    {
      id: '2',
      name: 'KuamiSinodos',
      level: 'KuamiSinodos',
      members: 1,
      children: [
        {
          id: '3',
          name: 'Memriya Council',
          level: 'Memriya',
          members: 1,
          children: [
            {
              id: '4',
              name: 'Zone - East Shewa',
              level: 'Zone',
              members: 15,
              children: [
                {
                  id: '5',
                  name: 'St. Mary Church',
                  level: 'Atbiya',
                  members: 150,
                },
                {
                  id: '6',
                  name: 'St. George Church',
                  level: 'Atbiya',
                  members: 200,
                },
              ],
            },
            {
              id: '7',
              name: 'Zone - West Shewa',
              level: 'Zone',
              members: 12,
              children: [
                {
                  id: '8',
                  name: 'St. Michael Church',
                  level: 'Atbiya',
                  members: 180,
                },
              ],
            },
            {
              id: '9',
              name: 'Zone - North Shewa',
              level: 'Zone',
              members: 18,
              children: [
                {
                  id: '10',
                  name: 'St. Trinity Church',
                  level: 'Atbiya',
                  members: 220,
                },
                {
                  id: '11',
                  name: 'St. Gabriel Church',
                  level: 'Atbiya',
                  members: 160,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const HierarchyTreeNode = ({ node, depth = 0 }: { node: HierarchyNode; depth?: number }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const levelColors: Record<string, string> = {
    Sinodos: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    KuamiSinodos: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    Memriya: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Zone: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Atbiya: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.1 }}
      className="relative"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={`group flex items-center gap-4 p-5 rounded-[1.5rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 hover:shadow-2xl hover:shadow-[#2E5E99]/10 transition-all duration-500 ${depth === 0 ? 'ring-2 ring-[#2E5E99]/20' : ''
            }`}
          style={{ marginLeft: `${depth * 28}px` }}
        >
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-[#2E5E99]/10 text-[#2E5E99]">
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              </Button>
            </CollapsibleTrigger>
          )}
          {!hasChildren && <div className="w-10" />}

          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#204a7c] to-[#2E5E99] rounded-xl blur opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-[#204a7c]/10 to-[#2E5E99]/10 border border-[#2E5E99]/20">
                  <Network className="h-5 w-5 text-[#2E5E99]" />
                </div>
              </div>
              <div>
                <p className="text-lg font-black text-[#0D2440] dark:text-white tracking-tight">{node.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border-2 ${levelColors[node.level] || ''}`}
                  >
                    {t(node.level.toLowerCase() as any)}
                  </Badge>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#2E5E99]/60">
                    <Users className="h-3.5 w-3.5" />
                    {node.members.toLocaleString()} {t('members')}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" className="h-10 px-6 rounded-xl border-[#2E5E99]/20 text-[#2E5E99] font-bold hover:bg-[#2E5E99] hover:text-white transition-all shadow-lg active:scale-95">
              {t('viewDetails')}
            </Button>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 mt-3 overflow-hidden"
                >
                  {node.children!.map((child) => (
                    <HierarchyTreeNode key={child.id} node={child} depth={depth + 1} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        )}
      </Collapsible>
    </motion.div>
  );
};

const Hierarchy = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-12 animate-in fade-in duration-700 ease-out pb-20">
      <PageHeader
        title={t('hierarchy')}
        description={t('hierarchyHeaderDesc')}
        badge="Unity & Order"
      />

      <div className="relative py-12 px-8 rounded-[3rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/60 dark:border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Network className="h-64 w-64 rotate-12" />
        </div>

        <div className="relative space-y-4">
          <HierarchyTreeNode node={hierarchyData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Divine Structure', val: '1 Sinodos → 1 Memriya', sub: t('organizationalUnity'), color: 'text-indigo-500' },
          { label: 'Total Zones', val: '3', sub: 'Regional administrative zones', color: 'text-[#2E5E99]' },
          { label: 'Total Churches', val: '5', sub: 'Active Atbiya level churches', color: 'text-[#2E5E99]' },
          { label: 'Active Souls', val: '956', sub: 'Total registered members', color: 'text-rose-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          >
            <Card className="h-full rounded-[2rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 p-6 hover:shadow-xl transition-all duration-300">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60 mb-2">{stat.label}</h3>
              <p className={`text-2xl font-black ${stat.color} mb-1`}>{stat.val}</p>
              <p className="text-xs font-semibold text-[#0D2440]/60 dark:text-white/40">{stat.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Hierarchy;
