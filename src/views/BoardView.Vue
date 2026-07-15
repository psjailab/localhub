<template>
  <div style="padding:16px;">
    <h2>익명 커뮤니티 게시판</h2>

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
      @like="handleLike"
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

    <!-- 삭제 확인 영역 (비번이 일치했을 때 화면에 표시) -->
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import BoardForm from '../components/BoardForm.vue';
import BoardList from '../components/BoardList.vue';
import { getPosts, createPost, updatePost, deletePost, getPostById, incView, toggleLike, currentStorageSize } from '../utils/storage';

// 상태
const posts = ref([]);
const query = ref('');        // 검색어
const scope = ref('all');     // 검색 범위: all/title/content

const editing = ref(null);
const selected = ref(null);
const showForm = ref(false);
const isEdit = ref(false);
const storageSize = ref(0);
const notice = ref('');

// 삭제 확인 상태: show, targetId, title
const confirmPending = ref({ show: false, targetId: null, title: '' });

// 비밀번호 모달 상태
const pwdPrompt = ref({ show: false, targetId: null, action: null, value: '', error: '' });

function load() {
  posts.value = getPosts();
  storageSize.value = currentStorageSize();
}
onMounted(load);

// 검색 처리
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

// 생성/수정 관련
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

// 조회수 증가 핸들러
function handleViewInc(post) {
  const updated = incView(post.id);
  if (updated) load();
}

// 좋아요 핸들러
function handleLike(post) {
  const updated = toggleLike(post.id);
  if (updated) load();
}

/* 비밀번호 모달 로직 */
function promptPasswordForEdit(post) {
  pwdPrompt.value = { show: true, targetId: post.id, action: 'edit', value: '', error: '' };
}
function promptPasswordForDelete(post) {
  pwdPrompt.value = { show: true, targetId: post.id, action: 'delete', value: '', error: '' };
}
function closePwdPrompt() {
  pwdPrompt.value = { show: false, targetId: null, action: null, value: '', error: '' };
}

function onPwdConfirm() {
  const id = pwdPrompt.value.targetId;
  const provided = pwdPrompt.value.value || '';
  const target = getPostById(id);

  if (!target) {
    pwdPrompt.value.error = '글을 찾을 수 없습니다.';
    return;
  }
  if (target.password !== provided) {
    pwdPrompt.value.error = '비밀번호가 일치하지 않습니다.';
    return;
  }

  // action 캡처 후 모달 닫음 (이전 버그 방지)
  const action = pwdPrompt.value.action;
  closePwdPrompt();

  if (action === 'edit') {
    startEditWithPasswordCheck(target);
    return;
  }

  if (action === 'delete') {
    confirmPending.value = { show: true, targetId: id, title: target.title || '(제목 없음)' };
    showForm.value = false;
    editing.value = null;
    isEdit.value = false;
  }
}

/* 삭제 확인 처리 */
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

/* 상세보기 */
function viewPost(post) {
  selected.value = post;
}

/* 알림 */
function noticeTransient(text, ms = 3000) {
  notice.value = text;
  setTimeout(() => { notice.value = ''; }, ms);
}

/* 유틸 */
function humanSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B','KB','MB'];
  let i = 0;
  let v = bytes;
  while (v >= 1024 && i < units.length-1) { v /= 1024; i++; }
  return `${v.toFixed(2)} ${units[i]}`;
}
</script>