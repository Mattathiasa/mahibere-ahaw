import React from 'react';
import { Lock } from 'lucide-react';
import { usePermissions } from '@/contexts/PermissionContext';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { PERMISSION_META, type PermissionKey } from '@/lib/rolePermissions';
import type { ModuleKey } from '@/services/moduleConfig';

/**
 * Refuses a page to a role that lacks the permission for it.
 *
 * Hiding a sidebar entry is presentation, not access control — the route still
 * exists and the URL still works. This is the other half: a member who types
 * /finance is told no rather than handed the page.
 *
 * Deliberately a wrapper around the route element rather than a hook inside
 * each page. A hook would mean an early `return` part-way down a component that
 * has many more hooks below it, and the guard's own answer changes once the
 * permission registry finishes loading — so the hook count would change between
 * renders and React would throw "rendered fewer hooks than expected". Wrapping
 * the route means the page simply never mounts.
 *
 * This is a UI boundary, not a security one. firestore.rules still governs the
 * data, and several collections remain readable by any approved account.
 */
interface RequirePermissionProps {
  permission: PermissionKey;
  /** Drives the admin-editable page header shown above the refusal. */
  module: ModuleKey;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission, module, title, description = 'You do not have access to this page.', children,
}) => {
  const { can, loading } = usePermissions();

  // Rendering the refusal before the registry resolves would flash "Access
  // Denied" at legitimate staff on every hard refresh of the URL.
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (can(permission)) return <>{children}</>;

  const label = PERMISSION_META[permission]?.label ?? permission;

  return (
    <div className="space-y-6">
      <ConfigurablePageHeader
        module={module}
        defaultTitle={title}
        defaultDescription={description}
      />
      <SectionCard title="Access Denied" icon={Lock}>
        <p className="text-muted-foreground">
          Your role does not include the "{label}" permission, so this page is not
          available to you. If you believe you should have it, an administrator can
          grant it in Software Control → Roles.
        </p>
      </SectionCard>
    </div>
  );
};
