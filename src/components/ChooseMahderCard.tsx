import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, Check, CheckCircle2, Clock, Loader2, MapPin, Users, X,
} from 'lucide-react';
import { mahderatService, mahderCoords, type Mahder } from '@/services/mahderat';
import { byDistanceFrom, formatDistance, hasCoords, type LatLng } from '@/lib/geo';
import { userService } from '@/services/users';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LocationPicker } from '@/components/LocationPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';

/**
 * Helps a newly approved member join the Mahedher nearest their home.
 *
 * Deliberately shown here rather than during sign-up: the group pins are often
 * people's houses, and the sign-up form runs unauthenticated, so anything it
 * reads is world-readable. By this point the member is approved and signed in,
 * and `firestore.rules` already restricts these documents to active accounts.
 *
 * Sign-up captures only the member's own home pin (inside their existing
 * `address` map), which is what this ranks against.
 */
export const ChooseMahderCard: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const a = t.admin;

  const [groups, setGroups] = useState<Mahder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState<string>('');
  const [home, setHome] = useState<LatLng | null>(
    hasCoords(user?.address) ? { lat: user!.address!.lat!, lng: user!.address!.lng! } : null
  );
  const [savingHome, setSavingHome] = useState(false);
  const [homeSaved, setHomeSaved] = useState(false);

  const atbiyaId = user?.atbiyaId ?? '';

  const load = useCallback(async () => {
    if (!atbiyaId) { setLoading(false); return; }
    setLoading(true);
    try {
      setGroups(await mahderatService.listByCongregation(atbiyaId));
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [atbiyaId]);

  useEffect(() => { load(); }, [load]);

  // Nothing to offer: not approved, no congregation, already in a group, or
  // the congregation has not created any.
  const applicable =
    !!user && (user.status ?? 'active') === 'active' && !!atbiyaId && !user.mahderatId;

  if (!applicable || dismissed) return null;
  if (!loading && groups.length === 0) return null;

  const ranked = home
    ? byDistanceFrom(home, groups.map((g) => ({ ...g, ...(mahderCoords(g) ?? {}) })))
    : groups.map((g) => ({ ...g, km: null as number | null }));

  const nearestId = ranked.find((g) => g.km !== null)?.id ?? '';
  const selected = choice || nearestId || ranked[0]?.id || '';

  async function saveHome() {
    if (!user || !home) return;
    setSavingHome(true);
    setError(null);
    try {
      // Merged into the existing address map, so nothing else on it is lost.
      await userService.updateUser(user.id, {
        address: { ...(user.address ?? {}), lat: home.lat, lng: home.lng },
      });
      setHomeSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : a.saveLocationFailed);
    } finally {
      setSavingHome(false);
    }
  }

  async function join() {
    if (!user || !selected) return;
    setSaving(true);
    setError(null);
    try {
      await mahderatService.joinAsMember(user.id, selected);
      // AuthContext reads the user document once, at sign-in, so `user`
      // still says no group. Dismissing is the honest local signal; the next
      // load picks up the stored value.
      setDismissed(true);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied'
        ? a.joinDenied
        : e instanceof Error ? e.message : a.joinFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-[#2E5E99]/30">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> {a.chooseMahderTitle}
          </CardTitle>
          <CardDescription>
            {home ? a.chooseMahderDescWithHome : a.chooseMahderDescNoHome}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" title={a.notNow}
          onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /><span>{error}</span>
          </div>
        )}

        {!hasCoords(user?.address) && !homeSaved && (
          <div className="space-y-2 p-3 rounded-xl border border-dashed border-[#2E5E99]/30">
            <LocationPicker
              value={home}
              onChange={setHome}
              label={a.whereDoYouLive}
              hint={a.whereDoYouLiveHint}
              height={200}
            />
            {home && (
              <Button size="sm" variant="outline" onClick={saveHome} disabled={savingHome}>
                {savingHome
                  ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  : <CheckCircle2 className="h-4 w-4 mr-1" />}
                {a.saveMyLocation}
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {ranked.map((g) => {
              const active = selected === g.id;
              return (
                <button key={g.id} type="button" onClick={() => setChoice(g.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    active
                      ? 'border-[#2E5E99] bg-[#2E5E99]/5 ring-2 ring-[#2E5E99]/30'
                      : 'border-border hover:border-[#2E5E99]/40'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{g.name}</span>
                        {g.nameAmharic && (
                          <span className="text-sm text-muted-foreground font-ethiopic">{g.nameAmharic}</span>
                        )}
                        {g.id === nearestId && home && (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px]">{a.closest}</Badge>
                        )}
                      </div>
                      {(g.locationLabelAm || g.locationLabel) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> {g.locationLabelAm || g.locationLabel}
                        </p>
                      )}
                      {(g.meetingDay || g.meetingTime) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3 w-3" /> {[g.meetingDay, g.meetingTime].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {g.km !== null && (
                        <span className="text-xs font-bold text-[#2E5E99]">{formatDistance(g.km)}</span>
                      )}
                      {active && <Check className="h-4 w-4 text-[#2E5E99]" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDismissed(true)}>{a.notNow}</Button>
          <Button onClick={join} disabled={saving || !selected}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {a.joinThisMahder}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
