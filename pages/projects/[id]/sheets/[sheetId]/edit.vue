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
        <div v-if="imagePreviewUrl" class="image-preview-wrapper">
          <div class="marker-type-selector">
            <button
              type="button"
              @click.prevent="selectedMarkerType = 'number'"
              :class="{ active: selectedMarkerType === 'number' }"
              class="marker-type-button"
            >
              番号
            </button>
            <button
              type="button"
              @click.prevent="selectedMarkerType = 'square'"
              :class="{ active: selectedMarkerType === 'square' }"
              class="marker-type-button"
            >
              四角
            </button>
          </div>
          <div class="image-preview" ref="imageWrapperRef" @mousedown="handleImageMouseDown">
            <img ref="imageRef" :src="imagePreviewUrl" alt="プレビュー" @load="handleImageLoad" />
            <div
              v-for="marker in sortedMarkers"
              :key="marker.id"
              :class="['marker', `marker-${marker.type}`]"
              :style="getMarkerStyle(marker)"
              @mousedown.stop="handleMarkerMouseDown($event, marker)"
              @mouseenter="hoveredMarkerId = marker.id"
              @mouseleave="hoveredMarkerId = null"
            >
              <button
                v-if="hoveredMarkerId === marker.id"
                @click.stop="deleteMarker(marker.id)"
                class="marker-delete-button"
                title="削除"
              >
                ×
              </button>
              <span v-if="marker.type === 'number'" class="marker-number">
                {{ getMarkerNumber(marker) }}
              </span>
              <div
                v-if="marker.type === 'square'"
                class="resize-handle"
                @mousedown.stop="handleResizeStart($event, marker)"
              ></div>
            </div>
          </div>
          <div v-if="tableMarkers.length > 0" class="markers-table">
            <table>
              <thead>
                <tr>
                  <th>番号</th>
                  <th>メモ</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="marker in tableMarkers" :key="marker.id">
                  <td>{{ getMarkerNumber(marker) }}</td>
                  <td>
                    <input
                      v-model="markerNotes[marker.id]"
                      @blur="updateMarkerNote(marker.id)"
                      class="note-input"
                    />
                  </td>
                  <td>
                    <button @click="deleteMarker(marker.id)" class="delete-marker-button">×</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
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

import { onMounted } from 'vue';
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

// マーカー関連
const selectedMarkerType = ref<'number' | 'square'>('number');
const markers = ref<any[]>([]);
const pendingMarkers = ref<any[]>([]); // まだ保存されていないマーカー
const markerNotes = ref<Record<string, string>>({});
const imageRef = ref<HTMLImageElement | null>(null);
const imageWrapperRef = ref<HTMLDivElement | null>(null);
const isDraggingMarker = ref(false);
const isResizing = ref(false);
const justFinishedResizing = ref(false);
const hoveredMarkerId = ref<string | null>(null);
const isSavingMarkers = ref(false);
const dragStartPos = ref({ x: 0, y: 0 });
const dragMarker = ref<any>(null);
const resizeMarker = ref<any>(null);
const resizeStartPos = ref({ x: 0, y: 0, width: 0, height: 0 });

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

const { data: sheet, isLoading: isLoadingSheetData, error: sheetErrorData } = useApiFetch(
  `/api/projects/${projectId}/sheets/${sheetId}`
);

// マーカー関連の関数（watchの前に定義する必要がある）
const loadMarkers = async () => {
  try {
    const { apiFetch } = useApi();
    const url = `/api/projects/${projectId}/sheets/${sheetId}/markers`;
    const markersData = await apiFetch(url);
    markers.value = markersData;
    markerNotes.value = {};
    markersData.forEach((marker: any) => {
      markerNotes.value[marker.id] = marker.note || '';
    });
  } catch (err: any) {
    console.error('Failed to load markers:', err);
  }
};

watch(sheet, (newSheet) => {
  if (newSheet) {
    form.value = {
      name: newSheet.name,
      description: newSheet.description || '',
      content: newSheet.content || '',
    };
    imagePreviewUrl.value = newSheet.imageUrl || null;
    isLoadingSheet.value = false;
    if (newSheet.imageUrl) {
      loadMarkers();
    }
  }
}, { immediate: true });
watch(isLoadingSheetData, (loading) => {
  isLoadingSheet.value = loading;
});
watch(sheetErrorData, (err) => {
  if (err) {
    sheetError.value = err;
    isLoadingSheet.value = false;
  }
});

