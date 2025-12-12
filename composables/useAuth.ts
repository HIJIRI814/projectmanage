import { computed } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { storeToRefs } from 'pinia';
import { UserType } from '~/domain/user/model/UserType';

interface User {
  id: string;
  email: string;
  name: string;
  userType: number;
}

export const useAuth = () => {
  const store = useAuthStore();
  const { user, accessToken, refreshToken, isLoading, error, isAuthenticated } =
    storeToRefs(store);

  const isAdministrator = computed(() => {
    const result = user.value?.userType === UserType.ADMINISTRATOR;
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'composables/useAuth.ts:18',message:'isAdministrator computed',data:{userType:user.value?.userType,expectedType:UserType.ADMINISTRATOR,result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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

