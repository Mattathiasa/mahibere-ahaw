import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Church, Landmark, Loader2, MapPin, Network, Save, X } from 'lucide-react';
import { hierarchyService, atbiyaCoords, type Atbiya } from '@/services/hierarchy';
import { mahderatService, mahderCoords, type Mahder } from '@/services/mahderat';
import { orgUnitService, orgUnitCoords, type OrgUnit } from '@/services/orgUnits';
import { ChurchMapCanvas, type MapPoint } from '@/components/ChurchMapCanvas';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { centroidOf, splitByPinned, type LatLng } from '@/lib/geo';
import { PIN_COLORS } from '@/lib/mapIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

/**
 * The whole structure on one map: head office, dioceses, congregations and
 * fellowship groups — and the worklist of everything still missing a pin.
 *
 * As much a data-completeness tool as a map. The registry had 31 congregations
 * and no coordinates at all, so the number that matters to whoever maintains it
 * is how many are still unplaced — and placing them from here, rather than
 * opening 31 separate parish dialogs, is the point of the page.
 *
 * Congregation coordinates live in `atbiyaPrivate` (see services/hierarchy.ts),
 * which only admins, head office and a parish's own leadership may read. This
 * page is gated on `canManageAtbiyas`, which is that same audience, so the
 * private read below is expected to succeed — and when it does not, that is
 * reported rather than rendered as "nothing is pinned".
 *
 * Dioceses and the head office keep their pins on the PUBLIC hierarchy document,
 * which is a deliberate difference: an office is a public-facing address, not a
 * national dataset of every congregation's precise location.
 */

/** A unit's display name, Amharic first, as the registry does it. */
const parishName = (a: Atbiya) => a.nameAmharic || a.name;
const unitName = (u: OrgUnit) => u.nameAmharic || u.name;

