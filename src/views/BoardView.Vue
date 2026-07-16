<template>
  <div style="padding:16px;">
    <h2>익명 커뮤니티</h2>
    <div style="background:#fff8e1; padding:8px; border:1px solid #ffe082; margin-bottom:12px;">
      브라우저의 캐시/LocalStorage 초기화 시 게시글이 삭제됩니다. 중요한 데이터는 별도 백업하세요.
    </div>

    <SearchBar @search="onSearch" />

    <BoardForm v-if="showForm" :initial="editing" :isEdit="isEdit" @save="handleSave" @cancel="handleCancel" />

    <BoardList
      :posts="filteredPosts"
      @edit="promptPasswordForEdit"
      @delete="promptPasswordForDelete"
      @create="startCreate"
      @view="viewPost"
      @viewInc="handleViewInc"
    />

    <div v-if="selected" style="margin-top:16px; padding:12px; border:1px solid #ddd; background:#fff;">
      <h3>{{ selected.title }}</h3>
      <div style="font-size:12px;color:#666;">{{ new Date(selected.createdAt).toLocaleString() }}</div>
      <p style="white-space:pre-wrap; margin-top:8px;">{{ selected.content }}</p>
      <div style="margin-top:8px;">
        <button @click="promptPasswordForEdit(selected)">수정</button>
        <button @click="promptPasswordForDelete(selected)" style="margin-left:6px;">삭제</button>
        <button @click="selected = null" style="margin-left:6px;">닫기</button>
      </div>

      <!-- 댓글 영역 -->
      <div style="margin-top:12px;">
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
          <button @click="toggleTopCommentForm">{{ showTopCommentForm ? '댓글 폼 닫기' : '댓글 작성' }}</button>
        </div>

        <!-- top-level comment form -->
        <div v-if="showTopCommentForm" style="margin-bottom:12px;">
          <CommentForm :postId="selected.id" @save="onCommentSave" @cancel="onCommentCancel" />
        </div>

        <!-- comment list -->
        <CommentList
          :postId="selected.id"
          :comments="selected.comments || []"
          @reply="onCommentReply"
          @edit="onCommentEdit"
          @delete="onCommentRequestDelete"
        />

        <!-- inline reply/edit form -->
        <div v-if="activeCommentForm.show" style="margin-top:12px;">
          <CommentForm
            :postId="selected.id"
            :initial="activeCommentForm.initial"
            :parentId="activeCommentForm.parentId"
            @save="onCommentSave"
            @cancel="onCommentCancel"
          />
        </div>
      </div>
    </div>

    <!-- 비밀번호 입력 모달 -->
    <div v-if="pwdPrompt.show" style="position:fixed; left:0; top:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); z-index:1000;">
      <div style="background:white; padding:16px; width:360px; border-radius:6px;">
        <div style="font-weight:600; margin-bottom:8px;">비밀번호 확인</div>
        <input v-model="pwdPrompt.value" type="password" placeholder="비밀번호" style="width:100%; padding:8px;" />
        <div style="color:red; margin-top:8px;" v-if="pwdPrompt.error">{{ pwdPrompt.error }}</div>
        <div style="margin-top:12px; text-align:right;">
          <button @click="onPwdConfirm">확인</button>
          <button @click="closePwdPrompt" style="margin-left:8px;">취소</button>
        </div>
      </div>
    </div>

    <!-- 댓글 전용 삭제 확인 영역 -->
    <div v-if="confirmPendingComment.show" style="margin-top:12px; padding:12px; border:1px solid #ffd6e0; background:#fff0f6;">
      <div style="font-weight:600; margin-bottom:8px;">댓글을 삭제하시겠습니까?</div>
      <div style="font-size:13px; color:#333; margin-bottom:8px;">삭제 대상: {{ confirmPendingComment.preview || '(댓글)' }}</div>
      <div style="text-align:right;">
        <button @click="confirmCommentDeleteYes" style="background:#ff4d4f; color:white; padding:6px 10px; border-radius:4px; border:none;">예, 삭제</button>
        <button @click="confirmCommentDeleteNo" style="margin-left:8px; padding:6px 10px; border-radius:4px;">아니오</button>
      </div>
    </div>

    <!-- 포스트 삭제 확인 영역 -->
    <div v-if="confirmPending.show" style="margin-top:12px; padding:12px; border:1px solid #ffd666; background:#fffbe6;">
      <div style="font-weight:600; margin-bottom:8px;">정말 삭제하시겠습니까?</div>
      <div style="font-size:13px; color:#333; margin-bottom:8px;">삭제 대상: {{ confirmPending.title }}</div>
      <div style="text-align:right;">
        <button @click="confirmDeleteYes" style="background:#ff4d4f; color:white; padding:6px 10px; border-radius:4px; border:none;">예, 삭제</button>
        <button @click="confirmDeleteNo" style="margin-left:8px; padding:6px 10px; border-radius:4px;">아니오</button>
      </div>
    </div>

    <!-- 알림 텍스트 -->
    <div v-if="notice" style="margin-top:12px; padding:8px; background:#e6f7ff; border:1px solid #91d5ff; color:#0050b3;">
      {{ notice }}
    </div>

    <div style="margin-top:12px; font-size:12px; color:#666;">
      LocalStorage 사용량: {{ humanSize(storageSize) }} / 약 5MB 제한
    </div>
    <Chatbot />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import BoardForm from '../components/BoardForm.vue';
