import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Church, Loader2, MapPin, Network, Save, X } from 'lucide-react';
import { hierarchyService, atbiyaCoords, type Atbiya } from '@/services/hierarchy';
import { mahderatService, mahderCoords, type Mahder } from '@/services/mahderat';
import { orgUnitService, type OrgUnit } from '@/services/orgUnits';
import { ChurchMapCanvas, type MapPoint } from '@/components/ChurchMapCanvas';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { splitByPinned, type LatLng } from '@/lib/geo';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

/**
 * Every congregation on one map, and the worklist of the ones still missing a pin.
 *
 * As much a data-completeness tool as a map. The registry had 31 congregations and
 * no coordinates at all, so the number that matters to whoever maintains it is how
 * many are still unplaced — and placing them from here, rather than opening 31
 * separate parish dialogs, is the point of the page.
 *
 * Coordinates live in `atbiyaPrivate` (see services/hierarchy.ts), which only
 * admins, head office and a parish's own leadership may read. This page is gated on
 * `canManageAtbiyas`, which is that same audience, so the private read below is
 * expected to succeed — and when it does not, that is reported rather than
 * rendered as "nothing is pinned".
 */

/** A congregation's display name, Amharic first, as the registry does it. */
const parishName = (a: Atbiya) => a.nameAmharic || a.name;

