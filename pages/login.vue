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
const { login, isLoading, error } = useAuth()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    await login(email.value, password.value)

    // ログイン成功後、リダイレクト
    const redirect = route.query.redirect as string | undefined
    await router.push(redirect || '/projects')
  } catch (err: any) {
    // エラーメッセージはストアで管理されるため、ここでは何もしない
    // エラーハンドリング（401エラーでリダイレクトされた場合はエラーメッセージを表示しない）
    if (err.statusCode === 401 || err.status === 401) {
      // 401エラーの場合は何もしない（ミドルウェアでリダイレクトされる）
    }
  }
}
</script>
