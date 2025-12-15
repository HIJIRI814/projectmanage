onMounted(() => {
  const el = document.getElementById('image') as HTMLInputElement | null;
  const rect = el?.getBoundingClientRect();
  const style = el ? window.getComputedStyle(el) : null;
  logDebug(
    'mounted-input-state',
    {
      present: !!el,
      rect: rect
        ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
        : null,
      display: style?.display,
      visibility: style?.visibility,
      pointerEvents: style?.pointerEvents,
      tag: el?.tagName,
      type: el?.type,
      disabled: el?.disabled ?? null,
      accept: el?.accept ?? null,
      secureContext: window.isSecureContext,
    },
    'H4'
  );
});

<template>
  <div class="sheet-form-container">
    <h1>シート編集</h1>
    <div class="back-link-container">
      <NuxtLink :to="`/projects/${projectId}/sheets/${sheetId}`" class="back-link">
        ← シート詳細に戻る
      </NuxtLink>
    </div>
    <div v-if="isLoadingSheet" class="loading">読み込み中...</div>
    <div v-else-if="sheetError" class="error">{{ sheetError }}</div>
    <form v-else @submit.prevent="handleSubmit" class="sheet-form">
      <div class="form-group">
        <label for="name">名前 <span class="required">*</span></label>
        <input
          type="text"
          id="name"
          v-model="form.name"
          required
          :disabled="isLoading"
          placeholder="シート名を入力"
        />
      </div>
      <div class="form-group">
        <label for="description">説明</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          :disabled="isLoading"
          placeholder="シートの説明を入力（任意）"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="content">内容</label>
        <textarea
          id="content"
          v-model="form.content"
          rows="10"
          :disabled="isLoading"
          placeholder="シートの内容を入力（任意）"
        ></textarea>
      </div>
      <div class="form-group">
        <label for="image">画像（png/jpeg/webp/gif、最大5MB）</label>
        <div
          class="drag-drop-area"
          :class="{ 'drag-over': isDragging }"
          @dragenter.prevent="handleDragEnter"
          @dragover.prevent="handleDragOver"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <input
            id="image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            :disabled="isLoading"
            @click="handleFileClick"
            @change="handleFileChange"
          />
          <div class="drag-drop-hint">
            <p>画像をドラッグ&ドロップするか、クリックして選択してください</p>
          </div>
        </div>
        <p v-if="imageError" class="error-message">{{ imageError }}</p>
        <div v-if="imagePreviewUrl" class="image-preview">
          <img :src="imagePreviewUrl" alt="プレビュー" />
        </div>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div class="form-actions">
        <button type="submit" :disabled="isLoading" class="submit-button">
          {{ isLoading ? '更新中...' : '更新' }}
        </button>
        <NuxtLink :to="`/projects/${projectId}/sheets/${sheetId}`" class="cancel-button">
          キャンセル
        </NuxtLink>
      </div>
    </form>
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

// 管理者・メンバーのみアクセス可能
const canManageProjects = computed(() => {
  if (!user.value || user.value.userType === null) return false;
  return user.value.userType === UserType.ADMINISTRATOR || user.value.userType === UserType.MEMBER;
});

// アクセス権限チェック
if (process.client && !canManageProjects.value) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Forbidden: Administrator or Member access required',
  });
}

const form = ref({
  name: '',
  description: '',
  content: '',
});

const imageFile = ref<File | null>(null);
const imagePreviewUrl = ref<string | null>(null);
const imageError = ref<string | null>(null);
const isDragging = ref(false);

const isLoading = ref(false);
const isLoadingSheet = ref(true);
const error = ref<string | null>(null);
const sheetError = ref<string | null>(null);

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const runId = 'run3';

const logDebug = (message: string, data: Record<string, any>, hypothesisId: string) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId,
      hypothesisId,
      location: 'pages/projects/[id]/sheets/[sheetId]/edit.vue',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
};

logDebug('setup-start', {}, 'H4');

