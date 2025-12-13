import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) {
    // SSR時はクッキーからトークンをチェック
    const accessTokenCookie = useCookie('accessToken');
    
    if (!accessTokenCookie.value) {
      return navigateTo('/login');
    }
  } else {
    // クライアントサイドではストアの状態をチェック
    const store = useAuthStore();
    const { isAuthenticated, user, accessToken } = useAuth();

    // クッキーからトークンを取得してストアに設定（クライアント側の状態を復元）
    const accessTokenCookie = useCookie('accessToken');
    
    if (accessTokenCookie.value && !accessToken.value) {
      // クッキーにトークンがあるがストアにない場合、ストアに設定
      store.setTokens(accessTokenCookie.value, null);
    }

    // トークンはあるがユーザー情報がない場合、APIから取得してストアに設定
    if (accessTokenCookie.value && !user.value) {
      try {
        const userData = await $fetch('/api/auth/me');
        store.setUser(userData);
      } catch (error: any) {
        // ユーザー情報の取得に失敗した場合、ログインページにリダイレクト
        return navigateTo('/login');
      }
    }

    if (!isAuthenticated.value) {
      return navigateTo('/login');
    }
  }
});

