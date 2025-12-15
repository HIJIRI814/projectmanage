import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { storeToRefs } from 'pinia';
import { UserType } from '~/domain/user/model/UserType';

interface User {
  id: string;
  email: string;
  name: string;
  userType: number | null;
  userCompanies?: Array<{
    id: string;
    companyId: string;
    userType: number;
  }>;
}

export const useAuth = () => {
  const store = useAuthStore();
  const { user, accessToken, refreshToken, isLoading, error, isAuthenticated } =
    storeToRefs(store);

  const isAdministrator = computed(() => {
    if (!user.value || !user.value.userCompanies) {
      return false;
    }
    // userCompaniesの中にADMINISTRATORのuserTypeを持つものがあるかチェック
    const result = user.value.userCompanies.some(
      (uc) => uc.userType === UserType.ADMINISTRATOR
    );
    return result;
  });

  return {
    // State（リアクティブ）
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    isAdministrator,
    // Actions
    login: (email: string, password: string) => store.login(email, password),
    logout: () => store.logout(),
    setUser: (user: User | null) => store.setUser(user),
    setTokens: (accessToken: string | null, refreshToken: string | null) =>
      store.setTokens(accessToken, refreshToken),
    clearError: () => store.clearError(),
  };
};

