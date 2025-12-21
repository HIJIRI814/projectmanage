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
        <div class="info-item" v-if="displayImageUrl">
          <label>画像:</label>
          <div class="image-wrapper" ref="imageWrapperRef">
            <img
              ref="imageRef"
              :src="displayImageUrl"
              alt="シート画像"
              @load="handleImageLoad"
            />
            <div
              v-for="marker in sortedMarkers"
              :key="marker.id"
              :class="['marker', `marker-${marker.type}`, 'marker-readonly']"
              :style="getMarkerStyle(marker)"
              @mouseenter="hoveredMarkerId = marker.id"
              @mouseleave="hoveredMarkerId = null"
            >
              <span v-if="marker.type === 'number'" class="marker-number">
                {{ getMarkerNumber(marker) }}
              </span>
            </div>
          </div>
          <div v-if="tableMarkers.length > 0" class="markers-table">
            <table>
              <thead>
                <tr>
                  <th>番号</th>
                  <th>メモ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="marker in tableMarkers" :key="marker.id">
                  <td>{{ getMarkerNumber(marker) }}</td>
                  <td>
                    <input
                      :value="markerNotes[marker.id]"
                      disabled
                      class="note-input"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="tableMarkers.length > 0" class="markers-comments">
            <h3>コメント</h3>
            <div v-for="marker in tableMarkers" :key="marker.id" class="marker-comments-section">
              <div class="marker-comments-header">
                <strong>{{ getMarkerNumber(marker) }}のコメント</strong>
              </div>
              <div class="comments-list">
                <div v-for="comment in markerComments[marker.id] || []" :key="comment.id" class="comment-item">
                  <div class="comment-content">
                    <div class="comment-header">
                      <span class="comment-author">{{ comment.userName }}</span>
                      <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <div class="comment-text">{{ comment.content }}</div>
                    <button
                      v-if="!comment.parentCommentId"
                      @click="showReplyForm(marker.id, comment.id)"
                      class="reply-button"
                    >
                      リプライ
                    </button>
                    <div v-if="replyingTo[marker.id] === comment.id" class="reply-form">
                      <textarea
                        v-model="replyTexts[`${marker.id}-${comment.id}`]"
                        placeholder="リプライを入力..."
                        class="reply-textarea"
                      />
                      <div class="reply-actions">
                        <button @click="submitReply(marker.id, comment.id)" class="submit-reply-button">
                          投稿
                        </button>
                        <button @click="cancelReply(marker.id)" class="cancel-reply-button">
                          キャンセル
                        </button>
                      </div>
                    </div>
                  </div>
                  <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
                    <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                      <div class="comment-header">
                        <span class="reply-prefix">L</span>
                        <span class="comment-author">{{ reply.userName }}</span>
                        <span class="comment-date">{{ formatDate(reply.createdAt) }}</span>
                      </div>
                      <div class="comment-text">{{ reply.content }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="comment-form">
                <textarea
                  v-model="commentTexts[marker.id]"
                  placeholder="コメントを入力..."
                  class="comment-textarea"
                />
                <button @click="submitComment(marker.id)" class="submit-comment-button">
                  コメント投稿
                </button>
              </div>
            </div>
          </div>
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
  if (!user.value || user.value.userType === null) return false;
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

const selectedMarkerType = ref<'number' | 'square'>('number');
const markers = ref<any[]>([]);
const markerNotes = ref<Record<string, string>>({});
const markerComments = ref<Record<string, any[]>>({});
const commentTexts = ref<Record<string, string>>({});
const replyTexts = ref<Record<string, string>>({});
const replyingTo = ref<Record<string, string | null>>({});
const imageRef = ref<HTMLImageElement | null>(null);
const imageWrapperRef = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
const isResizing = ref(false);
const justFinishedResizing = ref(false);
const hoveredMarkerId = ref<string | null>(null);
const dragStartPos = ref({ x: 0, y: 0 });
const dragMarker = ref<any>(null);
const resizeMarker = ref<any>(null);
const resizeStartPos = ref({ x: 0, y: 0, width: 0, height: 0 });

const { data: sheetData, error: fetchError, isLoading: isLoadingSheetData, refresh: refreshSheet } = useApiFetch(
  `/api/projects/${projectId}/sheets/${sheetId}`
);

// #region agent log
onMounted(() => {
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:onMounted',message:'Page mounted',data:{sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
  // ページ遷移時にデータを再取得
  refreshSheet();
});
// #endregion

watch(sheetData, (newSheet) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:watch-sheetData',message:'Sheet data updated',data:{hasNewSheet:!!newSheet,imageUrl:newSheet?.imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'})}).catch(()=>{});
  // #endregion
  if (newSheet) {
    sheet.value = newSheet;
    isLoading.value = false;
  }
}, { immediate: true });
watch(isLoadingSheetData, (loading) => {
  isLoading.value = loading;
});
watch(fetchError, (err) => {
  if (err) {
    error.value = err;
    isLoading.value = false;
  }
});

