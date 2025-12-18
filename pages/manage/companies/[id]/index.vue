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

      <Card>
        <CardHeader>
          <CardTitle>連携企業</CardTitle>
          <CardDescription>
            連携企業の一覧と追加
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="isLoadingPartnerships" class="text-sm text-muted-foreground">
            読み込み中...
          </div>
          <div v-else-if="partnershipsError" class="text-sm text-destructive">
            {{ partnershipsError }}
          </div>
          <div v-else-if="partnerships && partnerships.length > 0" class="space-y-2">
            <div
              v-for="partnership in partnerships"
              :key="partnership.id"
              class="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p class="font-medium">{{ partnership.partnerCompanyName }}</p>
                <p class="text-sm text-muted-foreground">
                  連携日: {{ formatDate(partnership.createdAt) }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-muted-foreground">
            連携企業が登録されていません
          </div>

          <div class="border-t pt-4">
            <FormField id="partnerCompanyId" label="連携企業を追加">
              <div v-if="isLoadingAvailableCompanies" class="text-sm text-muted-foreground">
                読み込み中...
              </div>
              <div v-else-if="availableCompaniesError" class="text-sm text-destructive">
                {{ availableCompaniesError }}
              </div>
              <div v-else class="space-y-2">
                <Select
                  v-model="selectedPartnerCompanyId"
                  :disabled="isAddingPartnership"
                >
                  <option value="">連携企業を選択してください</option>
                  <option
                    v-for="company in availableCompanies"
                    :key="company.id"
                    :value="company.id"
                  >
                    {{ company.name }}
                  </option>
                </Select>
                <Button
                  @click="handleAddPartnership"
                  :disabled="!selectedPartnerCompanyId || isAddingPartnership"
                  class="w-full"
                >
                  <span v-if="isAddingPartnership">追加中...</span>
                  <span v-else>連携企業を追加</span>
                </Button>
              </div>
            </FormField>
            <div v-if="addPartnershipError" class="mt-2 text-sm text-destructive">
              {{ addPartnershipError }}
            </div>
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

import DashboardLayout from '~/components/templates/DashboardLayout.vue'
import Card from '~/components/atoms/Card.vue'
import CardHeader from '~/components/atoms/CardHeader.vue'
import CardTitle from '~/components/atoms/CardTitle.vue'
import CardDescription from '~/components/atoms/CardDescription.vue'
import CardContent from '~/components/atoms/CardContent.vue'
import Button from '~/components/atoms/Button.vue'
import Label from '~/components/atoms/Label.vue'
import FormField from '~/components/molecules/FormField.vue'
import Select from '~/components/atoms/Select.vue'
import { UserType } from '~/domain/user/model/UserType'

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

// 連携企業一覧
const {
  data: partnerships,
  error: partnershipsError,
  isLoading: isLoadingPartnerships,
  refresh: refreshPartnerships,
} = useApiFetch(`/api/companies/${companyId}/partnerships`)

// 追加可能な会社一覧（管理者となっている会社のみ、現在の会社と既に連携している会社を除外）
const selectedPartnerCompanyId = ref('')
const isAddingPartnership = ref(false)
const addPartnershipError = ref<string | null>(null)
const isLoadingAvailableCompanies = ref(true)
const availableCompaniesError = ref<string | null>(null)
const availableCompanies = ref<any[]>([])

const { data: companiesData, error: companiesFetchError, isLoading: isLoadingCompaniesData } = useApiFetch('/api/companies')
watch(companiesData, (newCompanies) => {
  if (newCompanies && partnerships.value) {
    // 管理者となっている会社のみをフィルタリング
    const adminCompanies = newCompanies.filter(
      (company: any) => company.userType === UserType.ADMINISTRATOR && company.id !== companyId
    )
    
    // 既に連携している会社を除外
    const partnerCompanyIds = partnerships.value.map((p: any) => p.partnerCompanyId)
    availableCompanies.value = adminCompanies.filter(
      (company: any) => !partnerCompanyIds.includes(company.id)
    )
    isLoadingAvailableCompanies.value = false
  }
}, { immediate: true })
watch(partnerships, (newPartnerships) => {
  if (newPartnerships && companiesData.value) {
    const adminCompanies = companiesData.value.filter(
      (company: any) => company.userType === UserType.ADMINISTRATOR && company.id !== companyId
    )
    const partnerCompanyIds = newPartnerships.map((p: any) => p.partnerCompanyId)
    availableCompanies.value = adminCompanies.filter(
      (company: any) => !partnerCompanyIds.includes(company.id)
    )
  }
})
watch(companiesFetchError, (err) => {
  if (err) {
    availableCompaniesError.value = err || '会社一覧の取得に失敗しました'
    isLoadingAvailableCompanies.value = false
  }
})
watch(isLoadingCompaniesData, (loading) => {
  isLoadingAvailableCompanies.value = loading
})

const handleAddPartnership = async () => {
  if (!selectedPartnerCompanyId.value) {
    return
  }

  isAddingPartnership.value = true
  addPartnershipError.value = null

  try {
    const { apiFetch } = useApi()
    await apiFetch(`/api/companies/${companyId}/partnerships`, {
      method: 'POST',
      body: {
        partnerCompanyId: selectedPartnerCompanyId.value,
      },
    })
    
    selectedPartnerCompanyId.value = ''
    await refreshPartnerships()
  } catch (err: any) {
    addPartnershipError.value = err.message || '連携企業の追加に失敗しました'
  } finally {
    isAddingPartnership.value = false
  }
}
</script>
