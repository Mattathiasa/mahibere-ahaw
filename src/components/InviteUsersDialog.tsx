import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Mail, Phone, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePermissions } from '@/contexts/PermissionContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hierarchyService } from '@/services/hierarchy';
import { userService } from '@/services/users';
import { roleLabel, type Role, type RoleScope } from '@/services/roleRegistry';
import { syntheticEmail } from '@/services/signup';

interface InviteUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Which placement fields a scope requires. */
function scopeNeedsAtbiya(scope: RoleScope): boolean {
  return scope === 'atbiya' || scope === 'mahder';
}
function scopeNeedsMahderat(scope: RoleScope): boolean {
  return scope === 'mahder';
}

export function InviteUsersDialog({ open, onOpenChange }: InviteUsersDialogProps) {
  const { t } = useLanguage();
  const pe = t.people;
  const a = t.admin;
  const queryClient = useQueryClient();
  const { roles, scopeOf } = usePermissions();

  const assignableRoles = roles.filter((r) => r.active !== false);

  const [fullName, setFullName] = useState('');
  const [fullNameAmharic, setFullNameAmharic] = useState('');
  const [phone, setPhone] = useState('+251');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleKey, setRoleKey] = useState('');
  const [atbiyaId, setAtbiyaId] = useState('');
  const [mahderatId, setMahderatId] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');

  // Reset form when dialog closes
  const resetForm = () => {
    setFullName('');
    setFullNameAmharic('');
    setPhone('+251');
    setEmail('');
    setPassword('');
    setRoleKey('');
    setAtbiyaId('');
    setMahderatId('');
    setGender('Male');
  };

  const selectedRole = assignableRoles.find((r) => r.key === roleKey);
  const selectedScope = selectedRole ? scopeOf(selectedRole.key) : null;
  const needsAtbiya = selectedScope ? scopeNeedsAtbiya(selectedScope) : false;
  const needsMahderat = selectedScope ? scopeNeedsMahderat(selectedScope) : false;

  // Fetch congregations when needed
  const { data: atbiyaData } = useQuery({
    queryKey: ['atbiya'],
    queryFn: () => hierarchyService.getEntitiesByLevel('Atbiya'),
    enabled: open && needsAtbiya,
  });

  // Fetch mahderat when needed
  const { data: mahderatData } = useQuery({
    queryKey: ['mahderat', atbiyaId],
    queryFn: () => hierarchyService.getEntitiesByParent(atbiyaId),
    enabled: open && needsMahderat && !!atbiyaId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Generate a username from the name or phone
      const username = (fullName || phone.replace(/\D/g, '')).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || `user${Date.now()}`;
      const actualPassword = password || 'changeme123';

      const userData: any = {
        username,
        password: actualPassword,
        fullName: fullName || username,
        fullNameAmharic,
        phone: phone.replace(/\s/g, ''),
        email: email || syntheticEmail(username),
        gender,
        hierarchyLevel: roleKey || 'HiyawanMahderat',
        status: 'active',
        signupSource: 'admin',
        dateOfBirth: '',
        address: {},
      };

      if (needsAtbiya && atbiyaId) {
        const match = (atbiyaData as { id: string; name?: string }[] | undefined)?.find((a) => a.id === atbiyaId);
        userData.atbiyaId = atbiyaId;
        userData.atbiyaName = match?.name ?? '';
      }
      if (needsMahderat && mahderatId) {
        userData.mahderatId = mahderatId;
      }

      return userService.createUser(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Account created for ${fullName || phone}`);
      resetForm();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to create account');
    },
  });

  const canSubmit = (fullName.trim() || phone.trim()) && roleKey;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { resetForm(); } onOpenChange(o); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-cyan-600" />
            {a.inviteUser ?? 'Create User Account'}
          </DialogTitle>
          <DialogDescription>
            Create an account directly. The user can sign in immediately with the credentials below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{pe.umFullNameEnRequired}</Label>
              <Input
                placeholder={pe.personNameExample}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{pe.umFullNameEnRequired.replace('(English)', '(Amharic)')}</Label>
              <Input
                placeholder="ዮሐንስ ተስፋዬ"
                value={fullNameAmharic}
                onChange={(e) => setFullNameAmharic(e.target.value)}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-bold">
                <Phone className="h-3 w-3 text-slate-500" /> {f.phoneNumber}
              </Label>
              <Input
                placeholder="+251 9..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-bold">
                <Mail className="h-3 w-3 text-slate-500" /> {f.email}
              </Label>
              <Input
                type="email"
                placeholder={pe.emailExamplePlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{a.password} (leave blank for default)</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">{a.gender}</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as 'Male' | 'Female')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">{a.male}</SelectItem>
                <SelectItem value="Female">{a.female}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-bold">
              <Shield className="h-3 w-3 text-slate-500" /> {a.hierarchyLevel}
            </Label>
            <Select value={roleKey} onValueChange={setRoleKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role…" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.key} value={r.key}>
                    {roleLabel(r, 'en')}
                    {r.isAdmin && ' ★'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRole && (
              <p className="text-[11px] text-muted-foreground">
                {selectedRole.description}
                {selectedRole.isAdmin && ' — Has admin access.'}
                {selectedRole.canApproveMembers && ' — Can approve membership requests.'}
              </p>
            )}
          </div>

          {/* Placement fields — scope-aware */}
          {needsAtbiya && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{a.scopeCongregation} *</Label>
              <Select value={atbiyaId} onValueChange={(v) => { setAtbiyaId(v); setMahderatId(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder={a.selectCongregation} />
                </SelectTrigger>
                <SelectContent>
                  {(atbiyaData as any[] | undefined)?.map((atbiya) => (
                    <SelectItem key={atbiya.id} value={atbiya.id}>
                      {atbiya.name} / {atbiya.nameAmharic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {needsMahderat && atbiyaId && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">{a.tabMahderat} *</Label>
              <Select value={mahderatId} onValueChange={setMahderatId}>
                <SelectTrigger>
                  <SelectValue placeholder={a.selectMahderat} />
                </SelectTrigger>
                <SelectContent>
                  {(mahderatData as any[] | undefined)?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} / {m.nameAmharic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Permissions preview */}
          {selectedRole && selectedRole.permissions.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                This role grants {selectedRole.permissions.length} permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {selectedRole.permissions.slice(0, 8).map((p) => (
                  <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {p.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                ))}
                {selectedRole.permissions.length > 8 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{selectedRole.permissions.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !canSubmit}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating…</>
            ) : (
              <><CheckCircle2 className="h-4 w-4 mr-1" /> Create Account</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
