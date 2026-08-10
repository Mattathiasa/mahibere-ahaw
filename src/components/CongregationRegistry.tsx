import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, Church, Loader2, Pencil, Plus, RefreshCw, ShieldCheck,
  TriangleAlert, Upload, Users as UsersIcon,
} from 'lucide-react';
import { hierarchyService, type Atbiya } from '@/services/hierarchy';
import { atbiyaAdminService } from '@/services/atbiyaAdmins';
import { userService } from '@/services/users';
import { usePermissions } from '@/contexts/PermissionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { AtbiyaEditorDialog } from '@/components/AtbiyaEditorDialog';
import { AtbiyaRegistrationDialog } from '@/components/AtbiyaRegistrationDialog';
import { AtbiyaAdminsDialog } from '@/components/AtbiyaAdminsDialog';
import { AtbiyaImportDialog } from '@/components/AtbiyaImportDialog';
import { MahderatManager } from '@/components/MahderatManager';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * The congregation registry.
 *
 * A component rather than a page so it can sit as one tab beside the other
 * levels on /organisation. Its permission is NOT the one the rest of that page
 * uses: registering or editing a congregation needs `canManageAtbiyas`, which
 * firestore.rules honours through canRegisterAtbiya(), while every other level
 * needs isAdmin(). Handing it the page's flag would either lock out a Memriya
 * account that legitimately manages parishes, or offer buttons the server
 * refuses.
 */
export const CongregationRegistry: React.FC = () => {
  const { can, isSuperAdmin, roles, isApproverRole } = usePermissions();
  const { showElement } = useSoftwareControl();

  const { t } = useLanguage();
  const tx = t.admin;
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
  const [managingGroups, setManagingGroups] = useState<Atbiya | null>(null);
  const [importOpen, setImportOpen] = useState(false);

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
        ? tx.registryRulesNotDeployed
        : tx.registryLoadFailed);
      setAtbiyas([]);
    } finally {
      setLoading(false);
    }
  }, [tx]);

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
      setError(e instanceof Error ? e.message : tx.congregationUpdateFailed);
    }
  }

  if (!canManage) return null;

  const filtered = atbiyas.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [a.name, a.nameAmharic, a.cityEn, a.cityAm, a.contact?.nameEn, a.contact?.phone]
      .join(' ').toLowerCase().includes(q);
  });

  const withoutAdmin = atbiyas.filter((a) => a.active !== false && (adminCounts[a.id] ?? 0) === 0);

  return (
    <div className="space-y-6">
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
              ? <><strong>{withoutAdmin[0].name}</strong> {tx.withoutAdminWarningOne}</>
              : <><strong>{withoutAdmin.length}</strong> {tx.withoutAdminWarning}</>}
            {' '}{tx.withoutAdminAction}
          </span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{tx.registeredCongregations}</CardTitle>
            <CardDescription>
              {tx.registeredCongregationsDesc}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { load(); loadCounts(); }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> {tx.refresh}
            </Button>
            {showElement('atbiya.add') && (
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-1" /> {tx.importAction}
              </Button>
            )}
            {showElement('atbiya.add') && (
              <Button size="sm" onClick={() => setRegisterOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> {tx.registerCongregationAction}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder={tx.searchCongregations}
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
                {atbiyas.length === 0 ? tx.noCongregationsYet : tx.noCongregationMatch}
              </p>
              <p className="text-sm">
                {atbiyas.length === 0
                  ? tx.noCongregationsYetDesc
                  : tx.noCongregationMatchDesc}
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
                    {a.active === false && <Badge variant="outline" className="text-[10px]">{tx.inactive}</Badge>}
                    {a.isPublic === false && (
                      <Badge variant="secondary" className="text-[10px]">{tx.hiddenFromSignup}</Badge>
                    )}
                    {a.active !== false && admins === 0 && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">
                        {tx.noAdministratorBadge}
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
                  <Badge variant="outline" className="gap-1 text-[10px]" title={tx.membersCount}>
                    <UsersIcon className="h-2.5 w-2.5" /> {memberCounts[a.id] ?? 0}
                  </Badge>
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => setManagingAdmins(a)}>
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> {tx.administrators} ({admins})
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => setManagingGroups(a)}>
                    <UsersIcon className="h-3.5 w-3.5 mr-1" /> {tx.tabMahderat}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" title={tx.editCongregation}
                    onClick={() => setEditing(a)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs"
                    onClick={() => toggleActive(a)}>
                    {a.active === false ? tx.reactivate : tx.deactivate}
                  </Button>
                </div>
              </div>
            );
          })}

          <p className="text-[11px] text-muted-foreground pt-2">
            {tx.neverDeletedNote}
          </p>
        </CardContent>
      </Card>

      <AtbiyaImportDialog
        open={importOpen}
        onImported={() => { load(); loadCounts(); }}
        onClose={() => setImportOpen(false)}
      />
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

      {/* The same manager the congregation itself uses on /my-atbiya, so head
          office and the congregation never see two different pictures. */}
      <Dialog open={managingGroups !== null} onOpenChange={(o) => !o && setManagingGroups(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" /> {tx.tabMahderat} — {managingGroups?.name}
            </DialogTitle>
            <DialogDescription>
              {tx.mahderatDesc}
            </DialogDescription>
          </DialogHeader>
          {managingGroups && (
            <MahderatManager
              atbiyaId={managingGroups.id}
              atbiyaName={managingGroups.name}
              canEdit={canManage}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
