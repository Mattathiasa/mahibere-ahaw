import { roleRegistryService } from '@/services/roleRegistry';
import type { User } from '@/types';

/**
 * Where a user lands right after signing in.
 *
 * A parish administrator's whole job is the queue on /my-atbiya, so sending
 * them to the generic dashboard buries it. The decision is made from the role's
 * `scope` in the registry rather than a role KEY, because roles are dynamic —
 * a project that renames or adds parish-level roles must keep working.
 *
 * Falls back to /dashboard on any failure: a redirect is a convenience, and it
 * must never be the reason a successful sign-in appears to fail.
 */
export async function postLoginPath(user: Pick<User, 'hierarchyLevel' | 'atbiyaId'>): Promise<string> {
  if (!user?.atbiyaId || !user.hierarchyLevel) return '/dashboard';
  try {
    const registry = await roleRegistryService.get();
    const role = registry.roles.find((r) => r.key === user.hierarchyLevel);
    return role?.scope === 'atbiya' ? '/my-atbiya' : '/dashboard';
  } catch {
    return '/dashboard';
  }
}
