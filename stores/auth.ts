import { defineStore } from 'pinia';

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

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    isLoading: false,
    error: null as string | null,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    async login(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const result = await $fetch<{
          user: User;
        }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });

        this.user = result.user;
        // クッキーはサーバー側で設定されるため、クライアント側では不要
        // SupabaseセッションはhttpOnlyクッキーで管理される
      } catch (err: any) {
        let errorMessage = 'ログインに失敗しました';
        if (err.data?.statusMessage) {
          errorMessage = err.data.statusMessage;
        } else if (err.data?.message) {
          errorMessage = err.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (err.data?.errors && Array.isArray(err.data.errors)) {
          errorMessage = err.data.errors.map((e: any) => `${e.path?.join('.') || 'field'}: ${e.message || 'Invalid'}`).join(', ');
        }
        this.error = errorMessage;
        throw err;
      } finally {
        this.isLoading = false;
      }
    },
    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.error = null;

      // クッキーからトークンを削除
      const accessTokenCookie = useCookie('sb-access-token');
      accessTokenCookie.value = null;
      const refreshTokenCookie = useCookie('sb-refresh-token');
      refreshTokenCookie.value = null;
    },
    setUser(user: User | null) {
      this.user = user;
    },
    setTokens(accessToken: string | null, refreshToken: string | null) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    },
    clearError() {
      this.error = null;
    },
  },
});

