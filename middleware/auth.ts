export default defineNuxtRouteMiddleware((to, from) => {
  if (process.server) {
    // SSR時はクッキーからトークンをチェック
    const accessTokenCookie = useCookie('accessToken');
    
    if (!accessTokenCookie.value) {
      return navigateTo('/login');
    }
  } else {
    // クライアントサイドではストアの状態をチェック
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated.value) {
      return navigateTo('/login');
    }
  }
});

