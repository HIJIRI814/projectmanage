<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">新規プロジェクト登録</h1>
        <p class="text-muted-foreground mt-1">
          新しいプロジェクトを作成します
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
                placeholder="プロジェクト名を入力"
              />
            </FormField>

            <FormField id="description" label="説明">
              <Textarea
                id="description"
                v-model="form.description"
                rows="4"
                :disabled="isLoading"
                placeholder="プロジェクトの説明を入力（任意）"
              />
            </FormField>

            <FormField id="visibility" label="公開範囲" required>
              <Select id="visibility" v-model="form.visibility" :disabled="isLoading">
                <option value="PRIVATE">プライベート</option>
                <option value="COMPANY_INTERNAL">社内公開</option>
                <option value="PUBLIC">公開</option>
              </Select>
            </FormField>

            <FormField id="companyIds" label="所属会社（複数選択可）">
              <div v-if="isLoadingCompanies" class="text-sm text-muted-foreground">
                読み込み中...
              </div>
              <div v-else-if="companiesError" class="text-sm text-destructive">
                {{ companiesError }}
              </div>
              <div v-else class="space-y-2 rounded-md border p-4">
                <label
                  v-for="company in companies"
                  :key="company.id"
                  class="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    :value="company.id"
                    v-model="form.companyIds"
                    :disabled="isLoading"
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span class="text-sm">{{ company.name }}</span>
                </label>
                <p v-if="companies.length === 0" class="text-sm text-muted-foreground">
                  管理者として登録されている会社がありません
                </p>
              </div>
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
                <NuxtLink to="/projects">キャンセル</NuxtLink>
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

import { UserType } from '~/domain/user/model/UserType'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import FormField from '~/components/molecules/FormField.vue'
import Input from '~/components/atoms/Input.vue'
import Textarea from '~/components/atoms/Textarea.vue'
import Select from '~/components/atoms/Select.vue'
import Button from '~/components/atoms/Button.vue'

const router = useRouter()
const { user } = useAuth()

const form = ref({
  name: '',
  description: '',
  visibility: 'PRIVATE' as 'PRIVATE' | 'COMPANY_INTERNAL' | 'PUBLIC',
  companyIds: [] as string[],
})

const isLoading = ref(false)
const error = ref<string | null>(null)
const isLoadingCompanies = ref(true)
const companiesError = ref<string | null>(null)
const companies = ref<any[]>([])

// 会社一覧を取得（管理者となっている会社のみ）
const { data: companiesData, error: companiesFetchError, isLoading: isLoadingCompaniesData } = useApiFetch('/api/companies')
watch(companiesData, (newCompanies) => {
  if (newCompanies) {
    // 管理者となっている会社のみをフィルタリング
    companies.value = newCompanies.filter(
      (company: any) => company.userType === UserType.ADMINISTRATOR
    )
    isLoadingCompanies.value = false
  }
}, { immediate: true })
watch(companiesFetchError, (err) => {
  if (err) {
    companiesError.value = err || '会社一覧の取得に失敗しました'
    isLoadingCompanies.value = false
  }
})
watch(isLoadingCompaniesData, (loading) => {
  isLoadingCompanies.value = loading
})

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch('/api/projects', {
      method: 'POST',
      body: {
        name: form.value.name,
        description: form.value.description || undefined,
        visibility: form.value.visibility,
        companyIds: form.value.companyIds.length > 0 ? form.value.companyIds : undefined,
      },
    })
    router.push('/projects')
  } catch (err: any) {
    error.value = err.message || '登録に失敗しました'
  } finally {
    isLoading.value = false
  }
}
</script>
