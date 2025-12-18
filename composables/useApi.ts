/**
 * API通信の共通化composable
 * $fetchのラッパーとして、統一されたエラーハンドリングと認証トークンの自動付与を提供
 */
export const useApi = () => {
  /**
   * 統一されたエラーメッセージを抽出
   */
  const extractErrorMessage = (err: any): string => {
    return (
      err.data?.statusMessage ||
      err.data?.message ||
      err.message ||
      'エラーが発生しました'
    )
  }

  /**
   * API呼び出しの共通ラッパー
   * @param url APIエンドポイントのURL
   * @param options $fetchのオプション
   * @returns APIレスポンス
   */
  const apiFetch = async <T = any>(
    url: string,
    options?: Parameters<typeof $fetch>[1]
  ): Promise<T> => {
    try {
      const isFormData = options?.body instanceof FormData
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:entry',message:'apiFetch called',data:{url,isFormData,hasBody:!!options?.body,bodyType:options?.body?.constructor?.name,hasHeaders:!!options?.headers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      
      // optionsからheadersを除外
      const { headers: originalHeaders, ...restOptions } = options || {}
      
      // FormDataの場合はheadersを設定しない（$fetchが自動設定）
      // それ以外の場合はContent-Typeを設定
      const headers = isFormData
        ? undefined
        : {
            'Content-Type': 'application/json',
            ...(originalHeaders as Record<string, string>),
          }
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:before-fetch',message:'Before $fetch call',data:{isFormData,headersIsUndefined:headers===undefined,restOptionsHasBody:!!restOptions.body,restOptionsBodyType:restOptions.body?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      
      const fetchOptions = {
        credentials: 'include' as const,
        ...restOptions,
        ...(headers && { headers }),
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:fetch-options',message:'Final fetch options',data:{hasBody:!!fetchOptions.body,bodyIsFormData:fetchOptions.body instanceof FormData,hasHeaders:!!fetchOptions.headers,headersContent:fetchOptions.headers},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      
      const result = await $fetch<T>(url, fetchOptions);
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:fetch-success',message:'$fetch succeeded',data:{url,hasResult:!!result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      return result as T;
    } catch (err: any) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useApi.ts:fetch-error',message:'$fetch error',data:{url,errorMessage:err.message,errorStatus:err.statusCode,errorStatusMessage:err.statusMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      const errorMessage = extractErrorMessage(err)

      // 401エラーの場合はログインページにリダイレクト
      if (err.statusCode === 401 || err.status === 401) {
        const router = useRouter()
        router.push('/login')
      }

      // エラーを再スロー（呼び出し元で処理できるように）
      const error = new Error(errorMessage) as any
      error.statusCode = err.statusCode || err.status
      error.status = err.status || err.statusCode
      error.data = err.data
      throw error
    }
  }

  return { apiFetch }
}



