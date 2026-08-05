import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, Church, Loader2, Pencil, Plus, RefreshCw, ShieldCheck,
  TriangleAlert, Users as UsersIcon,
} from 'lucide-react';
import { hierarchyService, type Atbiya } from '@/services/hierarchy';
import { atbiyaAdminService } from '@/services/atbiyaAdmins';
import { userService } from '@/services/users';
import { usePermissions } from '@/contexts/PermissionContext';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { AtbiyaEditorDialog } from '@/components/AtbiyaEditorDialog';
import { AtbiyaRegistrationDialog } from '@/components/AtbiyaRegistrationDialog';
import { AtbiyaAdminsDialog } from '@/components/AtbiyaAdminsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * The Atbiya (parish) registry.
 *
 * Lives on a normal dashboard route rather than under /admin/* because it is
 * gated on the `canManageAtbiyas` permission, and AdminRoute gates on
 * `isAdminRole` — a role could hold the permission without being an admin role.
 * The in-page gate below is the one that matters.
 */
const AtbiyaRegistry: React.FC = () => {
  const { can, isSuperAdmin, roles, isApproverRole } = usePermissions();
  const { showElement } = useSoftwareControl();

  const canManage = isSuperAdmin || can('canManageAtbiyas');

  const [atbiyas, setAtbiyas] = useState<Atbiya[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [adminCounts, setAdminCounts] = useState<Record<string, number>>({});

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editing, setEditing] = useState<Atbiya | null>(null);
  const [managingAdmins, setManagingAdmins] = useState<Atbiya | null>(null);

  /**
   * Member and administrator counts in one pass over `users`.
   *
   * Advisory only — a failure here leaves the counts at zero rather than
   * blocking the registry, the same way Software Control treats role usage.
   */
  const loadCounts = useCallback(async () => {
    const approverRoleKeys = roles.filter((r) => isApproverRole(r.key)).map((r) => r.key);
    try {
      const { users } = await userService.getAllUsers();
      const members: Record<string, number> = {};
      const admins: Record<string, number> = {};
      for (const u of users as { atbiyaId?: string; hierarchyLevel?: string; status?: string }[]) {
        if (!u.atbiyaId) continue;
        members[u.atbiyaId] = (members[u.atbiyaId] ?? 0) + 1;
        const active = (u.status ?? 'active') === 'active';
        if (active && u.hierarchyLevel && approverRoleKeys.includes(u.hierarchyLevel)) {
          admins[u.atbiyaId] = (admins[u.atbiyaId] ?? 0) + 1;
        }
      }
      setMemberCounts(members);
      setAdminCounts(admins);
    } catch { /* counts stay empty */ }
  }, [roles, isApproverRole]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAtbiyas(await hierarchyService.getAtbiyas(true));
    } catch (e) {
      const code = (e as { code?: string })?.code ?? '';
      setError(code === 'permission-denied'
        ? 'Firestore denied access to the parish registry. If the rules were just changed they still need to be deployed (firebase deploy --only firestore:rules).'
        : 'Could not load the parish registry. Please try again.');
      setAtbiyas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!canManage) { setLoading(false); return; }
    load();
    loadCounts();
  }, [canManage, load, loadCounts]);

  async function toggleActive(a: Atbiya) {
    setError(null);
    try {
      await hierarchyService.deactivateAtbiya(a.id, a.active === false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update the parish.');
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-6">
        <ConfigurablePageHeader
          module="hierarchy"
          defaultTitle="Atbiya Registry"
          defaultDescription="Parishes, their details and their administrators."
          badge="Administration"
        />
        <SectionCard title="Access Denied" icon={Church}>
          <p className="text-muted-foreground">
            Your role does not include the "Manage Atbiya Registry" permission. A
            super admin can grant it in Software Control → Roles.
          </p>
        </SectionCard>
      </div>
    );
  }

  const filtered = atbiyas.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [a.name, a.nameAmharic, a.cityEn, a.cityAm, a.contact?.nameEn, a.contact?.phone]
      .join(' ').toLowerCase().includes(q);
  });

  const withoutAdmin = atbiyas.filter((a) => a.active !== false && (adminCounts[a.id] ?? 0) === 0);

  return (
    <div className="space-y-6">
      <ConfigurablePageHeader
        module="hierarchy"
        defaultTitle="Atbiya Registry"
        defaultDescription="Parishes, their details and their administrators."
        badge="Administration"
      />

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && withoutAdmin.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {withoutAdmin.length === 1
              ? <><strong>{withoutAdmin[0].name}</strong> has no administrator.</>
              : <><strong>{withoutAdmin.length} parishes</strong> have no administrator.</>}
            {' '}Membership requests they receive have nobody to approve them — open
            a parish and add one.
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Registered parishes</CardTitle>
            <CardDescription>
              Every parish, with its address, bank accounts and contact person.
              This list is what a new member picks from on the public sign-up
              form, and it is the parish that receives their request.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { load(); loadCounts(); }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            {showElement('atbiya.add') && (
              <Button size="sm" onClick={() => setRegisterOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Register
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Search parishes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Church className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">
                {atbiyas.length === 0 ? 'No parishes registered yet' : 'No parish matches that search'}
              </p>
              <p className="text-sm">
                {atbiyas.length === 0
                  ? 'Register one so members can select it when they sign up.'
                  : 'Try a different name, city or phone number.'}
              </p>
            </div>
          ) : filtered.map((a) => {
            const admins = adminCounts[a.id] ?? 0;
            return (
              <div key={a.id}
                className="p-4 rounded-xl border border-border bg-muted/20 flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[240px] space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{a.name}</span>
                    {a.nameAmharic && (
                      <span className="text-sm text-muted-foreground font-ethiopic">{a.nameAmharic}</span>
                    )}
                    {a.active === false && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                    {a.isPublic === false && (
                      <Badge variant="secondary" className="text-[10px]">Hidden from sign-up</Badge>
                    )}
                    {a.active !== false && admins === 0 && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">
                        No administrator
                      </Badge>
                    )}
                  </div>
                  {(a.address?.en || a.address?.am) && (
                    <p className="text-xs text-muted-foreground">
                      {a.address?.en}{a.address?.en && a.address?.am ? ' · ' : ''}
                      <span className="font-ethiopic">{a.address?.am}</span>
                    </p>
                  )}
                  {a.contact?.nameEn || a.contact?.phone ? (
                    <p className="text-xs text-muted-foreground">
                      {a.contact?.nameEn}
                      {a.contact?.phone ? ` · ${a.contact.phone}` : ''}
                      {a.contact?.email ? ` · ${a.contact.email}` : ''}
                    </p>
                  ) : null}
                  {(a.bankAccounts ?? []).length > 0 && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {(a.bankAccounts ?? [])
                        .map((b) => `${b.accountNumber} (${b.bankName})`)
                        .join('  ·  ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="gap-1 text-[10px]" title="Members">
                    <UsersIcon className="h-2.5 w-2.5" /> {memberCounts[a.id] ?? 0}
                  </Badge>
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => setManagingAdmins(a)}>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Administrators ({admins})
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit parish"
                    onClick={() => setEditing(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => toggleActive(a)}>
                    {a.active === false ? 'Reactivate' : 'Deactivate'}
                  </Button>
                </div>
              </div>
            );
          })}

          <p className="text-[11px] text-muted-foreground pt-2">
            Parishes are never deleted — member and news records reference them by
            id. Deactivate instead.
          </p>
        </CardContent>
      </Card>

      <AtbiyaRegistrationDialog
        open={registerOpen}
        onSaved={() => { setRegisterOpen(false); load(); loadCounts(); }}
        onClose={() => setRegisterOpen(false)}
      />
      <AtbiyaEditorDialog
        open={editing !== null}
        atbiya={editing}
        onSaved={() => { setEditing(null); load(); }}
        onClose={() => setEditing(null)}
      />
      <AtbiyaAdminsDialog
        open={managingAdmins !== null}
        atbiya={managingAdmins}
        onChanged={loadCounts}
        onClose={() => setManagingAdmins(null)}
      />
    </div>
  );
};

export default AtbiyaRegistry;
