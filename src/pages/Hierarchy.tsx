import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, ChevronDown, Building2, ScrollText, CheckCircle2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { motion, AnimatePresence } from 'framer-motion';
import { CHURCH_STRUCTURE, type StructureNode } from '@/data/churchStructure';

const DEPTH_COLORS = [
  'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  'bg-blue-500/10 text-blue-500 border-blue-500/30',
  'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  'bg-amber-500/10 text-amber-600 border-amber-500/30',
  'bg-rose-500/10 text-rose-500 border-rose-500/30',
];

function countNodes(node: StructureNode): number {
  return 1 + (node.children?.reduce((sum, c) => sum + countNodes(c), 0) ?? 0);
}

const HierarchyTreeNode = ({
  node, depth, onSelect,
}: {
  node: StructureNode;
  depth: number;
  onSelect: (n: StructureNode) => void;
}) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = !!node.children?.length;
  const colorClass = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.05 }}
      className="relative"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={`group flex items-center gap-3 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/60 dark:border-white/10 hover:shadow-xl hover:shadow-[#2E5E99]/10 transition-all duration-300 ${depth === 0 ? 'ring-2 ring-[#2E5E99]/20' : ''}`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl hover:bg-[#2E5E99]/10 text-[#2E5E99]">
                <motion.div animate={{ rotate: isOpen ? 0 : -90 }}>
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-9" />
          )}

          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#204a7c]/10 to-[#2E5E99]/10 border border-[#2E5E99]/20">
                  <Building2 className="h-5 w-5 text-[#2E5E99]" />
                </div>
              </div>
              <div>
                <p className="text-base sm:text-lg font-black text-[#0D2440] dark:text-white tracking-tight font-ethiopic">
                  {node.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-semibold text-[#2E5E99]/70">{node.nameEn}</span>
                  {node.article && (
                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${colorClass}`}>
                      {node.article}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => onSelect(node)}
              className="h-9 px-4 rounded-xl border-[#2E5E99]/20 text-[#2E5E99] text-xs font-bold hover:bg-[#2E5E99] hover:text-white transition-all shrink-0"
            >
              <ScrollText className="h-3.5 w-3.5 mr-1.5" />
              Roles ({node.roles.length})
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
                    <HierarchyTreeNode key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
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
  const [selected, setSelected] = useState<StructureNode | null>(null);

  const totalStructures = countNodes(CHURCH_STRUCTURE);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 ease-out pb-20">
      <PageHeader
        title={t('hierarchy')}
        description="The official organizational structure of the Ahaw Orthodox Tehadiso Church, per the church bylaws (መተዳደሪያ ደንብ, Article 10)."
        badge="Unity & Order"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Structures', val: String(totalStructures), sub: 'Bodies in the org chart' },
          { label: 'Governing Document', val: 'ቁ. 001/2018', sub: '5th revised bylaws' },
          { label: 'Top Body', val: 'ሲኖዶስ', sub: 'Supreme assembly' },
          { label: 'Base Unit', val: 'አጥቢያ', sub: 'Local parish church' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
            <Card className="h-full rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-white/60 dark:border-white/10 p-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[#2E5E99]/60 mb-1.5">{stat.label}</h3>
              <p className="text-xl font-black text-[#2E5E99] mb-0.5 font-ethiopic">{stat.val}</p>
              <p className="text-[11px] font-semibold text-[#0D2440]/60 dark:text-white/40">{stat.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="relative py-8 px-4 sm:px-8 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/60 dark:border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Network className="h-56 w-56 rotate-12" />
        </div>
        <div className="relative space-y-3">
          <HierarchyTreeNode node={CHURCH_STRUCTURE} depth={0} onSelect={setSelected} />
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-ethiopic text-2xl">{selected.name}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selected.nameEn}{selected.article ? ` · ${selected.article}` : ''}
                </p>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <p className="text-xs font-black uppercase tracking-widest text-[#2E5E99]/70">
                  Powers & Duties (ሥልጣንና ተግባር)
                </p>
                {selected.roles.map((role, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-[#2E5E99]/5 border border-[#2E5E99]/10">
                    <CheckCircle2 className="h-4 w-4 text-[#2E5E99] mt-0.5 shrink-0" />
                    <p className="text-sm text-[#0D2440]/80 dark:text-white/80 leading-relaxed">{role}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Hierarchy;
