<template>
  <div class="company-dashboard-container">
    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="company" class="company-dashboard">
      <div class="dashboard-header">
        <h1>{{ company.name }}</h1>
        <div class="header-actions">
          <NuxtLink :to="`/manage/companies/${companyId}/edit`" class="edit-button">
            編集
          </NuxtLink>
          <button @click="handleDelete" class="delete-button">
            削除
          </button>
        </div>
      </div>

      <div class="company-info">
        <div class="info-item">
          <label>ID:</label>
          <span>{{ company.id }}</span>
        </div>
        <div class="info-item">
          <label>作成日:</label>
          <span>{{ formatDate(company.createdAt) }}</span>
        </div>
        <div class="info-item">
          <label>更新日:</label>
          <span>{{ formatDate(company.updatedAt) }}</span>
        </div>
      </div>

      <div class="dashboard-actions">
        <NuxtLink :to="`/manage/companies/${companyId}/users`" class="action-card">
          <h2>ユーザー管理</h2>
          <p>会社のユーザーを管理します</p>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 会社ごとの管理者権限チェックはAPIエンドポイント側で行われるため、
// ここでは通常の認証ミドルウェアのみを使用
definePageMeta({
  middleware: 'auth',
});

const route = useRoute();
const companyId = route.params.id as string;

const { data: company, error, isLoading, refresh } = useFetch(`/api/companies/${companyId}`, {
  onResponseError({ response }) {
    // 403エラーの場合、管理者権限がないことを示す
    if (response.status === 403) {
      throw createError({
        statusCode: 403,
        statusMessage: 'この会社の管理者権限が必要です',
      });
    }
  },
});

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};

const handleDelete = async () => {
  if (!confirm('本当に削除しますか？')) {
    return;
  }

  try {
    await $fetch(`/api/companies/${companyId}`, {
      method: 'DELETE',
    });
    await navigateTo('/manage/companies');
  } catch (err: any) {
    alert(err.data?.message || '削除に失敗しました');
  }
};
</script>

<style scoped>
.company-dashboard-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #e53e3e;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 28px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.edit-button {
  padding: 10px 20px;
  background-color: #48bb78;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.edit-button:hover {
  background-color: #38a169;
}

.delete-button {
  padding: 10px 20px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.delete-button:hover {
  background-color: #c53030;
}

.company-info {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  margin-bottom: 16px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  font-weight: 600;
  color: #4a5568;
  min-width: 100px;
}

.info-item span {
  color: #2d3748;
}

.dashboard-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-card h2 {
  font-size: 20px;
  color: #667eea;
  margin-bottom: 8px;
}

.action-card p {
  color: #718096;
  font-size: 14px;
}
</style>

