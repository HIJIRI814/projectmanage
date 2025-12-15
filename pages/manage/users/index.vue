<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">ユーザー管理</h1>
          <p class="text-muted-foreground mt-1">
            システムのユーザーを管理します
          </p>
        </div>
        <Button as-child>
          <NuxtLink to="/manage/users/new" class="flex items-center">
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
      <DataTable
        v-else
        :columns="columns"
        :data="users || []"
        :searchable="true"
        search-placeholder="ユーザーを検索..."
        :search-keys="['email', 'name']"
        empty-message="ユーザーが見つかりません"
      >
        <template #cell-userType="{ value }">
          <Badge :variant="getUserTypeBadgeVariant(value)">
            {{ getUserTypeLabel(value) }}
          </Badge>
        </template>
        <template #cell-createdAt="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" as-child>
              <NuxtLink :to="`/manage/users/${row.id}/edit`">
                編集
              </NuxtLink>
            </Button>
            <Button
              v-if="!isCurrentUser(row.id)"
              variant="destructive"
              size="sm"
              @click="handleDelete(row.id)"
            >
              削除
            </Button>
          </div>
        </template>
      </DataTable>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
})

import { Plus } from 'lucide-vue-next'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import DataTable from '~/components/organisms/DataTable.vue'
import Button from '~/components/atoms/Button.vue'
import Badge from '~/components/atoms/Badge.vue'
import type { VariantProps } from 'class-variance-authority'

const { user: currentUser } = useAuth()

const isCurrentUser = (userId: string) => {
  return currentUser.value?.id === userId
}

const { data: users, error, isLoading, refresh } = useApiFetch('/api/manage/users')

const getUserTypeLabel = (userType: number) => {
  const labels: Record<number, string> = {
    1: '管理者',
    2: 'メンバー',
    3: 'パートナー',
    4: '顧客',
  }
  return labels[userType] || '不明'
}

const getUserTypeBadgeVariant = (
  userType: number
): VariantProps<typeof Badge>['variant'] => {
  const variants: Record<number, VariantProps<typeof Badge>['variant']> = {
    1: 'default', // ADMINISTRATOR
    2: 'secondary', // MEMBER
    3: 'outline', // PARTNER
    4: 'outline', // CUSTOMER
  }
  return variants[userType] || 'outline'
}

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP')
}

const handleDelete = async (userId: string) => {
  if (!confirm('本当に削除しますか？')) {
    return
  }

  try {
    const { apiFetch } = useApi()
    await apiFetch(`/api/manage/users/${userId}`, {
      method: 'DELETE',
    })
    await refresh()
  } catch (err: any) {
    alert(err.message || '削除に失敗しました')
  }
}

const columns = [
  { key: 'name', label: '名前' },
  { key: 'email', label: 'メールアドレス' },
  { key: 'userType', label: '種別', class: 'w-[100px]' },
  { key: 'createdAt', label: '作成日', class: 'w-[120px]' },
  { key: 'actions', label: '操作', class: 'w-[150px]' },
]
</script>