const ChurchMap: React.FC = () => {
  const { t } = useLanguage();
  const a = t.admin;

  const [parishes, setParishes] = useState<Atbiya[]>([]);
  const [groups, setGroups] = useState<Mahder[]>([]);
  const [dioceses, setDioceses] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * Set when the private read was refused. Without this the page would show every
   * congregation as unpinned, which reads as a fact about the registry rather than
   * a fact about the reader's permissions.
   */
  const [pinsUnreadable, setPinsUnreadable] = useState(false);

  const [showParishes, setShowParishes] = useState(true);
  const [showGroups, setShowGroups] = useState(false);

  /** The congregation being placed, and where its pin currently sits. */
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [draftPin, setDraftPin] = useState<LatLng | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Merged here rather than via getAtbiyasWithPrivate so the page can see
      // whether the private read was REFUSED, not merely empty.
      const [publicList, priv, zones] = await Promise.all([
        hierarchyService.getAtbiyas(true),
        hierarchyService.getAtbiyaPrivateMap(),
        orgUnitService.listByLevel('Zone', true).catch(() => [] as OrgUnit[]),
      ]);

      const merged = publicList.map((p) => ({ ...p, ...(priv.byId.get(p.id) ?? {}) }));
      setPinsUnreadable(priv.denied);
      setParishes(merged);
      setDioceses(zones);

      // Sequential, matching Organisation's MahderatOverview: this is a display
      // read over tens of congregations, not something worth a burst of queries.
      const all: Mahder[] = [];
      for (const p of merged) {
        try { all.push(...(await mahderatService.listByCongregation(p.id, true))); }
        catch { /* a congregation whose groups cannot be read simply adds none */ }
      }
      setGroups(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dioceseName = useCallback(
    (id?: string | null) => {
      if (!id) return a.notAssigned;
      const d = dioceses.find((z) => z.id === id);
      return d ? (d.nameAmharic || d.name) : a.notAssigned;
    },
    [dioceses, a.notAssigned]
  );

  const { pinned, unpinned } = useMemo(
    () => splitByPinned(parishes.map((p) => ({ ...p, ...(atbiyaCoords(p) ?? {}) }))),
    [parishes]
  );

  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];

    if (showParishes) {
      for (const p of parishes) {
        const at = atbiyaCoords(p);
        // The one being placed is drawn from the draft pin instead.
        if (!at || p.id === placingId) continue;
        out.push({
          id: p.id,
          lat: at.lat,
          lng: at.lng,
          kind: 'atbiya',
          title: parishName(p),
          subtitle: p.cityAm || p.cityEn || undefined,
          muted: p.active === false,
          detail: (
            <div className="space-y-1 pt-1">
              <p className="text-xs">{dioceseName(p.parentId)}</p>
              <div className="flex flex-wrap gap-1">
                {p.active === false && <Badge variant="outline" className="text-[10px]">{a.inactive}</Badge>}
                {p.isPublic === false && <Badge variant="outline" className="text-[10px]">{a.unlisted}</Badge>}
              </div>
              <Link to="/organisation?tab=atbiya" className="text-xs text-primary underline">
                {a.openInRegistry}
              </Link>
            </div>
          ),
        });
      }
    }

    if (showGroups) {
      for (const g of groups) {
        const at = mahderCoords(g);
        if (!at) continue;
        const parent = parishes.find((p) => p.id === g.parentId);
        out.push({
          id: g.id,
          lat: at.lat,
          lng: at.lng,
          kind: 'mahder',
          title: g.nameAmharic || g.name,
          subtitle: parent ? parishName(parent) : undefined,
          muted: g.active === false,
        });
      }
    }

    return out;
  }, [parishes, groups, showParishes, showGroups, placingId, dioceseName, a]);

  const placingParish = placingId ? parishes.find((p) => p.id === placingId) ?? null : null;

  function startPlacing(p: Atbiya) {
    setPlacingId(p.id);
    setDraftPin(atbiyaCoords(p));
  }

  function cancelPlacing() {
    setPlacingId(null);
    setDraftPin(null);
  }

  async function savePin() {
    if (!placingId || !draftPin) return;
    setSaving(true);
    try {
      // splitAtbiya sends lat/lng to atbiyaPrivate — see services/hierarchy.ts.
      await hierarchyService.updateAtbiya(placingId, { lat: draftPin.lat, lng: draftPin.lng });
      toast.success(a.pinSaved);
      cancelPlacing();
      await load();
    } catch {
      toast.error(a.pinSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ConfigurablePageHeader
        module="churchMap"
        defaultTitle={a.churchMapTitle}
        defaultDescription={a.churchMapDesc}
        badge={a.churchMapBadge}
      />

      {pinsUnreadable && (
        <div className="text-sm rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          {a.pinsUnreadable}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-2">
          <Switch id="layer-parishes" checked={showParishes} onCheckedChange={setShowParishes} />
          <Label htmlFor="layer-parishes" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Church className="h-3.5 w-3.5" /> {a.layerParishes}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="layer-groups" checked={showGroups} onCheckedChange={setShowGroups} />
          <Label htmlFor="layer-groups" className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
            <Network className="h-3.5 w-3.5" /> {a.layerMahderat}
          </Label>
        </div>

        <div className="flex items-center gap-2 ml-auto text-xs">
          <Badge variant="secondary">{a.pinnedCount.replace('{n}', String(pinned.length))}</Badge>
          <Badge variant={unpinned.length > 0 ? 'destructive' : 'outline'}>
            {a.unpinnedCount.replace('{n}', String(unpinned.length))}
          </Badge>
        </div>
      </div>

      {placingParish && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold font-ethiopic">{parishName(placingParish)}</span>
          <span className="text-xs text-muted-foreground">
            {draftPin
              ? `${draftPin.lat.toFixed(5)}, ${draftPin.lng.toFixed(5)}`
              : a.tapToPlace}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={cancelPlacing} disabled={saving}>
              <X className="h-4 w-4 mr-1" /> {a.cancel}
            </Button>
            <Button size="sm" onClick={savePin} disabled={saving || !draftPin}>
              {saving
                ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                : <Save className="h-4 w-4 mr-1" />}
              {a.save}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <ChurchMapCanvas
          points={points}
          placing={placingParish ? { id: placingParish.id, title: parishName(placingParish), at: draftPin } : null}
          onPlace={setDraftPin}
        />
      )}

      {unpinned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {a.needsPin}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">{a.needsPinHint}</p>
            <div className="flex flex-wrap gap-2">
              {unpinned.map((p) => (
                <Button
                  key={p.id}
                  size="sm"
                  variant={placingId === p.id ? 'default' : 'outline'}
                  className="font-ethiopic text-[11px]"
                  onClick={() => startPlacing(p as Atbiya)}
                >
                  {parishName(p as Atbiya)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChurchMap;
