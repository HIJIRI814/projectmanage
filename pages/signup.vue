<template>
  <AuthLayout
    title="新規登録"
    description="新しいアカウントを作成してください"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <FormField
        id="email"
        label="メールアドレス"
        :error="error"
        required
      >
        <Input
          id="email"
          v-model="form.email"
          type="email"
          placeholder="example@example.com"
          required
          :disabled="isLoading"
          :error="!!error"
        />
      </FormField>

      <FormField
        id="name"
        label="名前"
        required
      >
        <Input
          id="name"
          v-model="form.name"
          type="text"
          placeholder="山田 太郎"
          required
          :disabled="isLoading"
        />
      </FormField>

      <FormField
        id="password"
        label="パスワード"
        description="8文字以上"
        required
      >
        <Input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="8文字以上"
          required
          minlength="8"
          :disabled="isLoading"
        />
      </FormField>

      <div v-if="error" class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
        {{ error }}
      </div>

      <Button type="submit" :disabled="isLoading" class="w-full">
        <span v-if="isLoading">登録中...</span>
        <span v-else>登録</span>
      </Button>

      <div class="text-center text-sm text-muted-foreground">
        既にアカウントをお持ちの方は
        <NuxtLink to="/login" class="text-primary underline-offset-4 hover:underline">
          ログイン
        </NuxtLink>
      </div>
    </form>
  </AuthLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})

import AuthLayout from '~/components/templates/AuthLayout.vue'
import FormField from '~/components/molecules/FormField.vue'
import Input from '~/components/atoms/Input.vue'
import Button from '~/components/atoms/Button.vue'

const router = useRouter()
const { setUser } = useAuth()

const form = ref({
  email: '',
  name: '',
  password: '',
})

const isLoading = ref(false)
const error = ref<string | null>(null)

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: form.value.email,
        name: form.value.name,
        password: form.value.password,
      },
    })

    // サインアップAPIで既にCookieにトークンが設定されているので、/api/auth/meでユーザー情報を取得
    const userData = await apiFetch('/api/auth/me')
    setUser(userData)

    // プロジェクト一覧にリダイレクト
    router.push('/projects')
  } catch (err: any) {
    // エラーハンドリング（401エラーでリダイレクトされた場合はエラーメッセージを表示しない）
    if (err.statusCode !== 401 && err.status !== 401) {
      error.value = err.message || '登録に失敗しました'
    }
  } finally {
    isLoading.value = false
  }
}
</script>