const sortedMarkers = computed(() => {
  // 登録順（作成日時順）でソート
  const allMarkers = [...markers.value, ...pendingMarkers.value];
  return allMarkers.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });
});

const tableMarkers = computed(() => {
  // テーブルには番号タイプのマーカーのみを表示
  return sortedMarkers.value.filter((m) => m.type === 'number');
});

const getMarkerNumber = (marker: any) => {
  if (marker.type !== 'number') return '';
  // 登録順で番号を割り当て
  const numberMarkers = sortedMarkers.value.filter((m) => m.type === 'number');
  const index = numberMarkers.findIndex((m) => m.id === marker.id);
  const numbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  return numbers[index] || `${index + 1}`;
};

const getMarkerStyle = (marker: any) => {
  if (!imageRef.value) return {};
  
  if (marker.type === 'number') {
    return {
      left: `${marker.x}%`,
      top: `${marker.y}%`,
      transform: 'translate(-50%, -50%)',
    };
  } else {
    return {
      left: `${marker.x}%`,
      top: `${marker.y}%`,
      width: `${marker.width || 10}%`,
      height: `${marker.height || 10}%`,
      transform: 'translate(-50%, -50%)',
    };
  }
};

const handleImageLoad = () => {
  loadMarkers();
};

const handleImageMouseDown = (event: MouseEvent) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:handleImageMouseDown',message:'Image mousedown handler called',data:{hasImageRef:!!imageRef.value,isDraggingMarker:isDraggingMarker.value,isResizing:isResizing.value,justFinishedResizing:justFinishedResizing.value,selectedMarkerType:selectedMarkerType.value,targetTag:(event.target as HTMLElement)?.tagName,targetClass:(event.target as HTMLElement)?.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // マーカーやリサイズハンドルがクリックされた場合は何もしない
  const target = event.target as HTMLElement;
  if (target?.closest('.marker') || target?.classList.contains('resize-handle')) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:handleImageMouseDown',message:'Ignoring click on marker',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return;
  }
  
  if (justFinishedResizing.value) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:handleImageMouseDown',message:'Ignoring click after resize',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    justFinishedResizing.value = false;
    return;
  }
  
  if (!imageRef.value || isDraggingMarker.value || isResizing.value) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:handleImageMouseDown',message:'Early return from image mousedown',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return;
  }
  
  const imgRect = imageRef.value.getBoundingClientRect();
  const x = ((event.clientX - imgRect.left) / imgRect.width) * 100;
  const y = ((event.clientY - imgRect.top) / imgRect.height) * 100;
  
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:handleImageMouseDown',message:'Calculated coordinates',data:{x,y,imgRect:{width:imgRect.width,height:imgRect.height,left:imgRect.left,top:imgRect.top},eventPos:{clientX:event.clientX,clientY:event.clientY}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  createMarker(x, y);
};

const createMarker = (x: number, y: number) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:createMarker',message:'createMarker called',data:{x,y,selectedMarkerType:selectedMarkerType.value,projectId,sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // 一時的なIDを生成（保存されるまで使用）
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const newMarker: any = {
    id: tempId,
    sheetId,
    sheetVersionId: null,
    type: selectedMarkerType.value,
    x,
    y,
    width: selectedMarkerType.value === 'square' ? 10 : null,
    height: selectedMarkerType.value === 'square' ? 10 : null,
    note: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPending: true, // 保存待ちフラグ
  };
  
  pendingMarkers.value.push(newMarker);
  markerNotes.value[tempId] = '';
};

const handleMarkerMouseDown = (event: MouseEvent, marker: any) => {
  if (isResizing.value) return;
  
  // リサイズハンドルがクリックされた場合は何もしない（リサイズハンドルで処理される）
  if ((event.target as HTMLElement)?.classList.contains('resize-handle')) {
    return;
  }
  
  event.preventDefault();
  event.stopPropagation();
  isDraggingMarker.value = true;
  dragMarker.value = marker;
  dragStartPos.value = { x: event.clientX, y: event.clientY };
  
  document.addEventListener('mousemove', handleMarkerDrag);
  document.addEventListener('mouseup', handleMarkerDragEnd);
};