const ChurchMap: React.FC = () => {
  const { t } = useLanguage();
  const a = t.admin;

  const [parishes, setParishes] = useState<Atbiya[]>([]);
  const [groups, setGroups] = useState<Mahder[]>([]);
  const [dioceses, setDioceses] = useState<OrgUnit[]>([]);
  const [headOffices, setHeadOffices] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * Set when the private read was refused. Without this the page would show every
   * congregation as unpinned, which reads as a fact about the registry rather than
   * a fact about the reader's permissions.
   */
  const [pinsUnreadable, setPinsUnreadable] = useState(false);

  const [showHeadOffice, setShowHeadOffice] = useState(true);
  const [showDioceses, setShowDioceses] = useState(true);
  const [showParishes, setShowParishes] = useState(true);
  /**
   * Off by default, and the only layer that costs a query per congregation. See
   * the lazy load below.
   */
  const [showGroups, setShowGroups] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);

  /** The congregation being placed, and where its pin currently sits. */
  const [placingId, setPlacingId] = useState<string | null>(null);
  const [draftPin, setDraftPin] = useState<LatLng | null>(null);
  const [saving, setSaving] = useState(false);

  /** Congregations plus their private half, which is where the pin lives. */
  const readParishes = useCallback(async () => {
    // Merged here rather than via getAtbiyasWithPrivate so the page can see
    // whether the private read was REFUSED, not merely empty.
    const [publicList, priv] = await Promise.all([
      hierarchyService.getAtbiyas(true),
      hierarchyService.getAtbiyaPrivateMap(),
    ]);
    setPinsUnreadable(priv.denied);
    setParishes(publicList.map((p) => ({ ...p, ...(priv.byId.get(p.id) ?? {}) })));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        readParishes(),
        orgUnitService.listByLevel('Zone', true)
          .then(setDioceses)
          .catch(() => setDioceses([])),
        orgUnitService.listByLevel('Teklay', true)
          .then(setHeadOffices)
          .catch(() => setHeadOffices([])),
      ]);
    } finally {
      setLoading(false);
    }
  }, [readParishes]);

  useEffect(() => { load(); }, [load]);

  /**
   * Fellowship groups cost one query per congregation — there is no way to list
   * them in a single read, because they are `hierarchy` documents keyed by their
   * parish. So they are fetched only once somebody actually asks for the layer,
   * and kept thereafter. Previously this ran on every page load and again after
   * every pin save, serially, which is tens of round-trips nobody asked for.
   */
  useEffect(() => {
    if (!showGroups || groupsLoaded || parishes.length === 0) return;
    let cancelled = false;
    setGroupsLoading(true);
    Promise.all(
      parishes.map((p) =>
        mahderatService.listByCongregation(p.id, true).catch(() => [] as Mahder[])
      )
    )
      .then((lists) => {
        if (cancelled) return;
        setGroups(lists.flat());
        setGroupsLoaded(true);
      })
      .finally(() => { if (!cancelled) setGroupsLoading(false); });
    return () => { cancelled = true; };
  }, [showGroups, groupsLoaded, parishes]);

  const dioceseName = useCallback(
    (id?: string | null) => {
      if (!id) return a.notAssigned;
      const d = dioceses.find((z) => z.id === id);
      return d ? unitName(d) : a.notAssigned;
    },
    [dioceses, a.notAssigned]
  );

  const { pinned, unpinned } = useMemo(
    () => splitByPinned(parishes.map((p) => ({ ...p, ...(atbiyaCoords(p) ?? {}) }))),
    [parishes]
  );

  /**
   * Where each diocese sits, and whether that is a real pin or an estimate.
   *
   * A diocese nobody has placed is drawn at the centre of its own congregations,
   * so the map is useful before that data-entry work is done. The estimate is
   * marked as one — both in its colour and in its popup — because a marker that
   * looks surveyed but was averaged is worse than an honest gap.
   */
  const diocesePlacements = useMemo(
    () =>
      dioceses.map((d) => {
        const own = orgUnitCoords(d);
        if (own) return { unit: d, at: own, approx: false };
        const members = parishes
          .filter((p) => p.parentId === d.id)
          .map(atbiyaCoords)
          .filter((c): c is LatLng => c !== null);
        return { unit: d, at: centroidOf(members), approx: true };
      }),
    [dioceses, parishes]
  );

  const points = useMemo<MapPoint[]>(() => {
    const out: MapPoint[] = [];

    if (showHeadOffice) {
      for (const h of headOffices) {
        const at = orgUnitCoords(h);
        if (!at) continue;
        out.push({
          id: h.id,
          lat: at.lat,
          lng: at.lng,
          kind: 'teklay',
          title: unitName(h),
          subtitle: h.location || undefined,
          muted: h.active === false,
          detail: (
            <Link to="/organisation?tab=teklay" className="text-xs text-primary underline">
              {a.openInRegistry}
            </Link>
          ),
        });
      }
    }

    if (showDioceses) {
      for (const { unit, at, approx } of diocesePlacements) {
        if (!at) continue;
        out.push({
          id: unit.id,
          lat: at.lat,
          lng: at.lng,
          kind: approx ? 'zoneApprox' : 'zone',
          title: unitName(unit),
          subtitle: unit.location || undefined,
          muted: unit.active === false,
          detail: (
            <div className="space-y-1 pt-1">
              {approx && (
                <p className="text-[11px] text-muted-foreground">{a.approxPosition}</p>
              )}
              <Link to="/organisation?tab=zone" className="text-xs text-primary underline">
                {a.openInRegistry}
              </Link>
            </div>
          ),
        });
      }
    }

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
          detail: (
            <Link to="/organisation?tab=mahderat" className="text-xs text-primary underline">
              {a.openInRegistry}
            </Link>
          ),
        });
      }
    }

    return out;
  }, [
    parishes, groups, headOffices, diocesePlacements,
    showParishes, showGroups, showDioceses, showHeadOffice,
    placingId, dioceseName, a,
  ]);

  /** Counts for the summary strip, one row per level. */
  const stats = useMemo(() => {
    const placedDioceses = diocesePlacements.filter((d) => !d.approx).length;
    const placedGroups = groups.filter((g) => mahderCoords(g) !== null).length;
    return [
      { key: 'zone', icon: Building2, color: 'text-[#40A8B1]', label: a.statDioceses,
        total: dioceses.length, placed: placedDioceses },
      { key: 'atbiya', icon: Church, color: 'text-[#2E5E99]', label: a.statParishes,
        total: parishes.length, placed: pinned.length },
      { key: 'mahder', icon: Network, color: 'text-[#7BA4D0]', label: a.statGroups,
        total: groupsLoaded ? groups.length : null, placed: placedGroups },
    ];
  }, [dioceses, diocesePlacements, parishes, pinned, groups, groupsLoaded, a]);

  /** Everything with no position at all, so the map's silence is accounted for. */
  const gaps = useMemo(() => {
    const unplacedDioceses = diocesePlacements.filter((d) => d.at === null).map((d) => d.unit);
    const unplacedOffices = headOffices.filter((h) => orgUnitCoords(h) === null);
    return { unplacedDioceses, unplacedOffices };
  }, [diocesePlacements, headOffices]);

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
      // Only the congregations changed. Re-reading the dioceses, the head office
      // and every congregation's groups after each pin was the bulk of the wait.
      await readParishes();
    } catch {
      toast.error(a.pinSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  const legend = (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {a.mapLegend}
      </p>
      {[
        { color: PIN_COLORS.teklay, label: a.layerHeadOffice, on: showHeadOffice },
        { color: PIN_COLORS.zone, label: a.layerDioceses, on: showDioceses },
        { color: PIN_COLORS.zoneApprox, label: a.approxBadge, on: showDioceses },
        { color: PIN_COLORS.atbiya, label: a.layerParishes, on: showParishes },
        { color: PIN_COLORS.mahder, label: a.layerMahderat, on: showGroups },
      ]
        .filter((row) => row.on)
        .map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full border border-white/70 shrink-0"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-[11px] font-ethiopic">{row.label}</span>
          </div>
        ))}
    </div>
  );

  const layerSwitches = [
    { id: 'layer-head-office', icon: Landmark, label: a.layerHeadOffice, on: showHeadOffice, set: setShowHeadOffice, hint: undefined },
    { id: 'layer-dioceses', icon: Building2, label: a.layerDioceses, on: showDioceses, set: setShowDioceses, hint: undefined },
    { id: 'layer-parishes', icon: Church, label: a.layerParishes, on: showParishes, set: setShowParishes, hint: undefined },
    { id: 'layer-groups', icon: Network, label: a.layerMahderat, on: showGroups, set: setShowGroups, hint: a.showGroupsHint },
  ];

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.key} className="p-4 rounded-xl border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.total ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground">
              {s.total === null
                ? a.showGroupsHint
                : a.statPlacedOf
                    .replace('{placed}', String(s.placed))
                    .replace('{total}', String(s.total))}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-muted/20 p-4">
        {layerSwitches.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <Switch id={l.id} checked={l.on} onCheckedChange={l.set} />
            <Label htmlFor={l.id} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
              <l.icon className="h-3.5 w-3.5" /> {l.label}
              {l.id === 'layer-groups' && groupsLoading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </Label>
          </div>
        ))}

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
        // Tall enough to frame the whole country, with a floor so it stays usable
        // on a short laptop and a ceiling so it does not dwarf the panels below.
        // A CSS clamp rather than a measured pixel height, so a resize or a
        // rotation is handled without re-rendering.
        <ChurchMapCanvas
          points={points}
          legend={legend}
          height="clamp(520px, 68vh, 900px)"
          placing={placingParish ? { id: placingParish.id, title: parishName(placingParish), at: draftPin } : null}
          onPlace={setDraftPin}
        />
      )}

      {(unpinned.length > 0 || gaps.unplacedDioceses.length > 0 || gaps.unplacedOffices.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {a.gapsTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">{a.gapsHint}</p>

            {gaps.unplacedOffices.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {a.layerHeadOffice}
                </p>
                <div className="flex flex-wrap gap-2">
                  {gaps.unplacedOffices.map((h) => (
                    <Link key={h.id} to="/organisation?tab=teklay">
                      <Badge variant="outline" className="font-ethiopic text-[11px] cursor-pointer">
                        {unitName(h)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {gaps.unplacedDioceses.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {a.layerDioceses}
                </p>
                <div className="flex flex-wrap gap-2">
                  {gaps.unplacedDioceses.map((d) => (
                    <Link key={d.id} to="/organisation?tab=zone">
                      <Badge variant="outline" className="font-ethiopic text-[11px] cursor-pointer">
                        {unitName(d)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {unpinned.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {a.layerParishes}
                </p>
                <p className="text-xs text-muted-foreground">{a.needsPinHint}</p>
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
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ChurchMap;
