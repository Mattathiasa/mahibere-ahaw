import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, Church, Landmark, Loader2, MapPin, Network, Plus, Users,
} from 'lucide-react';
import { orgUnitService, type OrgUnit } from '@/services/orgUnits';
import { mahderatService, type Mahder } from '@/services/mahderat';
import { hierarchyService, type Atbiya } from '@/services/hierarchy';
import { OrgUnitRegistry } from '@/components/OrgUnitRegistry';
import { CongregationRegistry } from '@/components/CongregationRegistry';
import { StandingSynodRegistry } from '@/components/StandingSynodRegistry';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * The whole organisational structure, one tab per level.
 *
 * A single page rather than six sidebar entries: most levels differ only in
 * what they are called and what they hang off, so they share one registry
 * component, and the sidebar already carries twenty items.
 *
 * Congregations are the exception and keep their own component — bank
 * accounts, administrators, the register importer and Mahedher pins do not
 * generalise — but it renders here as a tab like everything else. Its write
 * permission also differs: `canManageAtbiyas` rather than the isAdmin() the
 * other levels need, which is why it owns that check internally.
 *
 * The active tab lives in `?tab=`, so a link can point at one and the old
 * /atbiya-registry route can redirect straight to the congregations tab.
 */
const Organisation: React.FC = () => {
  const { t } = useLanguage();
  const tx = t.admin;
  const { can, isSuperAdmin, isAdminRole, myRole } = usePermissions();

  /**
   * Registering anything above a congregation is an isAdmin() action in
   * firestore.rules. Anyone who can see the hierarchy may read this page; only
   * an admin gets the write controls.
   */
  const canEdit = isSuperAdmin || isAdminRole(myRole);
  const mayBeHere = canEdit || can('canManageAtbiyas') || can('canViewHierarchy');

  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'synod';
  const setTab = (v: string) => setParams(v === 'synod' ? {} : { tab: v }, { replace: true });

  const [secretariat, setSecretariat] = useState<OrgUnit | null>(null);
  const [dioceses, setDioceses] = useState<OrgUnit[]>([]);
  const [congregations, setCongregations] = useState<Atbiya[]>([]);
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sec, zones, atbiyas, memriyaCounts, woredaCounts, atbiyaCounts, mahderCounts] =
        await Promise.all([
          orgUnitService.getSecretariat().catch(() => null),
          orgUnitService.listByLevel('Zone', true).catch(() => [] as OrgUnit[]),
          hierarchyService.getAtbiyas(true).catch(() => [] as Atbiya[]),
          orgUnitService.childCounts('Memriya').catch(() => ({})),
          orgUnitService.childCounts('Woreda').catch(() => ({})),
          orgUnitService.childCounts('Atbiya').catch(() => ({})),
          orgUnitService.childCounts('Mahderat').catch(() => ({})),
        ]);
      setSecretariat(sec);
      setDioceses(zones);
      setCongregations(atbiyas);
      setCounts({ Memriya: memriyaCounts, Woreda: woredaCounts, Atbiya: atbiyaCounts, Mahderat: mahderCounts });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!mayBeHere) return null;

  const secretariatAsParent = secretariat ? [secretariat] : [];

  return (
    <div className="space-y-6">
      <ConfigurablePageHeader
        module="hierarchy"
        defaultTitle={tx.orgTitle}
        defaultDescription={tx.orgDesc}
        badge={tx.orgBadge}
      />

      {!canEdit && (
        <div className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/20 p-3">
          {tx.orgReadOnly}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6 w-full flex-wrap h-auto">
          <TabsTrigger value="synod" className="flex-1 gap-2">
            <Users className="h-4 w-4" /> {tx.synodTitle}
          </TabsTrigger>
          <TabsTrigger value="teklay" className="flex-1 gap-2">
            <Building2 className="h-4 w-4" /> {tx.levelTeklay}
          </TabsTrigger>
          <TabsTrigger value="zone" className="flex-1 gap-2">
            <Landmark className="h-4 w-4" /> {tx.levelZone}
          </TabsTrigger>
          <TabsTrigger value="woreda" className="flex-1 gap-2">
            <MapPin className="h-4 w-4" /> {tx.levelWoreda}
          </TabsTrigger>
          <TabsTrigger value="atbiya" className="flex-1 gap-2">
            <Church className="h-4 w-4" /> {tx.levelAtbiya}
          </TabsTrigger>
          <TabsTrigger value="mahderat" className="flex-1 gap-2">
            <Network className="h-4 w-4" /> {tx.levelMahderat}
          </TabsTrigger>
        </TabsList>

        {/* ── ቋሚ ሲኖዶስ ── */}
        <TabsContent value="synod">
          <Card>
            <CardHeader>
              <CardTitle>{tx.synodTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <StandingSynodRegistry canEdit={canEdit} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ጠቅላይ ጽሕፈት ቤት + its departments ── */}
        <TabsContent value="teklay" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{tx.levelTeklay}</CardTitle>
              <CardDescription>
                {secretariat ? tx.orgDesc : tx.secretariatNoneDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <OrgUnitRegistry
                  level="Teklay"
                  canEdit={canEdit}
                  childCounts={counts.Memriya}
                  childCountLabel={tx.departmentsUnder}
                  onChanged={load}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tx.levelMemriya}</CardTitle>
              <CardDescription>{tx.orgDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <OrgUnitRegistry
                level="Memriya"
                parents={secretariatAsParent}
                canEdit={canEdit}
                onChanged={load}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ሀገረ ስብከት, with the congregations under each ── */}
        <TabsContent value="zone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{tx.levelZone}</CardTitle>
              <CardDescription>{tx.manageInRegistry}</CardDescription>
            </CardHeader>
            <CardContent>
              <OrgUnitRegistry
                level="Zone"
                parents={secretariatAsParent}
                childCounts={counts.Atbiya}
                childCountLabel={tx.congregationsUnder}
                canEdit={canEdit}
                onChanged={load}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tx.congregationsUnder}</CardTitle>
              <CardDescription>{tx.diocesePlacementDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <DiocesePlacement
                dioceses={dioceses}
                congregations={congregations}
                loading={loading}
                unassignedLabel={tx.notAssigned}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ወረዳ ── */}
        <TabsContent value="woreda">
          <Card>
            <CardHeader>
              <CardTitle>{tx.levelWoreda}</CardTitle>
              <CardDescription>{tx.woredaOfficeHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <OrgUnitRegistry
                level="Woreda"
                parents={dioceses}
                childCounts={counts.Woreda}
                canEdit={canEdit}
                onChanged={load}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── አጥቢያ, the full registry ── */}
        <TabsContent value="atbiya">
          <CongregationRegistry />
        </TabsContent>

        {/* ── ማኅደራት across the whole church ── */}
        <TabsContent value="mahderat">
          <Card>
            <CardHeader>
              <CardTitle>{tx.levelMahderat}</CardTitle>
              <CardDescription>{tx.mahderatAcrossChurch}</CardDescription>
            </CardHeader>
            <CardContent>
              <MahderatOverview congregations={congregations} emptyLabel={tx.noCongregationsForMahderat} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/** Which congregations sit under each Diocese, and which sit under none. */
const DiocesePlacement: React.FC<{
  dioceses: OrgUnit[];
  congregations: Atbiya[];
  loading: boolean;
  unassignedLabel: string;
}> = ({ dioceses, congregations, loading, unassignedLabel }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  const groups = [
    ...dioceses.map((d) => ({
      id: d.id,
      label: d.nameAmharic || d.name,
      items: congregations.filter((c) => c.parentId === d.id),
    })),
    {
      id: '__none',
      label: unassignedLabel,
      items: congregations.filter((c) => !c.parentId || !dioceses.some((d) => d.id === c.parentId)),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.id} className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground font-ethiopic">
            {g.label} <Badge variant="outline" className="ml-1 text-[10px]">{g.items.length}</Badge>
          </p>
          <div className="flex flex-wrap gap-2">
            {g.items.map((c) => (
              <Badge key={c.id} variant="secondary" className="font-ethiopic text-[11px] font-normal">
                {c.nameAmharic || c.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/** Every Mahedher in the church, grouped by the congregation that owns it. */
const MahderatOverview: React.FC<{ congregations: Atbiya[]; emptyLabel: string }> = ({
  congregations, emptyLabel,
}) => {
  const [byCongregation, setByCongregation] = useState<Record<string, Mahder[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const out: Record<string, Mahder[]> = {};
      // Sequential rather than one query per congregation in parallel: the
      // list is read for display only and a burst of reads is not worth it.
      for (const c of congregations) {
        try { out[c.id] = await mahderatService.listByCongregation(c.id, true); }
        catch { out[c.id] = []; }
      }
      if (alive) { setByCongregation(out); setLoading(false); }
    })();
    return () => { alive = false; };
  }, [congregations]);

  if (congregations.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>;
  }
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const withGroups = congregations.filter((c) => (byCongregation[c.id] ?? []).length > 0);

  return (
    <div className="space-y-4">
      {withGroups.map((c) => (
        <div key={c.id} className="space-y-2">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground font-ethiopic">
            {c.nameAmharic || c.name}
            <Badge variant="outline" className="ml-2 text-[10px]">
              {(byCongregation[c.id] ?? []).length}
            </Badge>
          </p>
          <div className="flex flex-wrap gap-2">
            {(byCongregation[c.id] ?? []).map((m) => (
              <Badge key={m.id} variant="secondary"
                className={`font-ethiopic text-[11px] font-normal ${m.active === false ? 'opacity-50' : ''}`}>
                {m.nameAmharic || m.name}
              </Badge>
            ))}
          </div>
        </div>
      ))}
      {withGroups.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center">{emptyLabel}</p>
      )}
    </div>
  );
};

export default Organisation;
