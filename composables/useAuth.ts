import { useAuthStore } from '~/stores/auth';
import { storeToRefs } from 'pinia';

interface User {
  id: string;
  email: string;
  name: string;
}

export const useAuth = () => {
  const store = useAuthStore();
  const { user, accessToken, refreshToken, isLoading, error, isAuthenticated } =
    storeToRefs(store);

  return {
    // State（リアクティブ）
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    // Actions
    login: (email: string, password: string) => store.login(email, password),
    logout: () => store.logout(),
    setUser: (user: User | null) => store.setUser(user),
    setTokens: (accessToken: string | null, refreshToken: string | null) =>
      store.setTokens(accessToken, refreshToken),
    clearError: () => store.clearError(),
  };
};

