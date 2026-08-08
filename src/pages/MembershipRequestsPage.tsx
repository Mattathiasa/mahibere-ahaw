import React from 'react';
import { UserPlus } from 'lucide-react';
import { MembershipRequests } from '@/components/MembershipRequests';
import { ConfigurablePageHeader } from '@/components/ConfigurablePageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { usePermissions } from '@/contexts/PermissionContext';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * The head-office membership queue.
 *
 * A congregation administrator already has this on /my-atbiya, scoped to their
 * own congregation. Head office had it only as a card partway down the
 * dashboard and a tab inside Software Control, so approving on another
 * congregation's behalf — which the rules have always permitted — was hard to
 * find. This is the same component; only the scoping differs, and that is
 * decided inside it from `isHeadOffice`.
 */
const MembershipRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const { can, isSuperAdmin, isApproverRole } = usePermissions();
  const { t } = useLanguage();
  const a = t.admin;

  const mayApprove =
    isSuperAdmin || can('canApproveMembers') || isApproverRole(user?.hierarchyLevel);

  return (
    <div className="space-y-6">
      <ConfigurablePageHeader
        module="members"
        defaultTitle={a.requestsTitle}
        defaultDescription={a.requestsPageDesc}
        badge={a.approvalsBadge}
      />

      {mayApprove ? (
        <MembershipRequests />
      ) : (
        <SectionCard title={a.notApprover} icon={UserPlus}>
          <p className="text-muted-foreground">
            {a.notApproverDesc}
          </p>
        </SectionCard>
      )}
    </div>
  );
};

export default MembershipRequestsPage;
