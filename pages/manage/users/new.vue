<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">新規ユーザー登録</h1>
        <p class="text-muted-foreground mt-1">
          新しいユーザーを作成します
        </p>
      </div>

      <Card>
        <CardContent class="pt-6">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <FormField id="email" label="メールアドレス" :error="error" required>
              <Input
                id="email"
                v-model="form.email"
                type="email"
                required
                :disabled="isLoading"
                :error="!!error"
                placeholder="example@example.com"
              />
            </FormField>

            <FormField id="password" label="パスワード" description="8文字以上" required>
              <Input
                id="password"
                v-model="form.password"
                type="password"
                required
                minlength="8"
                :disabled="isLoading"
                placeholder="8文字以上"
              />
            </FormField>

            <FormField id="name" label="名前" required>
              <Input
                id="name"
                v-model="form.name"
                type="text"
                required
                :disabled="isLoading"
                placeholder="ユーザー名を入力"
              />
            </FormField>

            <div v-if="error" class="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {{ error }}
            </div>

            <div class="flex gap-4">
              <Button type="submit" :disabled="isLoading" class="flex-1">
                <span v-if="isLoading">登録中...</span>
                <span v-else>登録</span>
              </Button>
              <Button variant="outline" as-child>
                <NuxtLink to="/manage/users">キャンセル</NuxtLink>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import FormField from '~/components/molecules/FormField.vue'
import Input from '~/components/atoms/Input.vue'
import Button from '~/components/atoms/Button.vue'

const router = useRouter()

const form = ref({
  email: '',
  password: '',
  name: '',
})

const isLoading = ref(false)
const error = ref<string | null>(null)

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch('/api/manage/users', {
      method: 'POST',
      body: form.value,
    })
    router.push('/manage/users')
  } catch (err: any) {
    error.value = err.message || '登録に失敗しました'
  } finally {
    isLoading.value = false
  }
}
</script>
