<template>
  <div class="sheet-detail-container">
    <div v-if="isLoading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="sheet">
      <div class="sheet-header">
        <div>
          <NuxtLink :to="`/projects/${projectId}`" class="back-link">
            ← プロジェクトに戻る
          </NuxtLink>
          <h1>{{ sheet.name }}</h1>
        </div>
        <div v-if="canManageProjects" class="sheet-actions">
          <NuxtLink
            :to="`/projects/${projectId}/sheets/${sheetId}/edit`"
            class="edit-button"
          >
            編集
          </NuxtLink>
          <button @click="handleDelete" class="delete-button">
            削除
          </button>
        </div>
      </div>

      <div class="sheet-info">
        <div class="info-item" v-if="sheet.description">
          <label>説明:</label>
          <p>{{ sheet.description }}</p>
        </div>
        <div class="info-item">
          <label>作成日:</label>
          <p>{{ formatDate(sheet.createdAt) }}</p>
        </div>
        <div class="info-item">
          <label>更新日:</label>
          <p>{{ formatDate(sheet.updatedAt) }}</p>
        </div>
      </div>

      <div class="version-management">
        <div class="version-header">
          <h2>バージョン管理</h2>
          <button
            v-if="canManageProjects"
            @click="handleSaveVersion"
            :disabled="isSavingVersion"
            class="save-version-button"
          >
            {{ isSavingVersion ? '保存中...' : 'バージョン保存' }}
          </button>
        </div>

        <div class="version-selector">
          <label for="version-select">バージョンを選択:</label>
          <select
            id="version-select"
            v-model="selectedVersionId"
            @change="handleVersionChange"
            class="version-select"
          >
            <option value="">現在のバージョン</option>
            <option
              v-for="version in versions"
              :key="version.id"
              :value="version.id"
            >
              {{ version.versionName }}
            </option>
          </select>
        </div>

        <div v-if="selectedVersion" class="version-info">
          <div class="info-item">
            <label>バージョン名:</label>
            <p>{{ selectedVersion.versionName }}</p>
          </div>
          <div class="info-item">
            <label>保存日時:</label>
            <p>{{ formatDate(selectedVersion.createdAt) }}</p>
          </div>
          <div v-if="canManageProjects" class="version-actions">
            <button
              @click="handleRestoreVersion"
              :disabled="isRestoringVersion"
              class="restore-version-button"
            >
              {{ isRestoringVersion ? '復元中...' : 'このバージョンを復元' }}
            </button>
          </div>
        </div>
      </div>

      <div class="sheet-content">
        <label>内容:</label>
        <div class="content-display">
          <pre v-if="displayContent">{{ displayContent }}</pre>
          <p v-else class="no-content">内容がありません</p>
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
const router = useRouter();
const projectId = route.params.id as string;
const sheetId = route.params.sheetId as string;

const { user } = useAuth();

const canManageProjects = computed(() => {
  if (!user.value) return false;
  return user.value.userType === UserType.ADMINISTRATOR || user.value.userType === UserType.MEMBER;
});

const isLoading = ref(true);
const error = ref<string | null>(null);
const sheet = ref<any>(null);
const versions = ref<any[]>([]);
const selectedVersionId = ref<string>('');
const selectedVersion = ref<any>(null);
const isSavingVersion = ref(false);
const isRestoringVersion = ref(false);
const isLoadingVersions = ref(false);

const { data: sheetData, error: fetchError, refresh: refreshSheet } = await useFetch(
  `/api/projects/${projectId}/sheets/${sheetId}`,
  {
    onResponseError({ response }) {
      error.value = response.statusText || 'シートの取得に失敗しました';
      isLoading.value = false;
    },
    onResponse({ response }) {
      if (response._data) {
        sheet.value = response._data;
      }
      isLoading.value = false;
    },
  }
);

watch(sheetData, (newSheet) => {
  if (newSheet) {
    sheet.value = newSheet;
    isLoading.value = false;
  }
}, { immediate: true });

