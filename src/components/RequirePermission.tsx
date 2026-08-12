import React from 'react';
import { Lock } from 'lucide-react';
import { usePermissions } from '@/contexts/PermissionContext';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { permissionLabel, type PermissionKey } from '@/lib/rolePermissions';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n/translations';
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
  /**
   * The permission required. Pass an ARRAY when holding any one of them is
   * enough — `/missionary` needs that, because `HiyawanMahderat` holds
   * `canSubmitMissionaryApplication` but not `canViewMissionary`, and the page is
   * where you submit. Gating it on the view permission alone would lock the one
   * role granted the submit right out of using it.
   */
  permission: PermissionKey | PermissionKey[];
  /**
   * Drives the admin-editable page header shown above the refusal. Optional:
   * several gated pages (notifications, settings, user management) have no
   * `ModuleKey`, and inventing one would add a row to the Module Config editor
   * for a page that has nothing configurable.
   */
  module?: ModuleKey;
  /**
   * Page name for the header. Optional: every `ModuleKey` is also a key in
   * `nav` or `pages`, so the translated name is derived from `module` by
   * default. Callers used to pass English literals here, which is how a dozen
   * page titles stayed English no matter the reader's language.
   */
  title?: string;
  description?: string;
  children: React.ReactNode;
}

/** The page's name in the reader's language, from `nav` then `pages`. */
function moduleTitle(t: Translations, module: ModuleKey): string | undefined {
  const nav = t.nav as Record<string, string | undefined>;
  const pages = t.pages as Record<string, string | undefined>;
  return nav[module] ?? pages[module];
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({
  permission, module, title, description, children,
}) => {
  const { can, loading } = usePermissions();
  const { t } = useLanguage();

  // Rendering the refusal before the registry resolves would flash "Access
  // Denied" at legitimate staff on every hard refresh of the URL.
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const required = Array.isArray(permission) ? permission : [permission];
  // Split from the return below on purpose: an arrow function sharing a line with
  // a JSX fragment makes scripts/check-hardcoded-strings.mjs read `=>` as a tag
  // and report the code after it as untranslated UI text.
  const allowed = required.some((p) => can(p));
  if (allowed) return <>{children}</>;

  // Names the FIRST requirement. With an any-of list that is the one to ask for:
  // it is the page's own view permission, the others being incidental rights that
  // happen to imply access.
  const body = t.permissions.deniedBody
    .replace('{permission}', permissionLabel(t, required[0]))
    .replace('{location}', t.permissions.deniedLocation);

  const heading = title ?? (module ? moduleTitle(t, module) ?? module : t.admin.accessDenied);

  return (
    <div className="space-y-6">
      {module ? (
        <ConfigurablePageHeader
          module={module}
          defaultTitle={heading}
          defaultDescription={description ?? t.permissions.noAccessDefault}
        />
      ) : (
        <div>
          <h1 className="text-2xl font-bold">{heading}</h1>
          <p className="text-muted-foreground">{description ?? t.permissions.noAccessDefault}</p>
        </div>
      )}
      <SectionCard title={t.admin.accessDenied} icon={Lock}>
        <p className="text-muted-foreground">{body}</p>
      </SectionCard>
    </div>
  );
};
