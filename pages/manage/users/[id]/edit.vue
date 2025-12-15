<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">ユーザー編集</h1>
        <p class="text-muted-foreground mt-1">
          ユーザー情報を編集します
        </p>
      </div>

      <div v-if="isLoadingUser" class="flex items-center justify-center py-12">
        <div class="text-muted-foreground">読み込み中...</div>
      </div>
      <div v-else-if="userError" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
        {{ userError }}
      </div>
      <Card v-else>
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

            <FormField id="password" label="パスワード" description="変更する場合のみ入力（8文字以上）">
              <Input
                id="password"
                v-model="form.password"
                type="password"
                minlength="8"
                :disabled="isLoading"
                placeholder="変更する場合のみ入力"
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
                <span v-if="isLoading">更新中...</span>
                <span v-else>更新</span>
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

const route = useRoute()
const router = useRouter()
const userId = route.params.id as string

const form = ref({
  email: '',
  password: '',
  name: '',
})

const isLoading = ref(false)
const isLoadingUser = ref(true)
const error = ref<string | null>(null)
const userError = ref<string | null>(null)

const { data: user, isLoading: isLoadingUserData, error: userErrorData } = useApiFetch(`/api/manage/users/${userId}`, {
  server: false,
})

watch(user, (newUser) => {
  if (newUser) {
    form.value = {
      email: newUser.email,
      password: '',
      name: newUser.name,
    }
    isLoadingUser.value = false
  }
}, { immediate: true })
watch(isLoadingUserData, (loading) => {
  isLoadingUser.value = loading
})
watch(userErrorData, (err) => {
  if (err) {
    userError.value = err
    isLoadingUser.value = false
  }
})

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    const body: any = {
      email: form.value.email,
      name: form.value.name,
    }
    if (form.value.password) {
      body.password = form.value.password
    }

    await apiFetch(`/api/manage/users/${userId}`, {
      method: 'PUT',
      body,
    })
    router.push('/manage/users')
  } catch (err: any) {
    error.value = err.message || '更新に失敗しました'
  } finally {
    isLoading.value = false
  }
}
</script>
