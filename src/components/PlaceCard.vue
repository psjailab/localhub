<template>
  <div v-if="place" class="place-card">
    <div class="place-card__image-wrap">
      <img
        v-if="place.firstimage"
        :src="place.firstimage"
        :alt="place.title"
        class="place-card__image"
      />
      <div v-else class="place-card__image place-card__image--empty">
        이미지 없음
      </div>
    </div>

    <div class="place-card__body">
      <h3>{{ place.title }}</h3>
      <p>{{ place.addr1 || '주소 정보 없음' }}</p>

      <div class="place-card__actions">
        <button class="place-card__btn" @click="emit('add-to-cart', place)">
          + 장바구니
        </button>

        <button class="place-card__like" @click="toggleLike">
          ♥ {{ likeCount }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  place: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['add-to-cart'])
const likeCount = ref(0)

const toggleLike = () => {
  likeCount.value += 1
}
</script>

<style scoped>
.place-card {
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.place-card__image-wrap {
  background: #f8fafc;
}

.place-card__image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.place-card__image--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.place-card__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.place-card__body h3 {
  margin: 0;
  font-size: 1rem;
}

.place-card__body p {
  margin: 0;
  font-size: 0.9rem;
  color: #64748b;
}

.place-card__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.place-card__btn,
.place-card__like {
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.8rem;
  cursor: pointer;
}

.place-card__btn {
  background: #2563eb;
  color: white;
}

.place-card__like {
  background: #fef2f2;
  color: #dc2626;
}
</style>