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
    isAuthenticated: (state) => state.user !== null && state.accessToken !== null,
  },
  actions: {
    async login(email: string, password: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const result = await $fetch<{
          accessToken: string;
          refreshToken: string;
          user: User;
        }>('/api/auth/login', {
          method: 'POST',
          body: { email, password },
        });

        this.user = result.user;
        this.accessToken = result.accessToken;
        this.refreshToken = result.refreshToken;

        // クッキーにトークンを保存（SSR時の認証チェック用）
        const accessTokenCookie = useCookie('accessToken', {
          maxAge: 60 * 15, // 15分
          secure: process.env.NODE_ENV === 'production', // 本番環境のみsecure
          sameSite: 'lax', // 開発環境でも動作するようにlaxに変更
          httpOnly: false, // クライアント側からアクセス可能にする
        });
        accessTokenCookie.value = result.accessToken;
        
        // クライアント側でも確実にクッキーを設定（フォールバック）
        if (process.client) {
          const maxAge = 60 * 15; // 15分
          const expires = new Date(Date.now() + maxAge * 1000).toUTCString();
          document.cookie = `accessToken=${result.accessToken}; expires=${expires}; path=/; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
        }
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

