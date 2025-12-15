<template>
  <DashboardLayout>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">会社一覧</h1>
          <p class="text-muted-foreground mt-1">
            所属している会社を管理します
          </p>
        </div>
        <Button as-child>
          <NuxtLink to="/manage/companies/new" class="flex items-center">
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
      <div v-else-if="!companies || companies.length === 0" class="rounded-lg border bg-card p-12 text-center">
        <p class="text-muted-foreground">会社が登録されていません</p>
      </div>
      <DataTable
        v-else
        :columns="columns"
        :data="companies"
        :searchable="true"
        search-placeholder="会社を検索..."
        :search-keys="['name']"
        empty-message="会社が見つかりません"
      >
        <template #cell-name="{ row }">
          <NuxtLink
            :to="`/manage/companies/${row.id}`"
            class="font-medium text-primary hover:underline"
          >
            {{ row.name }}
          </NuxtLink>
        </template>
        <template #cell-userType="{ value }">
          <Badge :variant="getUserTypeBadgeVariant(value)">
            {{ getUserTypeLabel(value) }}
          </Badge>
        </template>
        <template #cell-createdAt="{ value }">
          {{ formatDate(value) }}
        </template>
      </DataTable>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import { UserTypeValue } from '~/domain/user/model/UserType'
import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import DataTable from '~/components/organisms/DataTable.vue'
import Button from '~/components/atoms/Button.vue'
import Badge from '~/components/atoms/Badge.vue'
import type { VariantProps } from 'class-variance-authority'

const { data: companies, error, isLoading } = useApiFetch('/api/companies')

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP')
}

const getUserTypeLabel = (userType: number) => {
  return UserTypeValue.fromNumber(userType).getLabel()
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

const columns = [
  { key: 'name', label: '名前' },
  { key: 'userType', label: 'ユーザー種別', class: 'w-[120px]' },
  { key: 'createdAt', label: '作成日', class: 'w-[120px]' },
]
</script>