// バージョン一覧を取得
const loadVersions = async () => {
  isLoadingVersions.value = true;
  try {
    const versionsData = await $fetch(`/api/projects/${projectId}/sheets/${sheetId}/versions`);
    versions.value = versionsData;
  } catch (err: any) {
    console.error('Failed to load versions:', err);
  } finally {
    isLoadingVersions.value = false;
  }
};

// 初期読み込み時にバージョン一覧を取得
onMounted(() => {
  loadVersions();
});

// 選択されたバージョンの内容を取得
const handleVersionChange = async () => {
  if (!selectedVersionId.value) {
    selectedVersion.value = null;
    return;
  }

  try {
    const versionData = await $fetch(
      `/api/projects/${projectId}/sheets/${sheetId}/versions/${selectedVersionId.value}`
    );
    selectedVersion.value = versionData;
  } catch (err: any) {
    console.error('Failed to load version:', err);
    alert('バージョンの取得に失敗しました');
  }
};

// 表示する内容を計算（バージョン選択時はバージョンの内容、未選択時は現在のシートの内容）
const displayContent = computed(() => {
  if (selectedVersion.value) {
    return selectedVersion.value.content;
  }
  return sheet.value?.content;
});

// バージョン保存
const handleSaveVersion = async () => {
  if (!confirm('現在のシート内容をバージョンとして保存しますか？')) {
    return;
  }

  isSavingVersion.value = true;
  try {
    await $fetch(`/api/projects/${projectId}/sheets/${sheetId}/versions`, {
      method: 'POST',
    });
    await loadVersions();
    alert('バージョンを保存しました');
  } catch (err: any) {
    alert(err.data?.message || 'バージョンの保存に失敗しました');
  } finally {
    isSavingVersion.value = false;
  }
};

// バージョン復元
const handleRestoreVersion = async () => {
  if (!selectedVersion.value) {
    return;
  }

  if (!confirm('選択したバージョンでシートを復元しますか？現在の内容は上書きされます。')) {
    return;
  }

  isRestoringVersion.value = true;
  try {
    await $fetch(
      `/api/projects/${projectId}/sheets/${sheetId}/versions/${selectedVersion.value.id}/restore`,
      {
        method: 'POST',
      }
    );
    // シート情報を再取得
    await refreshSheet();
    // バージョン選択をリセット
    selectedVersionId.value = '';
    selectedVersion.value = null;
    alert('バージョンを復元しました');
  } catch (err: any) {
    alert(err.data?.message || 'バージョンの復元に失敗しました');
  } finally {
    isRestoringVersion.value = false;
  }
};

const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP');
};

const handleDelete = async () => {
  if (!confirm('本当に削除しますか？')) {
    return;
  }

  try {
    await $fetch(`/api/projects/${projectId}/sheets/${sheetId}`, {
      method: 'DELETE',
    });
    router.push(`/projects/${projectId}`);
  } catch (err: any) {
    alert(err.data?.message || '削除に失敗しました');
  }
};
</script>

<style scoped>
.sheet-detail-container {
  padding: 40px;
  max-width: 1000px;
  margin: 0 auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.back-link {
  display: inline-block;
  margin-bottom: 12px;
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
}

h1 {
  font-size: 32px;
  color: #333;
  margin: 0;
}

.sheet-actions {
  display: flex;
  gap: 12px;
}

.edit-button {
  padding: 12px 24px;
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
  padding: 12px 24px;
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

.sheet-info {
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

.sheet-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sheet-content label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 12px;
}

.content-display {
  background-color: #f7fafc;
  padding: 20px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.content-display pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #2d3748;
}

.no-content {
  margin: 0;
  color: #a0aec0;
  font-style: italic;
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

.version-management {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.version-header h2 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.save-version-button {
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.save-version-button:hover:not(:disabled) {
  background-color: #5a67d8;
}

.save-version-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.version-selector {
  margin-bottom: 20px;
}

.version-selector label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
}

.version-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  background-color: white;
  cursor: pointer;
}

.version-select:focus {
  outline: none;
  border-color: #667eea;
}

.version-info {
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.version-actions {
  margin-top: 16px;
}

.restore-version-button {
  padding: 10px 20px;
  background-color: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.restore-version-button:hover:not(:disabled) {
  background-color: #38a169;
}

.restore-version-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}
</style>

