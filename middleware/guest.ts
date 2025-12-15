import { useAuthStore } from '~/stores/auth';

// 安全なリダイレクトパスを検証する関数
const validateRedirectPath = (path: string | undefined): string | null => {
  if (!path) {
    return null;
  }
  // 相対パスで、かつ/で始まる場合のみ許可（セキュリティ対策）
  if (path.startsWith('/') && !path.startsWith('//') && !path.startsWith('http://') && !path.startsWith('https://')) {
    return path;
  }
  // 不正なパスの場合はnullを返す（デフォルトの/projectsにリダイレクト）
  return null;
};

export default defineNuxtRouteMiddleware(async (to, from) => {
  // クエリパラメータからredirectを取得
  const redirectParam = to.query.redirect as string | undefined;
  const redirectPath = validateRedirectPath(redirectParam);

  if (process.server) {
    // SSR時はクッキーからトークンをチェック
    const accessTokenCookie = useCookie('accessToken');
    
    if (accessTokenCookie.value) {
      // 既にログイン済みの場合はredirectパラメータがあればそのページに、なければプロジェクト一覧へリダイレクト
      return navigateTo(redirectPath || '/projects');
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
        // ユーザー情報の取得に失敗した場合、クッキーをクリア
        store.logout();
      }
    }

    if (isAuthenticated.value) {
      // 既にログイン済みの場合はredirectパラメータがあればそのページに、なければプロジェクト一覧へリダイレクト
      return navigateTo(redirectPath || '/projects');
    }
  }
});