const handleMarkerDrag = (event: MouseEvent) => {
  if (!isDraggingMarker.value || !dragMarker.value || !imageRef.value) return;
  
  const imgRect = imageRef.value.getBoundingClientRect();
  const x = ((event.clientX - imgRect.left) / imgRect.width) * 100;
  const y = ((event.clientY - imgRect.top) / imgRect.height) * 100;
  
  // マーカーを取得
  const marker = markers.value.find((m) => m.id === dragMarker.value.id) || 
                 pendingMarkers.value.find((m) => m.id === dragMarker.value.id);
  
  if (!marker) return;
  
  // 四角マーカーの場合、サイズを考慮して範囲を制限
  let clampedX = Math.max(0, Math.min(100, x));
  let clampedY = Math.max(0, Math.min(100, y));
  
  if (marker.type === 'square' && marker.width && marker.height) {
    const halfWidth = marker.width / 2;
    const halfHeight = marker.height / 2;
    clampedX = Math.max(halfWidth, Math.min(100 - halfWidth, x));
    clampedY = Math.max(halfHeight, Math.min(100 - halfHeight, y));
  }
  
  // 既存のマーカーを更新
  const markerIndex = markers.value.findIndex((m) => m.id === dragMarker.value.id);
  if (markerIndex !== -1) {
    markers.value[markerIndex] = { ...markers.value[markerIndex], x: clampedX, y: clampedY };
  } else {
    // 保留中のマーカーを更新
    const pendingIndex = pendingMarkers.value.findIndex((m) => m.id === dragMarker.value.id);
    if (pendingIndex !== -1) {
      pendingMarkers.value[pendingIndex] = { ...pendingMarkers.value[pendingIndex], x: clampedX, y: clampedY };
    }
  }
};

