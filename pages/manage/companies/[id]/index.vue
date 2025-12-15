<template>
  <DashboardLayout>
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-muted-foreground">読み込み中...</div>
    </div>
    <div v-else-if="error" class="rounded-lg border border-destructive bg-destructive/15 p-4 text-destructive">
      {{ error }}
    </div>
    <div v-else-if="company" class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ company.name }}</h1>
          <p class="text-muted-foreground mt-1">
            会社の詳細情報と管理
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" as-child>
            <NuxtLink :to="`/manage/companies/${companyId}/edit`">
              編集
            </NuxtLink>
          </Button>
          <Button variant="destructive" @click="handleDelete">
            削除
          </Button>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>会社情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <Label class="text-sm font-medium text-muted-foreground">ID</Label>
              <p class="mt-1 font-mono text-sm">{{ company.id }}</p>
            </div>
            <div>
              <Label class="text-sm font-medium text-muted-foreground">作成日</Label>
              <p class="mt-1">{{ formatDate(company.createdAt) }}</p>
            </div>
            <div>
              <Label class="text-sm font-medium text-muted-foreground">更新日</Label>
              <p class="mt-1">{{ formatDate(company.updatedAt) }}</p>
            </div>
          </CardContent>
        </Card>

        <Card class="cursor-pointer transition-shadow hover:shadow-lg" @click="navigateTo(`/manage/companies/${companyId}/users`)">
          <CardHeader>
            <CardTitle>ユーザー管理</CardTitle>
            <CardDescription>
              会社のユーザーを管理します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" class="w-full" as-child>
              <NuxtLink :to="`/manage/companies/${companyId}/users`">
                ユーザー管理へ
              </NuxtLink>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardHeader from '~/components/atoms/CardHeader.vue'
import CardTitle from '~/components/atoms/CardTitle.vue'
import CardDescription from '~/components/atoms/CardDescription.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import Button from '~/components/atoms/Button.vue'
import Label from '~/components/atoms/Label.vue'

const route = useRoute()
const companyId = route.params.id as string

const { data: company, error, isLoading, refresh } = useApiFetch(`/api/companies/${companyId}`)

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP')
}

const handleDelete = async () => {
  if (!confirm('本当に削除しますか？')) {
    return
  }

  try {
    const { apiFetch } = useApi()
    await apiFetch(`/api/companies/${companyId}`, {
      method: 'DELETE',
    })
    await navigateTo('/manage/companies')
  } catch (err: any) {
    alert(err.message || '削除に失敗しました')
  }
}
</script>
