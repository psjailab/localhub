<script setup>
import { computed } from 'vue';
const props = defineProps({
  posts: { type: Array, default: () => [] }
});
const emit = defineEmits(['edit','delete','view','create','like','viewInc']);

const empty = computed(() => !props.posts || props.posts.length === 0);

function onEdit(post) { emit('edit', post); }
function onDelete(post) { emit('delete', post); }
function onView(post) { emit('view', post); }
function onCreate() { emit('create'); }
function onLike(post) { emit('like', post); }
function onViewInc(post) { emit('viewInc', post); }
</script>

<template>
  <div class="board-list">
    <div style="margin-bottom:8px;">
      <button @click="onCreate">새 글 작성</button>
    </div>

    <div v-if="empty">글이 없습니다. 새 글을 작성해보세요.</div>

    <ul v-else style="list-style:none; padding:0;">
      <li v-for="post in posts" :key="post.id" style="margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="flex:1;">
            <strong @click="() => { onViewInc(post); onView(post); }" style="cursor:pointer;">{{ post.title }}</strong>
            <div style="font-size:12px; color:#666;">{{ new Date(post.createdAt).toLocaleString() }}</div>
            <div style="margin-top:8px; font-size:14px; color:#333;">{{ post.content }}</div>
          </div>
          <div style="text-align:right;">
            <div style="margin-bottom:6px;">
              <button @click="() => onLike(post)">{{ post.liked ? '♥' : '♡' }} {{ post.likes || 0 }}</button>
            </div>
            <div style="font-size:12px; color:#666; margin-bottom:6px;">조회 {{ post.views || 0 }}</div>
            <div>
              <button @click="onEdit(post)">수정</button>
              <button @click="onDelete(post)" style="margin-left:6px;">삭제</button>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>