import BoardList from '../components/BoardList.vue';
import CommentForm from '../components/CommentForm.vue';
import CommentList from '../components/CommentList.vue';
import Chatbot from '../components/Chatbot.vue'
import {
  getPosts, createPost, updatePost, deletePost, getPostById,
  incView, toggleLike, currentStorageSize,
  createComment, updateComment, deleteComment, getComments
} from '../utils/storage';

// posts / search
const posts = ref([]);
const query = ref('');
const scope = ref('all');

// UI states
const editing = ref(null);
const selected = ref(null);
const showForm = ref(false);
const isEdit = ref(false);
const storageSize = ref(0);
const notice = ref('');

// comment UI state
const showTopCommentForm = ref(false);
const activeCommentForm = ref({ show: false, initial: null, parentId: null });

// delete confirm (post)
const confirmPending = ref({ show: false, targetId: null, title: '' });

// pwd modal (reused)
const pwdPrompt = ref({ show: false, targetId: null, action: null, value: '', error: '', meta: null });

// comment delete confirm
const confirmPendingComment = ref({ show: false, postId: null, commentId: null, preview: '' });

function load() {
  posts.value = getPosts();
  storageSize.value = currentStorageSize();
  if (selected.value) {
    const refreshed = getPostById(selected.value.id);
    selected.value = refreshed || null;
  }
}
onMounted(load);

// search
function onSearch({ q, scope: s }) {
  query.value = q || '';
  scope.value = s || 'all';
}
const filteredPosts = computed(() => {
  if (!query.value) return posts.value;
  const q = query.value.toLowerCase();
  return posts.value.filter(p => {
    if (scope.value === 'title') return (p.title || '').toLowerCase().includes(q);
    if (scope.value === 'content') return (p.content || '').toLowerCase().includes(q);
    return ((p.title || '').toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q));
  });
});

// create/edit post
function startCreate() {
  editing.value = { title: '', content: '' };
  selected.value = null;
  isEdit.value = false;
  showForm.value = true;
}
function startEditWithPasswordCheck(post) {
  editing.value = { ...post };
  isEdit.value = true;
  showForm.value = true;
}
function handleCancel() {
  editing.value = null;
  showForm.value = false;
  isEdit.value = false;
}
function handleSave(payload) {
  try {
    if (payload.id) {
      updatePost(payload.id, { title: payload.title, content: payload.content });
      noticeTransient('수정되었습니다.');
    } else {
      createPost({ title: payload.title, content: payload.content, password: payload.password });
      noticeTransient('작성되었습니다.');
    }
    load();
    showForm.value = false;
    editing.value = null;
    isEdit.value = false;
  } catch (err) {
    if (err?.message === 'STORAGE_LIMIT_EXCEEDED') {
      noticeTransient('저장할 수 없습니다: LocalStorage 용량(약 5MB)을 초과합니다.');
    } else {
      noticeTransient('저장 중 오류가 발생했습니다.');
    }
  }
}

// view / like (post-level)
function handleViewInc(post) {
  const updated = incView(post.id);
  if (updated) load();
}
function handleLike(post) {
  const updated = toggleLike(post.id);
  if (updated) load();
}

// COMMENT HANDLERS (no heart for comments)
function toggleTopCommentForm() {
  showTopCommentForm.value = !showTopCommentForm.value;
  activeCommentForm.value = { show: false, initial: null, parentId: null };
}
function onCommentSave(payload) {
  try {
    if (payload.id) {
      updateComment(payload.postId, payload.id, { content: payload.content });
      noticeTransient('댓글이 수정되었습니다.');
    } else {
      createComment(payload.postId, { parentId: payload.parentId || null, content: payload.content, password: payload.password });
      noticeTransient('댓글이 작성되었습니다.');
    }
    load();
    showTopCommentForm.value = false;
    activeCommentForm.value = { show: false, initial: null, parentId: null };
  } catch (err) {
    noticeTransient('댓글 저장 중 오류가 발생했습니다.');
  }
}
function onCommentCancel() {
  showTopCommentForm.value = false;
  activeCommentForm.value = { show: false, initial: null, parentId: null };
}
function onCommentReply(comment) {
  activeCommentForm.value = { show: true, initial: { content: '' }, parentId: comment.id };
  showTopCommentForm.value = false;
}
function onCommentEdit(comment) {
  activeCommentForm.value = { show: true, initial: { id: comment.id, content: comment.content }, parentId: comment.parentId || null };
  showTopCommentForm.value = false;
}
function onCommentRequestDelete(comment) {
  // open password modal for comment delete; store postId in meta
  pwdPrompt.value = {
    show: true,
    targetId: comment.id,
    action: 'delete_comment',
    value: '',
    error: '',
    meta: { postId: selected.value?.id, preview: (comment.content || '').slice(0, 120) }
  };
}
function onCommentLike() {
  // not used (feature removed)
}