const handleFileClick = () => {
  const el = document.getElementById('image') as HTMLInputElement | null;
  const rect = el?.getBoundingClientRect();
  const style = el ? window.getComputedStyle(el) : null;
  logDebug(
    'file-click',
    {
      disabled: isLoading.value,
      rect: rect
        ? { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
        : null,
      display: style?.display,
      visibility: style?.visibility,
      pointerEvents: style?.pointerEvents,
      tag: el?.tagName,
      type: el?.type,
      activeElement: document.activeElement?.tagName,
      secureContext: window.isSecureContext,
    },
    'H1'
  );
};

// ファイル検証と設定の共通関数
const validateAndSetImageFile = (file: File | null, isFromDrop = false) => {
  imageError.value = null;

  if (!file) {
    logDebug('file-none', { isFromDrop }, 'H2');
    imageFile.value = null;
    if (!isFromDrop) {
      imagePreviewUrl.value = sheet.value?.imageUrl || null;
    }
    return;
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    logDebug('file-unsupported', { type: file.type, isFromDrop }, 'H3');
    imageError.value = '対応形式は png/jpeg/webp/gif です';
    imageFile.value = null;
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    logDebug('file-too-large', { size: file.size, isFromDrop }, 'H3');
    imageError.value = 'ファイルサイズは5MB以下にしてください';
    imageFile.value = null;
    return;
  }

  logDebug('file-accepted', { name: file.name, size: file.size, type: file.type, isFromDrop }, 'H2');
  imageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  logDebug(
    'file-change-enter',
    {
      filesLength: target?.files?.length ?? null,
      value: target?.value ?? null,
      tag: target?.tagName,
      type: target?.type,
    },
    'H2'
  );
  const file = target?.files?.[0] || null;
  validateAndSetImageFile(file, false);
};

// ドラッグ&ドロップイベントハンドラー
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  if (isLoading.value) return;
  isDragging.value = true;
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (isLoading.value) return;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy';
  }
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  // 子要素への移動を除外するため、関連ターゲットをチェック
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  const currentTarget = event.currentTarget as HTMLElement | null;
  if (!currentTarget?.contains(relatedTarget)) {
    isDragging.value = false;
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;
  
  if (isLoading.value) return;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) {
    return;
  }

  const file = files[0];
  validateAndSetImageFile(file, true);
};

const { data: sheet } = await useFetch(
  `/api/projects/${projectId}/sheets/${sheetId}`,
  {
    onResponseError({ response }) {
      sheetError.value = response.statusText || 'シートの取得に失敗しました';
      isLoadingSheet.value = false;
    },
    onResponse({ response }) {
      if (response._data) {
        const sheetData = response._data;
        form.value = {
          name: sheetData.name,
          description: sheetData.description || '',
          content: sheetData.content || '',
        };
        imagePreviewUrl.value = sheetData.imageUrl || null;
      }
      isLoadingSheet.value = false;
    },
  }
);

watch(sheet, (newSheet) => {
  if (newSheet) {
    form.value = {
      name: newSheet.name,
      description: newSheet.description || '',
      content: newSheet.content || '',
    };
    imagePreviewUrl.value = newSheet.imageUrl || null;
    isLoadingSheet.value = false;
  }
}, { immediate: true });

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await $fetch(`/api/projects/${projectId}/sheets/${sheetId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        description: form.value.description || undefined,
        content: form.value.content || undefined,
      },
    });
    if (imageFile.value) {
      const formData = new FormData();
      formData.append('file', imageFile.value);
      await $fetch(`/api/projects/${projectId}/sheets/${sheetId}/image`, {
        method: 'POST',
        body: formData,
      });
    }
    router.push(`/projects/${projectId}/sheets/${sheetId}`);
  } catch (err: any) {
    error.value = err.data?.message || '更新に失敗しました';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.sheet-form-container {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 12px;
}

.back-link-container {
  margin-bottom: 24px;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
}

.back-link:hover {
  text-decoration: underline;
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

.sheet-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 600;
}

.required {
  color: #e53e3e;
}

input[type='text'],
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #667eea;
}

textarea {
  resize: vertical;
}

.error-message {
  color: #e53e3e;
  margin-bottom: 20px;
  padding: 12px;
  background-color: #fee;
  border-radius: 6px;
}

.drag-drop-area {
  position: relative;
  border: 2px dashed #cbd5e0;
  border-radius: 6px;
  padding: 20px;
  background-color: #f7fafc;
  transition: all 0.3s ease;
  cursor: pointer;
}

.drag-drop-area:hover {
  border-color: #667eea;
  background-color: #edf2f7;
}

.drag-drop-area.drag-over {
  border-color: #667eea;
  background-color: #e6f3ff;
  border-style: solid;
}

.drag-drop-area input[type='file'] {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.drag-drop-hint {
  text-align: center;
  color: #718096;
  pointer-events: none;
  z-index: 0;
}

.drag-drop-hint p {
  margin: 0;
  font-size: 14px;
}

.image-preview {
  margin-top: 12px;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.submit-button {
  flex: 1;
  padding: 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover:not(:disabled) {
  background-color: #5a67d8;
}

.submit-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.cancel-button {
  padding: 12px 24px;
  background-color: #e2e8f0;
  color: #4a5568;
  text-decoration: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  transition: background-color 0.3s;
}

.cancel-button:hover {
  background-color: #cbd5e0;
}
</style>

