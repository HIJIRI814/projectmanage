import { defineStore } from 'pinia';

interface User {
  id: string;
  email: string;
  name: string;
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
    isAuthenticated: (state) => state.user !== null && state.accessToken !== null,
  },
  actions: {
    async login(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const { data, error: fetchError } = await useFetch('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });

        if (fetchError.value) {
          throw new Error(fetchError.value.message || 'Login failed');
        }

        if (data.value) {
          const result = data.value as {
            accessToken: string;
            refreshToken: string;
            user: User;
          };
          this.user = result.user;
          this.accessToken = result.accessToken;
          this.refreshToken = result.refreshToken;

          // クッキーにトークンを保存（SSR時の認証チェック用）
          const accessTokenCookie = useCookie('accessToken', {
            maxAge: 60 * 15, // 15分
            secure: true,
            sameSite: 'strict',
          });
          accessTokenCookie.value = result.accessToken;
        }
      } catch (err: any) {
        this.error = err.message || 'An error occurred';
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
      const accessTokenCookie = useCookie('accessToken');
      accessTokenCookie.value = null;
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

