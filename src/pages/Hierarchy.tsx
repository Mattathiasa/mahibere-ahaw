import { useState } from 'react';
import { SectionCard } from '@/components/ui/SectionCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  const levelColors: Record<string, string> = {
    Sinodos: 'bg-purple-100 text-purple-800 border-purple-200',
    KuamiSinodos: 'bg-blue-100 text-blue-800 border-blue-200',
    Memriya: 'bg-green-100 text-green-800 border-green-200',
    Zone: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Atbiya: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  return (
    <div className="animate-fade-in">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border hover:shadow-md transition-all ${
            depth === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {hasChildren && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          )}
          {!hasChildren && <div className="w-8" />}

          <div className="flex-1 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{node.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={`text-xs ${levelColors[node.level] || ''}`}
                  >
                    {node.level}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {node.members} members
                  </span>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
        </div>

        {hasChildren && (
          <CollapsibleContent className="space-y-2 mt-2">
            {node.children!.map((child) => (
              <HierarchyTreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
};

const Hierarchy = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Church Hierarchy</h1>
        <p className="text-muted-foreground mt-1">
          Visual representation of the organizational structure
        </p>
      </div>

      <SectionCard
        title="Organization Structure"
        description="Expand nodes to see the complete hierarchy from Sinodos to Atbiya"
        icon={Network}
      >
        <div className="space-y-2">
          <HierarchyTreeNode node={hierarchyData} />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Structure</h3>
          <p className="text-sm text-muted-foreground mt-1">1 Sinodos → 1 KuamiSinodos → 1 Memriya</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Total Zones</h3>
          <p className="text-3xl font-bold text-primary">3</p>
          <p className="text-sm text-muted-foreground mt-1">Regional zones</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Total Churches</h3>
          <p className="text-3xl font-bold text-primary">5</p>
          <p className="text-sm text-muted-foreground mt-1">Atbiya churches</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-semibold mb-2">Total Members</h3>
          <p className="text-3xl font-bold text-primary">956</p>
          <p className="text-sm text-muted-foreground mt-1">Active members</p>
        </div>
      </div>
    </div>
  );
};

export default Hierarchy;
