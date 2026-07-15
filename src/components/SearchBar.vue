<template>
  <div style="margin-bottom:12px; display:flex; gap:8px; align-items:center;">
    <input v-model="q" @input="onInput" placeholder="검색 (제목/내용)" style="flex:1; padding:8px;" />
    <select v-model="scope" @change="onInput" style="padding:8px;">
      <option value="all">전체</option>
      <option value="title">제목</option>
      <option value="content">내용</option>
    </select>
    <button @click="clear" style="padding:8px;">초기화</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const emit = defineEmits(['search']);
const q = ref('');
const scope = ref('all');

function onInput() {
  emit('search', { q: q.value.trim(), scope: scope.value });
}

function clear() {
  q.value = '';
  scope.value = 'all';
  emit('search', { q: '', scope: 'all' });
}
</script>
