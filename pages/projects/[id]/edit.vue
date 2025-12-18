<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">プロジェクト編集</h1>
        <p class="text-muted-foreground mt-1">
          プロジェクト情報を編集します
        </p>
      </div>

      <div v-if="isLoadingProject" class="flex items-center justify-center py-12">
        <div class="text-muted-foreground">読み込み中...</div>
      </div>
      <div v-else-if="projectError" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
        {{ projectError }}
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

            <FormField id="clientCompanyIds" label="クライアント（連携企業から選択）">
              <div v-if="form.companyIds.length === 0" class="text-sm text-muted-foreground">
                所属会社を選択すると、連携企業が表示されます
              </div>
              <div v-else-if="isLoadingPartnerships" class="text-sm text-muted-foreground">
                読み込み中...
              </div>
              <div v-else-if="partnershipsError" class="text-sm text-destructive">
                {{ partnershipsError }}
              </div>
              <div v-else-if="availableClientCompanies.length === 0" class="text-sm text-muted-foreground">
                選択した所属会社に連携企業がありません
              </div>
              <div v-else class="space-y-2 rounded-md border p-4">
                <label
                  v-for="company in availableClientCompanies"
                  :key="company.id"
                  class="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    :value="company.id"
                    v-model="form.clientCompanyIds"
                    :disabled="isLoading"
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span class="text-sm">{{ company.name }}</span>
                </label>
              </div>
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

const route = useRoute()
const router = useRouter()
const projectId = route.params.id as string

const { user } = useAuth()

const form = ref({
  name: '',
  description: '',
  visibility: 'PRIVATE' as 'PRIVATE' | 'COMPANY_INTERNAL' | 'PUBLIC',
  companyIds: [] as string[],
  clientCompanyIds: [] as string[],
})

const isLoading = ref(false)
const isLoadingProject = ref(true)
const error = ref<string | null>(null)
const projectError = ref<string | null>(null)
const isLoadingCompanies = ref(true)
const companiesError = ref<string | null>(null)
const companies = ref<any[]>([])
const project = ref<any>(null)

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

// 連携企業一覧（選択された所属会社の連携企業）
const isLoadingPartnerships = ref(false)
const partnershipsError = ref<string | null>(null)
const availableClientCompanies = ref<any[]>([])

// 選択された所属会社の連携企業を取得
const fetchPartnerships = async () => {
  if (form.value.companyIds.length === 0) {
    availableClientCompanies.value = []
    return
  }

  isLoadingPartnerships.value = true
  partnershipsError.value = null

  try {
    // 各所属会社の連携企業を取得
    const allPartnerships: any[] = []
    for (const companyId of form.value.companyIds) {
      const { apiFetch } = useApi()
      const partnerships = await apiFetch(`/api/companies/${companyId}/partnerships`)
      if (partnerships && Array.isArray(partnerships)) {
        allPartnerships.push(...partnerships)
      }
    }

    // 重複を除去して、既に所属会社として選択されている会社を除外
    const uniquePartnerships = Array.from(
      new Map(
        allPartnerships.map((p: any) => [p.partnerCompanyId, p])
      ).values()
    )
    
    availableClientCompanies.value = uniquePartnerships
      .filter((p: any) => !form.value.companyIds.includes(p.partnerCompanyId))
      .map((p: any) => ({
        id: p.partnerCompanyId,
        name: p.partnerCompanyName,
      }))
  } catch (err: any) {
    partnershipsError.value = err.message || '連携企業の取得に失敗しました'
  } finally {
    isLoadingPartnerships.value = false
  }
}

watch(() => form.value.companyIds, fetchPartnerships, { deep: true })

const { data: projectData, isLoading: isLoadingProjectData, error: projectErrorData } = useApiFetch(`/api/projects/${projectId}`)

// project.value の変化を監視してフォームを更新（SSR/CSRの両方に対応）
watch(projectData, (newProject) => {
  if (newProject) {
    project.value = newProject
    form.value = {
      name: newProject.name,
      description: newProject.description || '',
      visibility: newProject.visibility || 'PRIVATE',
      companyIds: newProject.companyIds || [],
      clientCompanyIds: newProject.clientCompanyIds || [],
    }
    isLoadingProject.value = false
  }
}, { immediate: true })
watch(isLoadingProjectData, (loading) => {
  isLoadingProject.value = loading
})
watch(projectErrorData, (err) => {
  if (err) {
    projectError.value = err
    isLoadingProject.value = false
  }
})

// プロジェクトに所属する会社のいずれかで管理者であるかをチェック
const canEditProject = computed(() => {
  if (!user.value || !project.value) return false

  // プライベートプロジェクト（companyIdsが空または存在しない）の場合
  if (!project.value.companyIds || project.value.companyIds.length === 0) {
    return true
  }

  // 社内公開プロジェクトの場合、プロジェクトに所属する会社のいずれかで管理者であるかをチェック
  if (!user.value.userCompanies || user.value.userCompanies.length === 0) return false

  return project.value.companyIds.some((companyId: string) => {
    const userCompany = user.value?.userCompanies?.find(
      (uc) => uc.companyId === companyId
    )
    return userCompany?.userType === UserType.ADMINISTRATOR
  })
})

// アクセス権限チェック（プロジェクト情報取得後に実行）
watch(project, (newProject) => {
  if (process.client && newProject && !canEditProject.value) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required for this project',
    })
  }
}, { immediate: true })

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        description: form.value.description || undefined,
        visibility: form.value.visibility,
        companyIds: form.value.companyIds.length > 0 ? form.value.companyIds : undefined,
        clientCompanyIds: form.value.clientCompanyIds.length > 0 ? form.value.clientCompanyIds : undefined,
      },
    })
    router.push('/projects')
  } catch (err: any) {
    error.value = err.message || '更新に失敗しました'
  } finally {
    isLoading.value = false
  }
}
</script>
