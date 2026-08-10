import React, { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import {
  ALL_PERMISSIONS, PERMISSION_META, PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS,
  permissionLabel, permissionDescription, permissionGroupLabel,
  type PermissionKey,
} from '@/lib/rolePermissions';
import { roleLabel, type Role } from '@/services/roleRegistry';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface PermissionMatrixProps {
  roles: Role[];
  onToggle: (roleKey: string, permission: PermissionKey) => void;
  /** Restores a role's permission list to the values the app ships with. */
  onResetRole: (roleKey: string) => void;
}

/**
 * The permission grid, extracted so Software Control and Permission Control
 * stop shipping two divergent copies of it that overwrite each other's saves.
 * Columns come from the role registry, so a role added in the editor appears
 * here immediately.
 */
export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  roles, onToggle, onResetRole,
}) => {
  // The language came in as a prop defaulting to 'en', and the only caller
  // never passed it — so role names rendered in English however the reader had
  // set the app. Reading the context removes both the prop and the bug.
  const { t, language: lang } = useLanguage();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(PERMISSION_GROUPS));

  function toggleGroup(group: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  if (roles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No roles defined yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {PERMISSION_GROUPS.map((group) => {
        const perms = ALL_PERMISSIONS.filter((p) => PERMISSION_META[p].group === group);
        const isOpen = openGroups.has(group);
        return (
          <div key={group} className="rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-bold">{permissionGroupLabel(t, group)}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 px-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold min-w-[180px]">
                        Permission
                      </th>
                      {roles.map((role) => (
                        <th key={role.key}
                          className="py-2 px-2 text-[10px] uppercase tracking-wide text-muted-foreground text-center whitespace-nowrap">
                          {roleLabel(role, lang)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perms.map((perm) => (
                      <tr key={perm} className="border-b border-border/50">
                        <td className="py-2 px-4">
                          <div className="font-medium">{permissionLabel(t, perm)}</div>
                          <div className="text-[11px] text-muted-foreground">{permissionDescription(t, perm)}</div>
                        </td>
                        {roles.map((role) => {
                          const isDefault =
                            (DEFAULT_ROLE_PERMISSIONS[role.key] ?? []).includes(perm)
                            === role.permissions.includes(perm);
                          return (
                            <td key={role.key} className="py-2 px-2 text-center">
                              <span className={isDefault ? '' : 'ring-2 ring-amber-400/60 rounded-sm inline-block'}>
                                <Checkbox
                                  checked={role.permissions.includes(perm)}
                                  onCheckedChange={() => onToggle(role.key, perm)}
                                  aria-label={`${permissionLabel(t, perm)} — ${roleLabel(role, lang)}`}
                                />
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2 pt-2 items-center">
        <span className="text-xs text-muted-foreground mr-1">{t.admin.resetRoleHint}</span>
        {roles
          .filter((r) => DEFAULT_ROLE_PERMISSIONS[r.key])
          .map((role) => (
            <Button key={role.key} size="sm" variant="outline" className="gap-1 text-xs"
              onClick={() => onResetRole(role.key)}>
              <RotateCcw className="h-3 w-3" /> {roleLabel(role, lang)}
            </Button>
          ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        An amber outline marks a permission that differs from the shipped default.
      </p>
    </div>
  );
};
