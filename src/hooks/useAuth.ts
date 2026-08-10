import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { LoginCredentials } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { postLoginPath } from '@/lib/postLogin';

import { errorMessage } from '@/lib/appError';
import { useLanguage } from '@/contexts/LanguageContext';
export function useAuth() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuthContext();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: async (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
      toast.success('Login successful!');
      // Parish administrators land on their own console; everyone else on the
      // dashboard. postLoginPath falls back to /dashboard if anything fails.
      navigate(await postLoginPath(data.user), { replace: true });
    },
    onError: (error: unknown) => {
      toast.error(errorMessage(t, error));
      authService.clearAuth();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    },
    onError: () => {
      authService.clearAuth();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  return {
    user,
    isLoading: loading,
    isAuthenticated,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