const handleMarkerDragEnd = async () => {
  if (!isDraggingMarker.value || !dragMarker.value) return;
  
  isDraggingMarker.value = false;
  const marker = markers.value.find((m) => m.id === dragMarker.value.id);
  
  // 既存のマーカーのみ更新（保留中のマーカーは保存時に送信される）
  if (marker) {
    try {
      const { apiFetch } = useApi();
      await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers/${marker.id}`, {
        method: 'PUT',
        body: {
          x: marker.x,
          y: marker.y,
        },
      });
    } catch (err: any) {
      console.error('Failed to update marker:', err);
      await loadMarkers();
    }
  }
  
  dragMarker.value = null;
  document.removeEventListener('mousemove', handleMarkerDrag);
  document.removeEventListener('mouseup', handleMarkerDragEnd);
};

const handleResizeStart = (event: MouseEvent, marker: any) => {
  event.preventDefault();
  event.stopPropagation();
  isResizing.value = true;
  resizeMarker.value = marker;
  resizeStartPos.value = {
    x: event.clientX,
    y: event.clientY,
    width: marker.width || 10,
    height: marker.height || 10,
  };
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', handleResizeEnd);
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value || !resizeMarker.value || !imageRef.value) return;
  
  const imgRect = imageRef.value.getBoundingClientRect();
  const deltaX = ((event.clientX - resizeStartPos.value.x) / imgRect.width) * 100;
  const deltaY = ((event.clientY - resizeStartPos.value.y) / imgRect.height) * 100;
  
  // マーカーを取得
  const marker = markers.value.find((m) => m.id === resizeMarker.value.id) || 
                 pendingMarkers.value.find((m) => m.id === resizeMarker.value.id);
  
  if (!marker) return;
  
  let newWidth = resizeStartPos.value.width + deltaX * 2;
  let newHeight = resizeStartPos.value.height + deltaY * 2;
  
  // 最小サイズを確保
  newWidth = Math.max(5, newWidth);
  newHeight = Math.max(5, newHeight);
  
  // マーカーの位置を考慮して、画像からはみ出ないようにサイズを制限
  const halfWidth = newWidth / 2;
  const halfHeight = newHeight / 2;
  
  // 左端、右端、上端、下端の制約を考慮
  const maxWidthFromLeft = marker.x * 2; // 左端までの距離
  const maxWidthFromRight = (100 - marker.x) * 2; // 右端までの距離
  const maxHeightFromTop = marker.y * 2; // 上端までの距離
  const maxHeightFromBottom = (100 - marker.y) * 2; // 下端までの距離
  
  newWidth = Math.min(newWidth, maxWidthFromLeft, maxWidthFromRight, 100);
  newHeight = Math.min(newHeight, maxHeightFromTop, maxHeightFromBottom, 100);
  
  // 最小サイズを再確認
  newWidth = Math.max(5, newWidth);
  newHeight = Math.max(5, newHeight);
  
  // 既存のマーカーを更新
  const markerIndex = markers.value.findIndex((m) => m.id === resizeMarker.value.id);
  if (markerIndex !== -1) {
    markers.value[markerIndex] = {
      ...markers.value[markerIndex],
      width: newWidth,
      height: newHeight,
    };
  } else {
    // 保留中のマーカーを更新
    const pendingIndex = pendingMarkers.value.findIndex((m) => m.id === resizeMarker.value.id);
    if (pendingIndex !== -1) {
      pendingMarkers.value[pendingIndex] = {
        ...pendingMarkers.value[pendingIndex],
        width: newWidth,
        height: newHeight,
      };
    }
  }
};

const handleResizeEnd = async (event?: MouseEvent) => {
  if (!isResizing.value || !resizeMarker.value) return;
  
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  justFinishedResizing.value = true;
  isResizing.value = false;
  const marker = markers.value.find((m) => m.id === resizeMarker.value.id);
  
  // 既存のマーカーのみ更新（保留中のマーカーは保存時に送信される）
  if (marker) {
    try {
      const { apiFetch } = useApi();
      await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers/${marker.id}`, {
        method: 'PUT',
        body: {
          width: marker.width,
          height: marker.height,
        },
      });
    } catch (err: any) {
      console.error('Failed to update marker:', err);
      await loadMarkers();
    }
  }
  
  resizeMarker.value = null;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', handleResizeEnd);
};

const updateMarkerNote = async (markerId: string) => {
  // 保留中のマーカーの場合は、ローカルのみ更新（保存時に送信される）
  if (markerId.startsWith('temp-')) {
    const pendingMarker = pendingMarkers.value.find((m) => m.id === markerId);
    if (pendingMarker) {
      pendingMarker.note = markerNotes.value[markerId] || null;
    }
    return;
  }
  
  // 既存のマーカーの場合は、APIに送信
  try {
    const { apiFetch } = useApi();
    await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers/${markerId}`, {
      method: 'PUT',
      body: {
        note: markerNotes.value[markerId] || null,
      },
    });
  } catch (err: any) {
    console.error('Failed to update marker note:', err);
  }
};

const deleteMarker = async (markerId: string) => {
  if (!confirm('このマーカーを削除しますか？')) return;
  
  // 保留中のマーカーの場合は、ローカルから削除するだけ
  if (markerId.startsWith('temp-')) {
    pendingMarkers.value = pendingMarkers.value.filter((m) => m.id !== markerId);
    delete markerNotes.value[markerId];
    return;
  }
  
  // 既存のマーカーの場合は、APIから削除
  try {
    const { apiFetch } = useApi();
    await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers/${markerId}`, {
      method: 'DELETE',
    });
    markers.value = markers.value.filter((m) => m.id !== markerId);
    delete markerNotes.value[markerId];
  } catch (err: any) {
    console.error('Failed to delete marker:', err);
    alert('マーカーの削除に失敗しました');
  }
};

