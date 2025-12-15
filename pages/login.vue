<template>
  <AuthLayout title="ログイン" description="アカウントにログインしてください">
    <form @submit.prevent="handleLogin" class="space-y-4">
      <FormField
        id="email"
        label="メールアドレス"
        :error="error || undefined"
        required
      >
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="example@email.com"
          required
          :disabled="isLoading"
          :error="!!error"
        />
      </FormField>

      <FormField
        id="password"
        label="パスワード"
        required
      >
        <Input
          id="password"
          v-model="password"
          type="password"
          placeholder="パスワードを入力"
          required
          :disabled="isLoading"
        />
      </FormField>

      <div v-if="error" class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
        {{ error }}
      </div>

      <Button type="submit" :disabled="isLoading" class="w-full">
        <span v-if="isLoading">ログイン中...</span>
        <span v-else>ログイン</span>
      </Button>

      <div class="text-center text-sm text-muted-foreground">
        アカウントをお持ちでない方は
        <NuxtLink to="/signup" class="text-primary underline-offset-4 hover:underline">
          サインアップ
        </NuxtLink>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
// ゲスト専用ページとしてmiddlewareを適用
definePageMeta({
  middleware: 'guest',
})

import AuthLayout from '~/components/templates/AuthLayout.vue'
import FormField from '~/components/molecules/FormField.vue'
import Input from '~/components/atoms/Input.vue'
import Button from '~/components/atoms/Button.vue'

const route = useRoute()
const router = useRouter()
const { setTokens, setUser } = useAuth()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const handleLogin = async () => {
  isLoading.value = true
  error.value = null
  try {
    const { apiFetch } = useApi()
    const result = await apiFetch<{
      accessToken: string
      refreshToken: string
      user: any
    }>('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })

    setTokens(result.accessToken, result.refreshToken)
    setUser(result.user)

    // クッキーにトークンを保存
    const accessTokenCookie = useCookie('accessToken', {
      maxAge: 60 * 15,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: false,
    })
    accessTokenCookie.value = result.accessToken

    const redirect = route.query.redirect as string | undefined
    await router.push(redirect || '/projects')
  } catch (err: any) {
    // エラーハンドリング（401エラーでリダイレクトされた場合はエラーメッセージを表示しない）
    if (err.statusCode !== 401 && err.status !== 401) {
      error.value = err.message || 'ログインに失敗しました'
    }
  } finally {
    isLoading.value = false
  }
}
</script>
