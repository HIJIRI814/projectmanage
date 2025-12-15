<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">新規会社登録</h1>
        <p class="text-muted-foreground mt-1">
          新しい会社を作成します
        </p>
      </div>

      <Card>
        <CardContent class="pt-6">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <FormField id="name" label="名前" :error="error" required>
              <Input
                id="name"
                v-model="form.name"
                type="text"
                required
                :disabled="isLoading"
                :error="!!error"
                placeholder="会社名を入力"
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
                <NuxtLink to="/manage/companies">キャンセル</NuxtLink>
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
  middleware: 'auth',
})

import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import FormField from '~/components/molecules/FormField.vue'
import Input from '~/components/atoms/Input.vue'
import Button from '~/components/atoms/Button.vue'

const router = useRouter()

const form = ref({
  name: '',
})

const isLoading = ref(false)
const error = ref<string | null>(null)

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch('/api/companies', {
      method: 'POST',
      body: {
        name: form.value.name,
      },
    })
    router.push('/manage/companies')
  } catch (err: any) {
    error.value = err.message || '登録に失敗しました'
  } finally {
    isLoading.value = false
  }
}
</script>