const saveMarkers = async () => {
  if (pendingMarkers.value.length === 0) return;
  
  isSavingMarkers.value = true;
  
  try {
    const { apiFetch } = useApi();
    
    // すべての保留中のマーカーを保存
    for (const marker of pendingMarkers.value) {
      const payload: any = {
        type: marker.type,
        x: marker.x,
        y: marker.y,
      };
      
      if (marker.type === 'square') {
        payload.width = marker.width;
        payload.height = marker.height;
      }
      
      const savedMarker = await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers`, {
        method: 'POST',
        body: {
          ...payload,
          note: marker.note || null,
        },
      });
      
      // 保存されたマーカーを既存のマーカーリストに移動
      markers.value.push(savedMarker);
      markerNotes.value[savedMarker.id] = markerNotes.value[marker.id] || '';
      delete markerNotes.value[marker.id];
    }
    
    // 保留中のマーカーをクリア
    pendingMarkers.value = [];
  } catch (err: any) {
    console.error('Failed to save markers:', err);
    alert('マーカーの保存に失敗しました');
  } finally {
    isSavingMarkers.value = false;
  }
};

const handleSubmit = async () => {
  isLoading.value = true;
  error.value = null;
  imageError.value = null;

  try {
    const { apiFetch } = useApi();
    await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}`, {
      method: 'PUT',
      body: {
        name: form.value.name,
        description: form.value.description || undefined,
        content: form.value.content || undefined,
      },
    });
    if (imageFile.value) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:before-formdata',message:'Creating FormData',data:{hasImageFile:!!imageFile.value,imageFileName:imageFile.value?.name,imageFileSize:imageFile.value?.size,imageFileType:imageFile.value?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const formData = new FormData();
      formData.append('file', imageFile.value);
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:after-formdata',message:'FormData created',data:{formDataIsFormData:formData instanceof FormData,hasFile:formData.has('file')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      try {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:before-apifetch',message:'Calling apiFetch with FormData',data:{bodyIsFormData:formData instanceof FormData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
        const imageResponse = await apiFetch<{ imageUrl: string }>(`/api/projects/${projectId}/sheets/${sheetId}/image`, {
          method: 'POST',
          body: formData,
        });
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:after-apifetch',message:'apiFetch completed',data:{hasResponse:!!imageResponse,imageUrl:imageResponse?.imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        // サーバーから返された画像URLでプレビューを更新
        if (imageResponse.imageUrl) {
          // 古いblob URLを解放
          if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreviewUrl.value);
          }
          imagePreviewUrl.value = imageResponse.imageUrl;
          imageFile.value = null;
        }
      } catch (imageErr: any) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:image-upload-error',message:'Image upload error',data:{errorMessage:imageErr.message,errorStatus:imageErr.statusCode,errorData:imageErr.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
        // #endregion
        imageError.value = imageErr.message || '画像のアップロードに失敗しました';
        return;
      }
    }
    
    // 保留中のマーカーを保存
    if (pendingMarkers.value.length > 0) {
      await saveMarkers();
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'edit.vue:before-navigate',message:'Before navigation',data:{sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
    // #endregion
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

.image-preview-wrapper {
  margin-top: 12px;
}

.marker-type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.marker-type-button {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.marker-type-button:hover {
  background-color: #f7fafc;
}

.marker-type-button.active {
  background-color: #667eea;
  color: white;
  border-color: #667eea;
}

.image-preview {
  position: relative;
  display: inline-block;
  width: 100%;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.marker {
  position: absolute;
  cursor: move;
  user-select: none;
}

.marker-delete-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background-color: #e53e3e;
  color: white;
  border: 2px solid white;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  transition: background-color 0.2s;
}

.marker-delete-button:hover {
  background-color: #c53030;
}

.marker-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: #667eea;
  color: white;
  border-radius: 50%;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.marker-square {
  border: 2px solid #667eea;
  background-color: rgba(102, 126, 234, 0.1);
  box-sizing: border-box;
}

.marker-square .resize-handle {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background-color: #667eea;
  border: 2px solid white;
  border-radius: 50%;
  cursor: nwse-resize;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.markers-table {
  margin-top: 16px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markers-table table {
  width: 100%;
  border-collapse: collapse;
}

.markers-table th,
.markers-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.markers-table th {
  background-color: #f7fafc;
  font-weight: 600;
  color: #4a5568;
}

.markers-table tr:last-child td {
  border-bottom: none;
}

.note-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.delete-marker-button {
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: background-color 0.2s;
}

.delete-marker-button:hover {
  background-color: #c53030;
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

