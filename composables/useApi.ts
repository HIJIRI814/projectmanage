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
      return await $fetch<T>(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })
    } catch (err: any) {
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

