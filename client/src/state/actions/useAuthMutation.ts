import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { AuthResponse, ApiError } from '@/types/auth';
import { useLoginUser } from '@/state/actions/authActions';

export const useAuthMutation = (isLogin: boolean) => {
  const queryClient = useQueryClient();
  const setAuthUser = useLoginUser();

  return useMutation<AuthResponse, ApiError, any>({
    mutationFn: async (data) => {
      const endpoint = isLogin ? '/login' : '/register';
      const response = await api.post(endpoint, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.user) {
          setAuthUser(data.user);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
