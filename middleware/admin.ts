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
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:9',message:'admin middleware entry',data:{to:to.path,from:from.path,isServer:process.server},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (process.server) {
    // SSR時はクッキーからトークンをチェック
    const accessTokenCookie = useCookie('accessToken');
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:15',message:'SSR token check',data:{hasToken:!!accessTokenCookie.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!accessTokenCookie.value) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:18',message:'SSR no token redirect',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const redirectPath = getRedirectPath(to.path);
      return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }

    try {
      const { JwtService } = await import('../infrastructure/auth/jwtService');
      const jwtService = new JwtService();
      const { userId } = jwtService.verifyAccessToken(accessTokenCookie.value);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:25',message:'SSR token verified',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // SSR時はAPIからユーザー情報を取得してuserTypeをチェック
      try {
        const userData = await $fetch('/api/auth/me');
        const { UserType } = await import('../domain/user/model/UserType');
        if (!userData || userData.userType !== UserType.ADMINISTRATOR) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden: Administrator access required',
          });
        }
      } catch (error: any) {
        if (error.statusCode) {
          throw error;
        }
        throw createError({
          statusCode: 403,
          statusMessage: 'Forbidden: Administrator access required',
        });
      }
    } catch (error: any) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:36',message:'SSR error caught',data:{errorMessage:error.message,statusCode:error.statusCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      if (error.statusCode) {
        throw error;
      }
      const redirectPath = getRedirectPath(to.path);
      return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  } else {
    // クライアントサイドではストアの状態をチェック
    const store = useAuthStore();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:52',message:'Client store state BEFORE useAuth',data:{user:store.user,accessToken:!!store.accessToken,userType:store.user?.userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const { isAuthenticated, user, accessToken } = useAuth();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:55',message:'Client auth check',data:{isAuthenticated:isAuthenticated.value,userExists:!!user.value,userType:user.value?.userType,hasAccessToken:!!accessToken.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // クッキーからトークンを取得してストアに設定（クライアント側の状態を復元）
    const accessTokenCookie = useCookie('accessToken');
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:59',message:'Client cookie check',data:{hasCookie:!!accessTokenCookie.value,cookieLength:accessTokenCookie.value?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (accessTokenCookie.value && !accessToken.value) {
      // クッキーにトークンがあるがストアにない場合、ストアに設定
      store.setTokens(accessTokenCookie.value, null);
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:64',message:'Client token restored from cookie',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }

    // トークンはあるがユーザー情報がない場合、APIから取得してストアに設定
    if (accessTokenCookie.value && !user.value) {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:72',message:'Client fetching user info',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const userData = await $fetch('/api/auth/me');
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:75',message:'Client user info fetched',data:{userId:userData.id,userType:userData.userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        store.setUser(userData);
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:78',message:'Client user set to store',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:81',message:'Client user fetch failed',data:{errorMessage:error.message,statusCode:error.statusCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        // ユーザー情報の取得に失敗した場合、ログインページにリダイレクト
        const redirectPath = getRedirectPath(to.path);
        return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`);
      }
    }

    if (!isAuthenticated.value) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:69',message:'Client not authenticated redirect',data:{user:store.user,accessToken:store.accessToken},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const redirectPath = getRedirectPath(to.path);
      return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }

    const { isAdministrator } = useAuth();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:75',message:'Client admin check',data:{isAdministrator:isAdministrator.value,userType:user.value?.userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    if (!isAdministrator.value) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:80',message:'Client admin check failed',data:{isAdministrator:isAdministrator.value,userType:user.value?.userType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Administrator access required',
      });
    }
  }
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/5bb52b61-727f-4e41-8e72-bb69d23dc924',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware/admin.ts:64',message:'admin middleware exit success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
});

