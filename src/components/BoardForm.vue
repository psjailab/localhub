<script setup>
import { ref, watch } from 'vue';
const props = defineProps({
  initial: { type: Object, default: () => ({ title: '', content: '' }) },
  isEdit: { type: Boolean, default: false }
});
const emit = defineEmits(['save','cancel']);

const title = ref(props.initial.title || '');
const content = ref(props.initial.content || '');
const password = ref('');
const error = ref('');

watch(() => props.initial, (v) => {
  title.value = v?.title || '';
  content.value = v?.content || '';
});

function onSave() {
  if (!title.value.trim()) { error.value = '제목을 입력하세요.'; return; }
  if (!content.value.trim()) { error.value = '내용을 입력하세요.'; return; }
  if (!props.isEdit && !password.value.trim()) { error.value = '비밀번호를 입력하세요 (수정/삭제용).'; return; }
  error.value = '';
  emit('save', { id: props.initial.id, title: title.value, content: content.value, password: password.value });
  title.value = '';
  content.value = '';
  password.value = '';
}

function onCancel() {
  error.value = '';
  emit('cancel');
}
</script>

<template>
  <div class="board-form" style="border:1px solid #eee; padding:12px; margin-bottom:12px; background:#fff;">
    <div style="font-weight:600; margin-bottom:8px;">글 작성 / 수정</div>
    <div>
      <input v-model="title" placeholder="제목" style="width:100%; padding:8px;"/>
    </div>
    <div style="margin-top:8px;">
      <textarea v-model="content" placeholder="내용" rows="6" style="width:100%; padding:8px;"></textarea>
    </div>
    <div style="margin-top:8px;">
      <input v-model="password" type="password" placeholder="비밀번호 (수정/삭제 시 필요)" style="width:100%; padding:8px;" />
    </div>
    <div style="color:red; margin-top:6px;" v-if="error">{{ error }}</div>
    <div style="margin-top:8px; text-align:right;">
      <button @click="onSave">저장</button>
      <button @click="onCancel" style="margin-left:8px;">취소</button>
    </div>
  </div>
</template>
