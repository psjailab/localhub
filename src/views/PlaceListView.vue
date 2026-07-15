<template>
  <section class="place-list-view">
    <div class="place-list-view__header">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>

    <div v-if="displayedPlaces.length" class="place-list-view__grid">
      <PlaceCard
        v-for="place in displayedPlaces"
        :key="place.contentid || `${place.title}-${place.addr1}`"
        :place="place"
        @select-place="emit('select-place', place)"
        @add-to-cart="emit('add-to-cart', place)"
      />
    </div>

    <div v-else class="place-list-view__empty">
      표시할 장소가 없습니다.
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import PlaceCard from '../components/PlaceCard.vue'

const props = defineProps({
  title: {
    type: String,
    default: '추천 장소'
  },
  description: {
    type: String,
    default: '선택한 카테고리 기준 추천 장소입니다.'
  },
  places: {
    type: Array,
    default: () => []
  },
  // true면 이미지 유무 상관없이 props.places 그대로 보여줌 (보관함/코스용)
  allowNoImage: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-place', 'add-to-cart'])

const shuffleArray = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const displayedPlaces = computed(() => {
  const src = props.places || []
  if (props.allowNoImage) {
    // 보관함 또는 코스일 때: 이미지 유무 상관없이 전달된 순서대로 최대 6개
    return src.slice(0, 6)
  }
  // 카테고리용: 이미지 있는 항목만 무작위로 섞어 6개
  const withImage = src.filter((p) => p && p.firstimage)
  return shuffleArray(withImage).slice(0, 6)
})
</script>

<style scoped>
.place-list-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.place-list-view__header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.place-list-view__header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.place-list-view__header p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.place-list-view__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.place-list-view__empty {
  padding: 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
}

@media (max-width: 900px) {
  .place-list-view__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .place-list-view__grid {
    grid-template-columns: 1fr;
  }
}
</style>