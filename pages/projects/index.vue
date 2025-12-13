<template>
  <div class="projects-container">
    <div class="projects-header">
      <h1>プロジェクト</h1>
      <NuxtLink 
        v-if="canManageProjects" 
        to="/projects/new" 
        class="new-project-button"
      >
        新規登録
      </NuxtLink>
    </div>

    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!projects || projects.length === 0" class="empty-message">
      閲覧できるプロジェクトはありません
    </div>
    <table v-else class="projects-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>名前</th>
          <th>説明</th>
          <th>作成日</th>
          <th v-if="canManageProjects">操作</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="project in projects" :key="project.id">
          <tr>
            <td>{{ project.id }}</td>
            <td>
              <NuxtLink :to="`/projects/${project.id}`" class="project-link">
                {{ project.name }}
              </NuxtLink>
            </td>
            <td>{{ project.description || '-' }}</td>
            <td>{{ formatDate(project.createdAt) }}</td>
            <td v-if="canManageProjects">
              <NuxtLink :to="`/projects/${project.id}/edit`" class="edit-button">
                編集
              </NuxtLink>
              <button @click="handleDelete(project.id)" class="delete-button">
                削除
              </button>
            </td>
          </tr>
          <tr v-if="projectSheets[project.id]?.length" class="sheets-row">
            <td :colspan="canManageProjects ? 5 : 4">
              <div class="sheets-list">
                <div class="sheets-label">シート:</div>
                <div
                  v-for="sheet in projectSheets[project.id]"
                  :key="sheet.id"
                  class="sheet-item"
                  @click="navigateTo(`/projects/${project.id}/sheets/${sheet.id}`)"
                >
                  {{ sheet.name }}
                </div>
              </div>
            </td>
          </tr>
        </template>
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

const canManageProjects = computed(() => {
  if (!user.value) return false;
  return user.value.userType === UserType.ADMINISTRATOR || user.value.userType === UserType.MEMBER;
});

const { data: projects, error, isLoading, refresh } = useFetch('/api/projects');

const projectSheets = ref<Record<string, any[]>>({});

// 各プロジェクトのシート一覧を取得
watch(projects, async (newProjects) => {
  if (!newProjects) return;
  
  for (const project of newProjects) {
    try {
      const { data: sheets } = await useFetch(`/api/projects/${project.id}/sheets`);
      if (sheets.value) {
        projectSheets.value[project.id] = sheets.value;
      }
    } catch (err) {
      console.error(`Failed to fetch sheets for project ${project.id}:`, err);
      projectSheets.value[project.id] = [];
    }
  }
}, { immediate: true });

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};

const handleDelete = async (projectId: string) => {
  if (!confirm('本当に削除しますか？')) {
    return;
  }

  try {
    await $fetch(`/api/projects/${projectId}`, {
      method: 'DELETE',
    });
    await refresh();
  } catch (err: any) {
    alert(err.data?.message || '削除に失敗しました');
  }
};
</script>

<style scoped>
.projects-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 28px;
  color: #333;
}

.new-project-button {
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.new-project-button:hover {
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

.projects-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.projects-table thead {
  background-color: #667eea;
  color: white;
}

.projects-table th,
.projects-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.projects-table tbody tr:hover {
  background-color: #f7fafc;
}

.projects-table tbody tr.sheets-row:hover {
  background-color: #f7fafc;
}

.project-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.project-link:hover {
  text-decoration: underline;
}

.sheets-row {
  background-color: #f9fafb;
}

.sheets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
}

.sheets-label {
  font-weight: 600;
  color: #4a5568;
  margin-right: 8px;
}

.sheet-item {
  padding: 6px 12px;
  background-color: #e6fffa;
  border: 1px solid #81e6d9;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.sheet-item:hover {
  background-color: #b2f5ea;
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

