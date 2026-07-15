<template>
  <div style="border:1px solid #eee; padding:8px; margin-top:8px; background:#fafafa;">
    <textarea v-model="content" rows="3" placeholder="댓글을 입력하세요 (최대 1000자)" style="width:100%; padding:6px;"></textarea>
    <div style="margin-top:6px; display:flex; gap:8px; align-items:center;">
      <input v-model="password" type="password" placeholder="비밀번호 (수정/삭제용)" style="padding:6px;" />
      <div style="margin-left:auto;">
        <button @click="onSave">저장</button>
        <button @click="onCancel" style="margin-left:6px;">취소</button>
      </div>
    </div>
    <div v-if="error" style="color:red; margin-top:6px;">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
const props = defineProps({
  initial: { type: Object, default: () => ({ content: '' }) },
  postId: { type: String, required: true },
  parentId: { type: String, default: null } // null => top-level
});
const emit = defineEmits(['save','cancel']);

const content = ref(props.initial.content || '');
const password = ref('');
const error = ref('');

watch(() => props.initial, v => {
  content.value = v?.content || '';
});

function onSave() {
  if (!content.value.trim()) { error.value = '댓글 내용을 입력하세요.'; return; }
  if (content.value.length > 1000) { error.value = '댓글은 최대 1000자입니다.'; return; }
  // emit payload: { postId, parentId, content, password, id (if editing) }
  emit('save', { id: props.initial.id, postId: props.postId, parentId: props.parentId, content: content.value.trim(), password: password.value });
  content.value = '';
  password.value = '';
}

function onCancel() {
  error.value = '';
  emit('cancel');
}
</script>
