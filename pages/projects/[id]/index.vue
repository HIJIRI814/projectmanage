<template>
  <DashboardLayout>
    <div v-if="isLoadingProject" class="flex items-center justify-center py-12">
      <div class="text-muted-foreground">読み込み中...</div>
    </div>
    <div v-else-if="projectError" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
      {{ projectError }}
    </div>
    <div v-else-if="project" class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ project.name }}</h1>
          <p class="text-muted-foreground mt-1">
            プロジェクトの詳細情報
          </p>
        </div>
        <div v-if="canEditProject" class="flex gap-2">
          <div class="hidden md:flex gap-2">
            <Button variant="outline" as-child>
              <NuxtLink :to="`/projects/${projectId}/edit`">
                編集
              </NuxtLink>
            </Button>
            <Button as-child>
              <NuxtLink :to="`/projects/${projectId}/sheets/new`">
                <Plus class="mr-2 h-4 w-4" />
                シート作成
              </NuxtLink>
            </Button>
          </div>
          <div class="md:hidden relative">
            <Button variant="outline" size="icon" @click="showMobileMenu = !showMobileMenu">
              <Menu class="h-4 w-4" />
            </Button>
            <div
              v-if="showMobileMenu"
              class="absolute right-0 top-full mt-2 w-48 rounded-md border bg-background shadow-lg z-10"
            >
              <NuxtLink
                :to="`/projects/${projectId}/edit`"
                class="block px-4 py-2 text-sm hover:bg-accent"
                @click="showMobileMenu = false"
              >
                編集
              </NuxtLink>
              <NuxtLink
                :to="`/projects/${projectId}/sheets/new`"
                class="block px-4 py-2 text-sm hover:bg-accent"
                @click="showMobileMenu = false"
              >
                シート作成
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label class="text-sm font-medium text-muted-foreground">説明</Label>
              <p class="mt-1">{{ project.description || '説明なし' }}</p>
            </div>
            <div>
              <Label class="text-sm font-medium text-muted-foreground">作成日</Label>
              <p class="mt-1">{{ formatDate(project.createdAt) }}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>シート一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="isLoadingSheets" class="flex items-center justify-center py-12">
            <div class="text-muted-foreground">読み込み中...</div>
          </div>
          <div v-else-if="sheetsError" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
            {{ sheetsError }}
          </div>
          <div v-else-if="!sheets || sheets.length === 0" class="text-center py-12 text-muted-foreground">
            シートがありません
          </div>
          <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card
              v-for="sheet in sheets"
              :key="sheet.id"
              class="cursor-pointer transition-shadow hover:shadow-lg"
              @click="navigateTo(`/projects/${projectId}/sheets/${sheet.id}`)"
            >
              <CardHeader>
                <CardTitle class="text-lg">{{ sheet.name }}</CardTitle>
              </CardHeader>
              <CardContent>
                <p v-if="sheet.description" class="text-sm text-muted-foreground">
                  {{ sheet.description }}
                </p>
                <p v-else class="text-sm italic text-muted-foreground">
                  説明なし
                </p>
              </CardContent>
            </Card>
          </div>
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
import { Plus, Menu } from 'lucide-vue-next'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardHeader from '~/components/atoms/CardHeader.vue'
import CardTitle from '~/components/atoms/CardTitle.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import Button from '~/components/atoms/Button.vue'
import Label from '~/components/atoms/Label.vue'

const route = useRoute()
const projectId = route.params.id as string

const { user } = useAuth()

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

const { data: project, isLoading: isLoadingProject, error: projectError } = useApiFetch(
  `/api/projects/${projectId}`
)

const { data: sheets, error: sheetsError, isLoading: isLoadingSheets } = useApiFetch(
  `/api/projects/${projectId}/sheets`
)

const showMobileMenu = ref(false)

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP')
}
</script>
