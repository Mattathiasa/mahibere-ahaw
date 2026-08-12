import { useQuery } from '@tanstack/react-query';
import { membershipRequestService } from '@/services/membershipRequests';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';

/**
 * How many membership requests are waiting on the signed-in user.
 *
 * This is how a parish learns a request has arrived. It is a polled count
 * rather than a stored notification document on purpose: with no Cloud
 * Functions there is no trusted server-side writer, and the only client that
 * could write the notification is the applicant — who is `status: 'pending'`
 * and, if the rules were widened to let them, could write unlimited documents
 * into an inbox every parish administrator reads. Deriving the number from the
 * requests themselves needs no rule change and cannot be spammed.
 *
 * Scoped exactly like the queue itself: head office counts every parish, a
 * parish counts only its own.
 */
export function usePendingRequests() {
  const { user } = useAuth();
  const { can, canReadWholeDirectory, myAtbiyaId, isSuperAdmin, isApproverRole } = usePermissions();

  // Same test MembershipRequests uses, so the badge and the queue never disagree.
  const mayApprove =
    isSuperAdmin || can('canApproveMembers') || isApproverRole(user?.hierarchyLevel);
  // A parish-scoped approver with no parish would count every parish's
  // requests, which is not theirs to see.
  const enabled = !!user && mayApprove && (canReadWholeDirectory || !!myAtbiyaId);

  const { data = 0, refetch } = useQuery({
    queryKey: ['membership-requests', 'count', canReadWholeDirectory ? 'all' : myAtbiyaId],
    queryFn: () =>
      membershipRequestService.countPending(canReadWholeDirectory ? undefined : myAtbiyaId),
    refetchInterval: 60_000,
    enabled,
  });

  return { count: enabled ? data : 0, refetch };
}
