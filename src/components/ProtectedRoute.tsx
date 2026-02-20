import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      // Check if token exists
      if (!authService.isAuthenticated()) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      try {
        // Validate token by fetching current user
        await authService.getCurrentUser();
        setIsValid(true);
      } catch (error) {
        // Token is invalid, clear auth
        authService.clearAuth();
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, [location.pathname]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
