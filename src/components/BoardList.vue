<script setup>
import { computed } from 'vue';
const props = defineProps({
  posts: { type: Array, default: () => [] }
});
const emit = defineEmits(['edit','delete','view','create']);

const empty = computed(() => !props.posts || props.posts.length === 0);

function onEdit(post) { emit('edit', post); }
function onDelete(post) { emit('delete', post); }
function onView(post) { emit('view', post); }
function onCreate() { emit('create'); }
</script>

<template>
  <div class="board-list">
    <div style="margin-bottom:8px;">
      <button @click="onCreate">새 글 작성</button>
    </div>

    <div v-if="empty">글이 없습니다. 새 글을 작성해보세요.</div>

    <ul v-else style="list-style:none; padding:0;">
      <li v-for="post in posts" :key="post.id" style="margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="flex:1;">
            <strong @click="onView(post)" style="cursor:pointer;">{{ post.title }}</strong>
            <div style="font-size:12px; color:#666;">{{ new Date(post.createdAt).toLocaleString() }}</div>
          </div>
          <div>
            <button @click="onEdit(post)">수정</button>
            <button @click="onDelete(post)" style="margin-left:6px;">삭제</button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
