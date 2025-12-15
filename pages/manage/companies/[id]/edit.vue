<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">会社編集</h1>
        <p class="text-muted-foreground mt-1">
          会社情報を編集します
        </p>
      </div>

      <div v-if="isLoadingCompany" class="flex items-center justify-center py-12">
        <div class="text-muted-foreground">読み込み中...</div>
      </div>
      <div v-else-if="companyError" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
        {{ companyError }}
      </div>
      <Card v-else>
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
                <span v-if="isLoading">更新中...</span>
                <span v-else>更新</span>
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

const route = useRoute()
const router = useRouter()
const companyId = route.params.id as string

const form = ref({
  name: '',
})

const isLoading = ref(false)
const isLoadingCompany = ref(true)
const error = ref<string | null>(null)
const companyError = ref<string | null>(null)

const { data: company, isLoading: isLoadingCompanyData, error: companyErrorData } = useApiFetch(`/api/companies/${companyId}`)

watch(company, (newCompany) => {
  if (newCompany) {
    form.value = {
      name: newCompany.name,
    }
    isLoadingCompany.value = false
  }
}, { immediate: true })
watch(isLoadingCompanyData, (loading) => {
  isLoadingCompany.value = loading
})
watch(companyErrorData, (err) => {
  if (err) {
    companyError.value = err
    isLoadingCompany.value = false
  }
})

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch(`/api/companies/${companyId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
      },
    })
    router.push('/manage/companies')
  } catch (err: any) {
    error.value = err.message || '更新に失敗しました'
  } finally {
    isLoading.value = false
  }
}
</script>
