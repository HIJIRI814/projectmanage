/**
 * API通信の共通化composable（useFetch版）
 * useFetchのラッパーとして、統一されたエラーハンドリングとローディング状態管理を提供
 */
export const useApiFetch = <T = any>(
  url: string | (() => string),
  options?: Parameters<typeof useFetch>[1]
) => {
  const error = ref<string | null>(null)

  const { data, pending, refresh, ...rest } = useFetch<T>(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    onResponseError({ response }) {
      error.value =
        response._data?.statusMessage ||
        response._data?.message ||
        response.statusText ||
        'エラーが発生しました'

      // 401エラーの場合はログインページにリダイレクト
      if (response.status === 401) {
        const router = useRouter()
        router.push('/login')
      }
    },
    onResponse() {
      // 成功時はエラーをクリア
      error.value = null
    },
    ...options,
  })

  return {
    data,
    isLoading: pending,
    error,
    refresh,
    ...rest,
  }
}



