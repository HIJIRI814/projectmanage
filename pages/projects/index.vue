<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">プロジェクト</h1>
          <p class="text-muted-foreground">
            プロジェクト一覧を管理します
          </p>
        </div>
        <Button
          v-if="user && user.userCompanies && user.userCompanies.some((uc: any) => uc.userType === UserType.ADMINISTRATOR)"
          as-child
        >
          <NuxtLink to="/projects/new" class="flex items-center">
            <Plus class="mr-2 h-4 w-4" />
            新規登録
          </NuxtLink>
        </Button>
      </div>

      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-muted-foreground">読み込み中...</div>
      </div>
      <div v-else-if="error" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
        {{ error }}
      </div>
      <div v-else-if="!projects || projects.length === 0" class="rounded-lg border bg-card p-12 text-center">
        <p class="text-muted-foreground">閲覧できるプロジェクトはありません</p>
      </div>
      <div v-else class="space-y-4">
        <div class="mb-4">
          <SearchBox
            v-model="searchQuery"
            placeholder="プロジェクトを検索..."
            class="max-w-sm"
          />
        </div>
        <Accordion :key="accordionKey" :default-open="defaultOpenIds">
          <AccordionItem
            v-for="project in filteredProjects"
            :key="project.id"
            :value="project.id"
          >
            <AccordionTrigger :value="project.id">
              <div class="flex items-center justify-between w-full">
                <div class="flex-1 text-left">
                  <div class="flex items-center gap-3">
                    <NuxtLink
                      :to="`/projects/${project.id}`"
                      class="font-medium text-primary hover:underline"
                      @click.stop
                    >
                      {{ project.name }}
                    </NuxtLink>
                    <Badge variant="outline" class="text-xs">
                      {{ projectSheets[project.id]?.length || 0 }} シート
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    {{ project.description || '説明なし' }}
                  </p>
                  <p class="text-xs text-muted-foreground mt-1">
                    作成日: {{ formatDate(project.createdAt) }}
                  </p>
                </div>
                <div
                  v-if="canEditProject(project)"
                  class="flex items-center gap-2 flex-shrink-0"
                  @click.stop
                >
                  <Button variant="outline" size="sm" as-child>
                    <NuxtLink :to="`/projects/${project.id}/edit`">
                      編集
                    </NuxtLink>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    @click="handleDelete(project.id)"
                  >
                    削除
                  </Button>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent :value="project.id">
              <div v-if="projectSheets[project.id] && projectSheets[project.id].length > 0" class="flex flex-wrap gap-2 pt-2">
                <Badge
                  v-for="sheet in projectSheets[project.id]"
                  :key="sheet.id"
                  variant="outline"
                  class="cursor-pointer hover:bg-accent"
                  @click="navigateTo(`/projects/${project.id}/sheets/${sheet.id}`)"
                >
                  {{ sheet.name }}
                </Badge>
              </div>
              <div v-else class="text-sm text-muted-foreground py-2">
                シートがありません
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

import { UserType } from '~/domain/user/model/UserType'
import { Plus } from 'lucide-vue-next'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Button from '~/components/atoms/Button.vue'
import Badge from '~/components/atoms/Badge.vue'
import Accordion from '~/components/atoms/Accordion.vue'
import AccordionItem from '~/components/atoms/AccordionItem.vue'
import AccordionTrigger from '~/components/atoms/AccordionTrigger.vue'
import AccordionContent from '~/components/atoms/AccordionContent.vue'
import SearchBox from '~/components/molecules/SearchBox.vue'

const { user } = useAuth()

// プロジェクトに所属する会社のいずれかで管理者であるかをチェックする関数
const canEditProject = (project: any) => {
  if (!user.value || !project) return false

  // プライベートプロジェクト（companyIdsが空または存在しない）の場合
  if (!project.companyIds || project.companyIds.length === 0) {
    return true
  }

  // 社内公開プロジェクトの場合、プロジェクトに所属する会社のいずれかで管理者であるかをチェック
  if (!user.value.userCompanies || user.value.userCompanies.length === 0) return false

  return project.companyIds.some((companyId: string) => {
    const userCompany = user.value?.userCompanies?.find(
      (uc) => uc.companyId === companyId
    )
    return userCompany?.userType === UserType.ADMINISTRATOR
  })
}

// プロジェクトデータを取得
const { data: projects, isLoading, error, refresh } = useApiFetch<any[]>('/api/projects', {
  server: false,
})

const projectSheets = ref<Record<string, any[]>>({})
const searchQuery = ref('')

// 各プロジェクトのシート一覧を取得
const fetchSheets = async (projectId: string) => {
  try {
    const { apiFetch } = useApi()
    const sheets = await apiFetch(`/api/projects/${projectId}/sheets`)
    if (sheets) {
      projectSheets.value[projectId] = Array.isArray(sheets) ? sheets : []
    }
  } catch (err) {
    console.error(`Failed to fetch sheets for project ${projectId}:`, err)
    projectSheets.value[projectId] = []
  }
}

watch(projects, async (newProjects) => {
  if (!newProjects) return

  for (const project of newProjects) {
    await fetchSheets(project.id)
  }
}, { immediate: true })

// 検索フィルタリング
const filteredProjects = computed(() => {
  if (!projects.value || !searchQuery.value) {
    return projects.value || []
  }

  const query = searchQuery.value.toLowerCase()
  return projects.value.filter((project: any) => {
    return (
      project.name?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    )
  })
})

// デフォルトで開くプロジェクトIDのリスト
const defaultOpenIds = computed(() => {
  if (!projects.value || projects.value.length === 0) {
    return []
  }
  return filteredProjects.value.map((p: any) => p.id)
})

// projectsが読み込まれたら、全てのアコーディオンを開くためのキー
const accordionKey = ref(0)
watch(projects, () => {
  if (projects.value && projects.value.length > 0) {
    accordionKey.value++
  }
})

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP')
}

const handleDelete = async (projectId: string) => {
  if (!confirm('本当に削除しますか？')) {
    return
  }

  try {
    const { apiFetch } = useApi()
    await apiFetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    })
    await refresh()
  } catch (err: any) {
    alert(err.message || '削除に失敗しました')
  }
}

</script>