// バージョン一覧を取得
const loadVersions = async () => {
  isLoadingVersions.value = true;
  try {
    const { apiFetch } = useApi();
    const versionsData = await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/versions`);
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

const loadMarkers = async () => {
  try {
    const { apiFetch } = useApi();
    const versionId = selectedVersionId.value || null;
    const url = `/api/projects/${projectId}/sheets/${sheetId}/markers${versionId ? `?versionId=${versionId}` : ''}`;
    const markersData = await apiFetch(url);
    markers.value = markersData;
    markerNotes.value = {};
    markersData.forEach((marker: any) => {
      markerNotes.value[marker.id] = marker.note || '';
    });
    await loadCommentsForMarkers();
  } catch (err: any) {
    console.error('Failed to load markers:', err);
  }
};

const loadCommentsForMarkers = async () => {
  try {
    const { apiFetch } = useApi();
    for (const marker of tableMarkers.value) {
      try {
        const comments = await apiFetch(
          `/api/projects/${projectId}/sheets/${sheetId}/markers/${marker.id}/comments`
        );
        markerComments.value[marker.id] = comments;
      } catch (err: any) {
        console.error(`Failed to load comments for marker ${marker.id}:`, err);
        markerComments.value[marker.id] = [];
      }
    }
  } catch (err: any) {
    console.error('Failed to load comments:', err);
  }
};

const submitComment = async (markerId: string) => {
  const content = commentTexts.value[markerId]?.trim();
  if (!content) return;

  try {
    const { apiFetch } = useApi();
    await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers/${markerId}/comments`, {
      method: 'POST',
      body: {
        content,
        parentCommentId: null,
      },
    });
    commentTexts.value[markerId] = '';
    await loadCommentsForMarkers();
  } catch (err: any) {
    console.error('Failed to submit comment:', err);
    alert('コメントの投稿に失敗しました');
  }
};

const showReplyForm = (markerId: string, commentId: string) => {
  replyingTo.value[markerId] = commentId;
  replyTexts.value[`${markerId}-${commentId}`] = '';
};

const cancelReply = (markerId: string) => {
  replyingTo.value[markerId] = null;
};

const submitReply = async (markerId: string, parentCommentId: string) => {
  const content = replyTexts.value[`${markerId}-${parentCommentId}`]?.trim();
  if (!content) return;

  try {
    const { apiFetch } = useApi();
    await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers/${markerId}/comments`, {
      method: 'POST',
      body: {
        content,
        parentCommentId,
      },
    });
    replyTexts.value[`${markerId}-${parentCommentId}`] = '';
    replyingTo.value[markerId] = null;
    await loadCommentsForMarkers();
  } catch (err: any) {
    console.error('Failed to submit reply:', err);
    alert('リプライの投稿に失敗しました');
  }
};

const sortedMarkers = computed(() => {
  // 登録順（作成日時順）でソート
  return [...markers.value].sort((a, b) => {
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
  
  const imgRect = imageRef.value.getBoundingClientRect();
  const wrapperRect = imageWrapperRef.value?.getBoundingClientRect() || { left: 0, top: 0 };
  
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

const handleImageClick = (event: MouseEvent) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleImageClick',message:'Image click handler called',data:{canManageProjects:canManageProjects.value,hasImageRef:!!imageRef.value,isDragging:isDragging.value,isResizing:isResizing.value,justFinishedResizing:justFinishedResizing.value,selectedMarkerType:selectedMarkerType.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  // リサイズ終了直後のクリックを無視
  if (justFinishedResizing.value) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleImageClick',message:'Ignoring click after resize',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    justFinishedResizing.value = false;
    return;
  }
  
  if (!canManageProjects.value || !imageRef.value || isDragging.value || isResizing.value) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleImageClick',message:'Early return from image click',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return;
  }
  
  const imgRect = imageRef.value.getBoundingClientRect();
  const wrapperRect = imageWrapperRef.value?.getBoundingClientRect() || { left: 0, top: 0 };
  
  const x = ((event.clientX - imgRect.left) / imgRect.width) * 100;
  const y = ((event.clientY - imgRect.top) / imgRect.height) * 100;
  
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleImageClick',message:'Calculated coordinates',data:{x,y,imgRect:{width:imgRect.width,height:imgRect.height,left:imgRect.left,top:imgRect.top},eventPos:{clientX:event.clientX,clientY:event.clientY}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  createMarker(x, y);
};

const createMarker = async (x: number, y: number) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:createMarker',message:'createMarker called',data:{x,y,selectedMarkerType:selectedMarkerType.value,projectId,sheetId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const { apiFetch } = useApi();
    const payload: any = {
      type: selectedMarkerType.value,
      x,
      y,
    };
    
    if (selectedMarkerType.value === 'square') {
      payload.width = 10;
      payload.height = 10;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:createMarker',message:'Before API call',data:{payload,url:`/api/projects/${projectId}/sheets/${sheetId}/markers`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const newMarker = await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/markers`, {
      method: 'POST',
      body: payload,
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:createMarker',message:'API call succeeded',data:{newMarker},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    markers.value.push(newMarker);
    markerNotes.value[newMarker.id] = '';
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:createMarker',message:'API call failed',data:{error:err.message,errorStack:err.stack,errorStatus:err.statusCode,errorData:err.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Failed to create marker:', err);
    alert('マーカーの作成に失敗しました');
  }
};

