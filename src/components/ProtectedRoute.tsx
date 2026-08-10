import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import { useLanguage } from '@/contexts/LanguageContext';
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { t } = useLanguage();
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t.admin.verifyingAuth}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Defence in depth. Login already blocks unapproved accounts, but a session
  // that is open when an admin suspends it would otherwise keep rendering
  // pages full of permission-denied errors. Firestore rules are the real
  // boundary; this just makes the experience legible.
  if (user && user.status && user.status !== 'active') {
    return (
      <Navigate
        to="/pending"
        replace
        state={{ atbiyaName: user.atbiyaName, atbiyaId: user.atbiyaId }}
      />
    );
  }

  return <>{children}</>;
}
