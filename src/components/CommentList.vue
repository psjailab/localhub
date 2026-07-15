<template>
  <div class="comment-list" style="margin-top:12px;">
    <div v-if="!comments || comments.length === 0" style="color:#666;">댓글이 없습니다.</div>
    <ul style="list-style:none; padding:0;">
      <li v-for="c in topLevel" :key="c.id" style="padding:8px 0; border-bottom:1px solid #f0f0f0;">
        <div style="display:flex; justify-content:space-between;">
          <div style="flex:1;">
            <div style="font-size:14px; color:#333;">{{ c.content }}</div>
            <div style="font-size:12px; color:#999;">{{ new Date(c.createdAt).toLocaleString() }}</div>
          </div>
          <div style="text-align:right;">
            <button @click="$emit('reply', c)">답글</button>
            <button @click="$emit('edit', c)" style="margin-left:6px;">수정</button>
            <button @click="$emit('delete', c)" style="margin-left:6px;">삭제</button>
            <button @click="$emit('like', c)" style="margin-left:6px;">{{ c.liked ? '♥' : '♡' }} {{ c.likes || 0 }}</button>
          </div>
        </div>

        <!-- replies -->
        <div v-if="repliesMap[c.id] && repliesMap[c.id].length" style="margin-top:8px; margin-left:16px; border-left:2px solid #f5f5f5; padding-left:8px;">
          <div v-for="r in repliesMap[c.id]" :key="r.id" style="padding:6px 0;">
            <div style="display:flex; justify-content:space-between;">
              <div>
                <div style="font-size:13px; color:#333;">{{ r.content }}</div>
                <div style="font-size:12px; color:#999;">{{ new Date(r.createdAt).toLocaleString() }}</div>
              </div>
              <div style="text-align:right;">
                <button @click="$emit('edit', r)">수정</button>
                <button @click="$emit('delete', r)" style="margin-left:6px;">삭제</button>
                <button @click="$emit('like', r)" style="margin-left:6px;">{{ r.liked ? '♥' : '♡' }} {{ r.likes || 0 }}</button>
              </div>
            </div>
          </div>
        </div>

      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  postId: { type: String, required: true },
  comments: { type: Array, default: () => [] }
});
const topLevel = computed(() => (props.comments || []).filter(c => !c.parentId));
const repliesMap = computed(() => {
  const map = {};
  (props.comments || []).forEach(c => {
    if (c.parentId) {
      if (!map[c.parentId]) map[c.parentId] = [];
      map[c.parentId].push(c);
    }
  });
  return map;
});
</script>