const handleMarkerMouseDown = (event: MouseEvent, marker: any) => {
  if (!canManageProjects.value || isResizing.value) return;
  
  event.preventDefault();
  isDragging.value = true;
  dragMarker.value = marker;
  dragStartPos.value = { x: event.clientX, y: event.clientY };
  
  document.addEventListener('mousemove', handleMarkerDrag);
  document.addEventListener('mouseup', handleMarkerDragEnd);
};

const handleMarkerDrag = (event: MouseEvent) => {
  if (!isDragging.value || !dragMarker.value || !imageRef.value) return;
  
  const imgRect = imageRef.value.getBoundingClientRect();
  const x = ((event.clientX - imgRect.left) / imgRect.width) * 100;
  const y = ((event.clientY - imgRect.top) / imgRect.height) * 100;
  
  const clampedX = Math.max(0, Math.min(100, x));
  const clampedY = Math.max(0, Math.min(100, y));
  
  const markerIndex = markers.value.findIndex((m) => m.id === dragMarker.value.id);
  if (markerIndex !== -1) {
    markers.value[markerIndex] = { ...markers.value[markerIndex], x: clampedX, y: clampedY };
  }
};

const handleMarkerDragEnd = async () => {
  if (!isDragging.value || !dragMarker.value) return;
  
  isDragging.value = false;
  const marker = markers.value.find((m) => m.id === dragMarker.value.id);
  
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
  if (!canManageProjects.value) return;
  
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
  
  const newWidth = Math.max(5, Math.min(100, resizeStartPos.value.width + deltaX * 2));
  const newHeight = Math.max(5, Math.min(100, resizeStartPos.value.height + deltaY * 2));
  
  const markerIndex = markers.value.findIndex((m) => m.id === resizeMarker.value.id);
  if (markerIndex !== -1) {
    markers.value[markerIndex] = {
      ...markers.value[markerIndex],
      width: newWidth,
      height: newHeight,
    };
  }
};

const handleResizeEnd = async (event?: MouseEvent) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleResizeEnd',message:'Resize end called',data:{isResizing:isResizing.value,hasResizeMarker:!!resizeMarker.value,hasEvent:!!event},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  
  if (!isResizing.value || !resizeMarker.value) return;
  
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  // リサイズ終了フラグを設定（isResizingをfalseにする前に）
  justFinishedResizing.value = true;
  isResizing.value = false;
  const marker = markers.value.find((m) => m.id === resizeMarker.value.id);
  
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
  
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleResizeEnd',message:'Resize end completed',data:{justFinishedResizing:justFinishedResizing.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
};

