import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';

interface AdminRouteProps {
  children: React.ReactNode;
  /** If true, only Super Admins can access — not every role flagged as admin */
  superAdminOnly?: boolean;
}

export default function AdminRoute({ children, superAdminOnly = false }: AdminRouteProps) {
  const location = useLocation();
  const { user, loading: authLoading, isAuthenticated } = useAuthContext();
  const { isSuperAdmin, isAdminRole, loading: permsLoading } = usePermissions();

  // Both gates matter: the role registry decides who counts as an admin, so
  // rendering before it resolves would redirect a legitimate admin to
  // /dashboard on every hard refresh of an /admin/* URL.
  const loading = authLoading || permsLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // The /admin/* routes are not wrapped in ProtectedRoute — AdminRoute is their
  // only gate — so the suspended-account redirect has to be repeated here.
  // Without it a suspended administrator kept loading every admin console, and
  // this check sits ABOVE the super-admin bypass on purpose: suspension has to
  // mean something for them too.
  if (user && user.status && user.status !== 'active') {
    return (
      <Navigate
        to="/pending"
        replace
        state={{ atbiyaName: user.atbiyaName, atbiyaId: user.atbiyaId }}
      />
    );
  }

  // Super Admin always passes
  if (isSuperAdmin) return <>{children}</>;

  // superAdminOnly routes — only Super Admin
  if (superAdminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // Regular admin routes — any role flagged `isAdmin` in the role registry
  const role = user?.hierarchyLevel ?? user?.role ?? '';
  if (!isAdminRole(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
