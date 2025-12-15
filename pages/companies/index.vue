<template>
  <div class="companies-container">
    <div class="companies-header">
      <h1>会社一覧</h1>
      <NuxtLink 
        v-if="canManageCompanies" 
        to="/companies/new" 
        class="new-company-button"
      >
        新規登録
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!companies || companies.length === 0" class="empty-message">
      会社が登録されていません
    </div>
    <table v-else class="companies-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名前</th>
          <th>作成日</th>
          <th v-if="canManageCompanies">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companies" :key="company.id">
          <td>{{ company.id }}</td>
          <td>
            <NuxtLink :to="`/companies/${company.id}`" class="company-link">
              {{ company.name }}
            </NuxtLink>
          </td>
          <td>{{ formatDate(company.createdAt) }}</td>
          <td v-if="canManageCompanies">
            <NuxtLink :to="`/companies/${company.id}/edit`" class="edit-button">
              編集
            </NuxtLink>
            <NuxtLink :to="`/companies/${company.id}/users`" class="users-button">
              ユーザー管理
            </NuxtLink>
            <button @click="handleDelete(company.id)" class="delete-button">
              削除
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

import { UserType } from '~/domain/user/model/UserType';

const { user } = useAuth();

const canManageCompanies = computed(() => {
  if (!user.value || user.value.userType === null) return false;
  return user.value.userType === UserType.ADMINISTRATOR || user.value.userType === UserType.MEMBER;
});

const { data: companies, error, isLoading, refresh } = useFetch('/api/companies');

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};

const handleDelete = async (companyId: string) => {
  if (!confirm('本当に削除しますか？')) {
    return;
  }

  try {
    await $fetch(`/api/companies/${companyId}`, {
      method: 'DELETE',
    });
    await refresh();
  } catch (err: any) {
    alert(err.data?.message || '削除に失敗しました');
  }
};
</script>

<style scoped>
.companies-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.companies-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 28px;
  color: #333;
}

.new-company-button {
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.new-company-button:hover {
  background-color: #5a67d8;
}

.loading,
.error,
.empty-message {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #e53e3e;
}

.empty-message {
  color: #718096;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.companies-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.companies-table thead {
  background-color: #667eea;
  color: white;
}

.companies-table th,
.companies-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.companies-table tbody tr:hover {
  background-color: #f7fafc;
}

.company-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.company-link:hover {
  text-decoration: underline;
}

.edit-button {
  padding: 6px 12px;
  background-color: #48bb78;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-right: 8px;
  font-size: 14px;
}

.edit-button:hover {
  background-color: #38a169;
}

.users-button {
  padding: 6px 12px;
  background-color: #4299e1;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-right: 8px;
  font-size: 14px;
}

.users-button:hover {
  background-color: #3182ce;
}

.delete-button {
  padding: 6px 12px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.delete-button:hover {
  background-color: #c53030;
}
</style>