// pwd modal flows (post-level and comment-level)
function promptPasswordForEdit(post) {
  pwdPrompt.value = { show: true, targetId: post.id, action: 'edit', value: '', error: '' };
}
function promptPasswordForDelete(post) {
  pwdPrompt.value = { show: true, targetId: post.id, action: 'delete', value: '', error: '' };
}
function closePwdPrompt() {
  pwdPrompt.value = { show: false, targetId: null, action: null, value: '', error: '', meta: null };
}

function onPwdConfirm() {
  const id = pwdPrompt.value.targetId;
  const provided = pwdPrompt.value.value || '';
  const action = pwdPrompt.value.action;

  // handle comment deletion request
  if (action === 'delete_comment') {
    const postId = pwdPrompt.value.meta?.postId;
    const preview = pwdPrompt.value.meta?.preview || '';
    const post = getPostById(postId);
    const comment = (post?.comments || []).find(c => c.id === id);
    if (!comment) {
      pwdPrompt.value.error = '댓글을 찾을 수 없습니다.';
      return;
    }
    if (comment.password !== provided) {
      pwdPrompt.value.error = '비밀번호가 일치하지 않습니다.';
      return;
    }
    // password ok -> close modal and show confirm UI
    closePwdPrompt();
    confirmPendingComment.value = { show: true, postId, commentId: id, preview };
    return;
  }

  // post-level flows
  const target = getPostById(id);
  if (!target) { pwdPrompt.value.error = '글을 찾을 수 없습니다.'; return; }
  if (target.password !== provided) { pwdPrompt.value.error = '비밀번호가 일치하지 않습니다.'; return; }

  const act = action;
  closePwdPrompt();
  if (act === 'edit') {
    startEditWithPasswordCheck(target);
    return;
  }
  if (act === 'delete') {
    confirmPending.value = { show: true, targetId: id, title: target.title || '(제목 없음)' };
    showForm.value = false;
    editing.value = null;
    isEdit.value = false;
  }
}

// comment confirm handlers
function confirmCommentDeleteYes() {
  const { postId, commentId } = confirmPendingComment.value;
  if (!postId || !commentId) return;
  try {
    deleteComment(postId, commentId);
    load();
    confirmPendingComment.value = { show: false, postId: null, commentId: null, preview: '' };
    noticeTransient('댓글이 삭제되었습니다.');
  } catch (err) {
    noticeTransient('댓글 삭제 중 오류가 발생했습니다.');
    confirmPendingComment.value = { show: false, postId: null, commentId: null, preview: '' };
  }
}
function confirmCommentDeleteNo() {
  confirmPendingComment.value = { show: false, postId: null, commentId: null, preview: '' };
  noticeTransient('댓글 삭제가 취소되었습니다.');
}

// post-level confirm handlers
function confirmDeleteYes() {
  const id = confirmPending.value.targetId;
  if (!id) return;
  try {
    deletePost(id);
    if (selected.value && selected.value.id === id) selected.value = null;
    load();
    confirmPending.value = { show: false, targetId: null, title: '' };
    showForm.value = false;
    editing.value = null;
    isEdit.value = false;
    noticeTransient('삭제되었습니다.');
  } catch (err) {
    noticeTransient('삭제 중 오류가 발생했습니다.');
    confirmPending.value = { show: false, targetId: null, title: '' };
    showForm.value = false;
    editing.value = null;
    isEdit.value = false;
  }
}
function confirmDeleteNo() {
  confirmPending.value = { show: false, targetId: null, title: '' };
  closePwdPrompt();
  showForm.value = false;
  editing.value = null;
  isEdit.value = false;
  noticeTransient('삭제가 취소되었습니다.');
}

// select post (detail)
function viewPost(post) {
  selected.value = post;
}

// utils
function noticeTransient(text, ms = 3000) {
  notice.value = text;
  setTimeout(() => { notice.value = ''; }, ms);
}
function humanSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B','KB','MB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length-1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${units[i]}`;
}
</script>