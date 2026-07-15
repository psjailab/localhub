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
    default: '선택한 카테고리 기준으로 무작위로 6곳을 보여줍니다.'
  },
  places: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select-place'])

const displayedPlaces = computed(() => {
  const items = [...props.places]

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }

  return items.slice(0, 6)
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