import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Church, Landmark, Loader2, MapPin, Phone,
  Save, Users as UsersIcon, UserPlus,
} from 'lucide-react';
import {
  hierarchyService, emptyAtbiya, type Atbiya, type AtbiyaInput,
} from '@/services/hierarchy';
import { userService } from '@/services/users';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { MembershipRequests } from '@/components/MembershipRequests';
import { MahderatManager } from '@/components/MahderatManager';
import { AtbiyaForm } from '@/components/AtbiyaForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User } from '@/types';

/**
 * The parish console.
 *
 * Where a parish administrator lands after signing in: the membership requests
 * waiting on them, who already belongs to the parish, and the parish's own
 * record. Everything here is scoped to `myAtbiyaId` — the same value
 * `firestore.rules` compares against, so the page can never offer an action the
 * server would reject.
 */
const MyAtbiya: React.FC = () => {
  const { user } = useAuth();
  const { can, isSuperAdmin, myAtbiyaId, myScope, roleLabel, isApproverRole } = usePermissions();
  const { t } = useLanguage();
  const a = t.admin;

  const [atbiya, setAtbiya] = useState<Atbiya | null>(null);
  const [draft, setDraft] = useState<AtbiyaInput>(emptyAtbiya());
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const belongsToParish = !!myAtbiyaId;
  const mayBeHere =
    isSuperAdmin || myScope === 'atbiya' || can('canApproveMembers') || can('canEditOwnAtbiya');
  const mayEdit = isSuperAdmin || can('canEditOwnAtbiya') || can('canManageAtbiyas');

  const load = useCallback(async () => {
    if (!myAtbiyaId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const found = await hierarchyService.getAtbiyaById(myAtbiyaId);
      setAtbiya(found);
      if (found) {
        const { id, level, ...rest } = found;
        setDraft({ ...emptyAtbiya(), ...rest });
      }
    } catch {
      setError(a.congregationLoadFailed);
      setAtbiya(null);
    } finally {
      setLoading(false);
    }
  }, [myAtbiyaId, a]);

  const loadMembers = useCallback(async () => {
    if (!myAtbiyaId) return;
    setMembersLoading(true);
    try {
      setMembers(await userService.getUsersByAtbiya(myAtbiyaId) as User[]);
    } catch {
      // Ordering by fullNameEnglish drops accounts that lack the field, and the
      // directory permission may be missing entirely — neither is worth an
      // error banner over the requests queue, which is the point of this page.
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, [myAtbiyaId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!atbiya) return;
    if (!draft.name.trim()) return setError(a.englishNameRequired);
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      // `level` and `parentId` are never sent: the rules reject a parish leader
      // changing either, and sending them unchanged would still trip the
      // affectedKeys() check on some Firestore versions.
      const { parentId, ...rest } = draft;
      await hierarchyService.updateAtbiya(atbiya.id, { ...rest, name: draft.name.trim() });
      setNotice(a.congregationSaved);
      await load();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied'
        ? a.permissionDenied
        : e instanceof Error ? e.message : a.congregationSaveFailed);
    } finally {
      setSaving(false);
    }
  }

  if (!mayBeHere || !belongsToParish) {
    return (
      <div className="space-y-6">
        <ConfigurablePageHeader
          module="hierarchy"
          defaultTitle={a.myCongregationTitle}
          defaultDescription={a.myCongregationDesc}
          badge={a.congregationBadge}
        />
        <SectionCard title={a.noCongregationTitle} icon={Church}>
          <p className="text-muted-foreground">
            {belongsToParish
              ? a.noCongregationRole
              : a.noCongregationLink}
          </p>
        </SectionCard>
      </div>
    );
  }

  const filteredMembers = members.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [m.fullNameEnglish, m.fullNameAmharic, m.username, m.phone, m.email]
      .join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <ConfigurablePageHeader
        module="hierarchy"
        defaultTitle={atbiya?.name ? `${atbiya.name}` : a.myCongregationTitle}
        defaultDescription={a.myCongregationDesc}
        badge={a.congregationBadge}
      />

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !atbiya ? (
        <SectionCard title={a.congregationNotFound} icon={Church}>
          <p className="text-muted-foreground">
            {a.congregationNotFoundDesc}
          </p>
        </SectionCard>
      ) : (
        <>
          {/* At-a-glance parish identity, so the administrator can see which
              parish they are acting for without opening the Profile tab. */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 flex-wrap">
                <Church className="h-5 w-5" />
                {atbiya.name}
                {atbiya.nameAmharic && (
                  <span className="text-base font-normal text-muted-foreground font-ethiopic">
                    {atbiya.nameAmharic}
                  </span>
                )}
                {atbiya.active === false && <Badge variant="outline" className="text-[10px]">{a.inactive}</Badge>}
                {atbiya.isPublic === false && (
                  <Badge variant="secondary" className="text-[10px]">{a.hidden}</Badge>
                )}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {(atbiya.address?.en || atbiya.cityEn) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> {atbiya.address?.en || atbiya.cityEn}
                  </span>
                )}
                {atbiya.contact?.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3" /> {atbiya.contact.phone}
                  </span>
                )}
                {(atbiya.bankAccounts ?? []).length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Landmark className="h-3 w-3" /> {(atbiya.bankAccounts ?? []).length} {a.bankAccountCount}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  {a.signedInAs} {user?.fullName ?? user?.username} · {roleLabel(user?.hierarchyLevel)}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>

          <Tabs defaultValue="requests" onValueChange={(v) => {
            if (v === 'members' && members.length === 0) loadMembers();
          }}>
            <TabsList className="mb-6 w-full flex-wrap h-auto">
              <TabsTrigger value="requests" className="flex-1 gap-2">
                <UserPlus className="h-4 w-4" /> {a.tabRequests}
              </TabsTrigger>
              <TabsTrigger value="members" className="flex-1 gap-2">
                <UsersIcon className="h-4 w-4" /> {a.tabMembers}
              </TabsTrigger>
              <TabsTrigger value="mahderat" className="flex-1 gap-2">
                <UsersIcon className="h-4 w-4" /> {a.tabMahderat}
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-1 gap-2">
                <Church className="h-4 w-4" /> {a.tabDetails}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests">
              {isApproverRole(user?.hierarchyLevel) || can('canApproveMembers') || isSuperAdmin ? (
                <MembershipRequests />
              ) : (
                <SectionCard title={a.notApprover} icon={UserPlus}>
                  <p className="text-muted-foreground">
                    {a.notApproverDesc}
                  </p>
                </SectionCard>
              )}
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>{a.membersOf}{atbiya.name} — {a.tabMembers}</CardTitle>
                  <CardDescription>
                    {a.membersOfDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder={a.searchMembers}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  {membersLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <UsersIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">
                        {members.length === 0 ? a.noMembersYet : a.noMemberMatch}
                      </p>
                      <p className="text-sm">
                        {members.length === 0
                          ? a.noMembersYetDesc
                          : a.noMemberMatchDesc}
                      </p>
                    </div>
                  ) : filteredMembers.map((m) => {
                    const status = m.status ?? 'active';
                    return (
                      <div key={m.id}
                        className="p-3 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-[200px] space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{m.fullNameEnglish ?? m.fullName ?? m.username}</span>
                            {m.fullNameAmharic && (
                              <span className="text-sm text-muted-foreground font-ethiopic">{m.fullNameAmharic}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            @{m.username}{m.phone ? ` · ${m.phone}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{roleLabel(m.hierarchyLevel)}</Badge>
                          <Badge
                            className={`text-[10px] ${
                              status === 'active' ? 'bg-emerald-600 hover:bg-emerald-600'
                              : status === 'pending' ? 'bg-amber-500 hover:bg-amber-500'
                              : 'bg-muted-foreground hover:bg-muted-foreground'}`}
                          >
                            {status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mahderat">
              <Card>
                <CardHeader>
                  <CardTitle>{a.mahderatTitle}{atbiya.name} — {a.tabMahderat}</CardTitle>
                  <CardDescription>
                    {a.mahderatDesc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MahderatManager
                    atbiyaId={atbiya.id}
                    atbiyaName={atbiya.name}
                    canEdit={mayEdit}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{a.tabDetails}</CardTitle>
                    <CardDescription>
                      {a.detailsPublicNote}
                      {!mayEdit && ` ${a.detailsReadOnly}`}
                    </CardDescription>
                  </div>
                  {mayEdit && (
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      {a.save}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Zone placement and the public-visibility switches are head
                      office decisions — the rules reject a parish changing
                      parentId, so the fields are not offered here. */}
                  <AtbiyaForm
                    draft={draft}
                    setDraft={setDraft}
                    zones={[]}
                    showPlacement={false}
                    showVisibility={false}
                    disabled={!mayEdit || saving}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default MyAtbiya;