const updateMarkerNote = async (markerId: string) => {
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

// 選択されたバージョンの内容を取得
const handleVersionChange = async () => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleVersionChange',message:'handleVersionChange called',data:{selectedVersionId:selectedVersionId.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (!selectedVersionId.value) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleVersionChange',message:'Clearing selectedVersion',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    selectedVersion.value = null;
    await loadMarkers();
    return;
  }

  try {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleVersionChange',message:'Fetching version data',data:{versionId:selectedVersionId.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const { apiFetch } = useApi();
    const versionData = await apiFetch(
      `/api/projects/${projectId}/sheets/${sheetId}/versions/${selectedVersionId.value}`
    );
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleVersionChange',message:'Version data received',data:{versionId:versionData.id,hasImageUrl:!!versionData.imageUrl,imageUrl:versionData.imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    selectedVersion.value = versionData;
    await loadMarkers();
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleVersionChange',message:'selectedVersion updated',data:{selectedVersionImageUrl:selectedVersion.value?.imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  } catch (err: any) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:handleVersionChange',message:'Failed to load version',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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

// 表示する画像URLを計算（バージョン選択時はバージョンの画像URL、未選択時は現在のシートの画像URL）
const displayImageUrl = computed(() => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:displayImageUrl',message:'Computing displayImageUrl',data:{hasSelectedVersion:!!selectedVersion.value,selectedVersionImageUrl:selectedVersion.value?.imageUrl,sheetImageUrl:sheet.value?.imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (selectedVersion.value) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:displayImageUrl',message:'Returning selectedVersion imageUrl',data:{imageUrl:selectedVersion.value.imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return selectedVersion.value.imageUrl;
  }
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/befb475b-e854-40df-ba29-979341b8a7a4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'index.vue:displayImageUrl',message:'Returning sheet imageUrl',data:{imageUrl:sheet.value?.imageUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return sheet.value?.imageUrl;
});

// バージョン保存
const handleSaveVersion = async () => {
  if (!confirm('現在のシート内容をバージョンとして保存しますか？')) {
    return;
  }

  isSavingVersion.value = true;
  try {
    const { apiFetch } = useApi();
    await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}/versions`, {
      method: 'POST',
    });
    await loadVersions();
    alert('バージョンを保存しました');
  } catch (err: any) {
    alert(err.message || 'バージョンの保存に失敗しました');
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
    const { apiFetch } = useApi();
    await apiFetch(
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
    alert(err.message || 'バージョンの復元に失敗しました');
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
    const { apiFetch } = useApi();
    await apiFetch(`/api/projects/${projectId}/sheets/${sheetId}`, {
      method: 'DELETE',
    });
    router.push(`/projects/${projectId}`);
  } catch (err: any) {
    alert(err.message || '削除に失敗しました');
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

.image-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.image-wrapper img {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: block;
}

.marker-type-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.marker-type-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
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

.marker {
  position: absolute;
  cursor: default;
  user-select: none;
}

.marker-readonly {
  cursor: default;
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

.markers-comments {
  margin-top: 24px;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.markers-comments h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #333;
}

.marker-comments-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.marker-comments-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.marker-comments-header {
  margin-bottom: 16px;
  font-size: 16px;
  color: #4a5568;
}

.comments-list {
  margin-bottom: 16px;
}

.comment-item {
  margin-bottom: 16px;
}

.comment-content {
  padding: 12px;
  background-color: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.comment-author {
  font-weight: 600;
  color: #2d3748;
}

.comment-date {
  color: #a0aec0;
  font-size: 12px;
}

.comment-text {
  color: #4a5568;
  margin-bottom: 8px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.reply-button {
  padding: 4px 12px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.reply-button:hover {
  background-color: #5a67d8;
}

.reply-form {
  margin-top: 12px;
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.reply-textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 8px;
}

.reply-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.reply-actions {
  display: flex;
  gap: 8px;
}

.submit-reply-button,
.cancel-reply-button {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-reply-button {
  background-color: #667eea;
  color: white;
}

.submit-reply-button:hover {
  background-color: #5a67d8;
}

.cancel-reply-button {
  background-color: #e2e8f0;
  color: #4a5568;
}

.cancel-reply-button:hover {
  background-color: #cbd5e0;
}

.replies-list {
  margin-left: 24px;
  margin-top: 12px;
  padding-left: 16px;
  border-left: 2px solid #e2e8f0;
}

.reply-item {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #f7fafc;
  border-radius: 4px;
}

.reply-prefix {
  font-weight: bold;
  color: #667eea;
  margin-right: 8px;
}

.comment-form {
  margin-top: 16px;
  padding: 16px;
  background-color: #f7fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.comment-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 12px;
}

.comment-textarea:focus {
  outline: none;
  border-color: #667eea;
}

.submit-comment-button {
  padding: 10px 20px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-comment-button:hover {
  background-color: #5a67d8;
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

.note-input:focus {
  outline: none;
  border-color: #667eea;
}

.delete-marker-button {
  padding: 4px 12px;
  background-color: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: background-color 0.2s;
}

.delete-marker-button:hover {
  background-color: #c53030;
}

.readonly-indicator {
  color: #a0aec0;
  font-size: 14px;
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

