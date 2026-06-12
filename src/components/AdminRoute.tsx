import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionContext';

const ADMIN_ROLES = ['Sinodos', 'KuamiSinodos'];

interface AdminRouteProps {
  children: React.ReactNode;
  /** If true, only Super Admins can access — not just Sinodos/KuamiSinodos */
  superAdminOnly?: boolean;
}

export default function AdminRoute({ children, superAdminOnly = false }: AdminRouteProps) {
  const location = useLocation();
  const { user, loading, isAuthenticated } = useAuthContext();
  const { isSuperAdmin } = usePermissions();

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

  // Super Admin always passes
  if (isSuperAdmin) return <>{children}</>;

  // superAdminOnly routes — only Super Admin
  if (superAdminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // Regular admin routes — Sinodos / KuamiSinodos
  const role = user?.hierarchyLevel ?? user?.role ?? '';
  if (!ADMIN_ROLES.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
