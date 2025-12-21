import { useAuthStore } from '~/stores/auth';

// 安全なリダイレクトパスを生成する関数
const getRedirectPath = (targetPath: string): string => {
  // /loginページ自体へのアクセス時は/projectsにリダイレクト
  if (targetPath === '/login') {
    return '/projects';
  }
  // 相対パスで、かつ/で始まる場合のみ許可（セキュリティ対策）
  if (targetPath.startsWith('/') && !targetPath.startsWith('//')) {
    return targetPath;
  }
  // 不正なパスの場合は/projectsにリダイレクト
  return '/projects';
};

export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) {
    // SSR時はクッキーからトークンをチェック
    const accessTokenCookie = useCookie('sb-access-token');
    
    if (!accessTokenCookie.value) {
      const redirectPath = getRedirectPath(to.path);
      return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  } else {
    // クライアントサイドではストアの状態をチェック
    const store = useAuthStore();
    const { isAuthenticated, user } = useAuth();

    // クッキーからSupabaseトークンをチェック
    const sbAccessTokenCookie = useCookie('sb-access-token');

    // トークンはあるがユーザー情報がない場合、APIから取得してストアに設定
    if (sbAccessTokenCookie.value && !user.value) {
      try {
        const userData = await $fetch<{
          id: string;
          email: string;
          name: string;
          userType: number | null;
          userCompanies?: Array<{
            id: string;
            companyId: string;
            userType: number;
          }>;
        }>('/api/auth/me');
        store.setUser(userData);
      } catch (error: any) {
        // ユーザー情報の取得に失敗した場合、ログインページにリダイレクト
        const redirectPath = getRedirectPath(to.path);
        return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
    }

    if (!isAuthenticated.value) {
      const redirectPath = getRedirectPath(to.path);
      return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }
});

