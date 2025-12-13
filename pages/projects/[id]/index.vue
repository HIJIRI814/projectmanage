<template>
  <div class="project-detail-container">
    <div v-if="isLoadingProject" class="loading">読み込み中...</div>
    <div v-else-if="projectError" class="error">{{ projectError }}</div>
    <div v-else-if="project">
      <div class="project-header">
        <h1>{{ project.name }}</h1>
        <div class="project-actions">
          <NuxtLink
            v-if="canManageProjects"
            :to="`/projects/${projectId}/edit`"
            class="edit-button"
          >
            編集
          </NuxtLink>
          <NuxtLink
            v-if="canManageProjects"
            :to="`/projects/${projectId}/sheets/new`"
            class="new-sheet-button"
          >
            シート作成
          </NuxtLink>
        </div>
      </div>

      <div class="project-info">
        <div class="info-item">
          <label>説明:</label>
          <p>{{ project.description || '説明なし' }}</p>
        </div>
        <div class="info-item">
          <label>作成日:</label>
          <p>{{ formatDate(project.createdAt) }}</p>
        </div>
      </div>

      <div class="sheets-section">
        <h2>シート一覧</h2>
        <div v-if="isLoadingSheets" class="loading">読み込み中...</div>
        <div v-else-if="sheetsError" class="error">{{ sheetsError }}</div>
        <div v-else-if="!sheets || sheets.length === 0" class="empty-message">
          シートがありません
        </div>
        <div v-else class="sheets-grid">
          <div
            v-for="sheet in sheets"
            :key="sheet.id"
            class="sheet-card"
            @click="navigateTo(`/projects/${projectId}/sheets/${sheet.id}`)"
          >
            <h3>{{ sheet.name }}</h3>
            <p v-if="sheet.description" class="sheet-description">
              {{ sheet.description }}
            </p>
            <p v-else class="sheet-description no-description">説明なし</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

import { UserType } from '~/domain/user/model/UserType';

const route = useRoute();
const projectId = route.params.id as string;

const { user } = useAuth();

const canManageProjects = computed(() => {
  if (!user.value) return false;
  return user.value.userType === UserType.ADMINISTRATOR || user.value.userType === UserType.MEMBER;
});

const isLoadingProject = ref(true);
const projectError = ref<string | null>(null);
const project = ref<any>(null);

const { data: sheets, error: sheetsError, isLoading: isLoadingSheets } = useFetch(
  `/api/projects/${projectId}/sheets`
);

const { data: projectData, error: projectFetchError } = await useFetch(
  `/api/projects/${projectId}`,
  {
    onResponseError({ response }) {
      projectError.value = response.statusText || 'プロジェクトの取得に失敗しました';
      isLoadingProject.value = false;
    },
    onResponse({ response }) {
      if (response._data) {
        project.value = response._data;
      }
      isLoadingProject.value = false;
    },
  }
);

watch(projectData, (newProject) => {
  if (newProject) {
    project.value = newProject;
    isLoadingProject.value = false;
  }
}, { immediate: true });

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};
</script>

<style scoped>
.project-detail-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  font-size: 32px;
  color: #333;
  margin: 0;
}

.project-actions {
  display: flex;
  gap: 12px;
}

.edit-button,
.new-sheet-button {
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.3s;
}

.edit-button:hover,
.new-sheet-button:hover {
  background-color: #5a67d8;
}

.project-info {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.info-item {
  margin-bottom: 16px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.info-item p {
  margin: 0;
  color: #2d3748;
}

.sheets-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sheets-section h2 {
  font-size: 24px;
  color: #333;
  margin-bottom: 20px;
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
}

.sheets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.sheet-card {
  padding: 20px;
  background-color: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.sheet-card:hover {
  background-color: #edf2f7;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.sheet-card h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #2d3748;
}

.sheet-description {
  margin: 0;
  font-size: 14px;
  color: #718096;
  line-height: 1.5;
}

.sheet-description.no-description {
  font-style: italic;
  color: #a0aec0;
}
</style>

