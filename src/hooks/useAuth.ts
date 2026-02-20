import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/auth';
import { LoginCredentials, User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function useAuth() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: authService.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['currentUser'], data.user);
      toast.success('Login successful!');
      // Use replace to prevent going back to login page
      navigate('/dashboard', { replace: true });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      // Clear any partial auth data on error
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
      // Even if logout fails on server, clear local auth
      authService.clearAuth();
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });

  return {
    user: user || authService.getStoredUser(),
    isLoading,
    isAuthenticated: authService.isAuthenticated(),
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
