export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) {
    // SSR時はクッキーからトークンをチェック
    const accessTokenCookie = useCookie('accessToken');
    
    if (accessTokenCookie.value) {
      // 既にログイン済みの場合はプロジェクト一覧へリダイレクト
      return navigateTo('/projects');
    }
  } else {
    // クライアントサイドではストアの状態をチェック
    const { isAuthenticated } = useAuth();

    if (isAuthenticated.value) {
      return navigateTo('/projects');
    }
  }
});

