<template>
  <div class="companies-container">
    <div class="companies-header">
      <h1>会社一覧</h1>
      <NuxtLink 
        to="/manage/companies/new" 
        class="new-company-button"
      >
        新規登録
      </NuxtLink>
    </div>

    <div v-if="pending" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!companies || companies.length === 0" class="empty-message">
      会社が登録されていません
    </div>
    <table v-else class="companies-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名前</th>
          <th>ユーザー種別</th>
          <th>作成日</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="company in companies" :key="company.id" class="company-row">
          <td>{{ company.id }}</td>
          <td>
            <NuxtLink :to="`/manage/companies/${company.id}`" class="company-link">
              {{ company.name }}
            </NuxtLink>
          </td>
          <td>{{ getUserTypeLabel(company.userType) }}</td>
          <td>{{ formatDate(company.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
const { data: companies, error, pending } = useFetch('/api/companies');

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};

const getUserTypeLabel = (userType: number) => {
  const labels: Record<number, string> = {
    1: '管理者',
    2: 'メンバー',
    3: 'パートナー',
    4: '顧客',
  };
  return labels[userType] || '不明';
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

.companies-table tbody tr.company-row {
  cursor: pointer;
}

.companies-table tbody tr.company-row:hover {
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
</style>

