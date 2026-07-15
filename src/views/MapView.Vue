<template>
  <div class="map-view">
    <h2>지도 화면</h2>

    <CourseSelect @select-course="handleSelectCourse" />

    <div class="map-view__filters">
      <button
        v-for="category in categories"
        :key="category"
        class="filter-btn"
        :class="{ active: selectedCategory === category }"
        @click="selectCategory(category)"
      >
        {{ category }}
      </button>
    </div>

    <div class="map-view__content">
      <div ref="mapContainer" class="map-view__map"></div>

      <div class="map-view__side">
        <div v-if="selectedPlace" class="map-view__card">
          <PlaceCard
            :place="selectedPlace"
            @add-to-cart="handleAddToCart"
            @select-place="handleSelectPlace"
          />
        </div>

        <Cart
          :items="cartItems"
          @remove-from-cart="removeFromCart"
          @clear-cart="clearCart"
          @select-place="handleSelectPlace"
        />
      </div>
    </div>

    <PlaceListView
      :title="listTitle"
      :description="listDescription"
      :places="displayedPlaces"
      @select-place="handleSelectPlace"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PlaceCard from '../components/PlaceCard.vue'
import PlaceListView from './PlaceListView.vue'
import Cart from '../components/Cart.vue'
import CourseSelect from '../components/CourseSelect.vue'

import SeoulTourData from '../../day03/data/서울/서울_관광지.json'
import SeoulLeportsData from '../../day03/data/서울/서울_레포츠.json'
import SeoulCultureData from '../../day03/data/서울/서울_문화시설.json'
import SeoulShoppingData from '../../day03/data/서울/서울_쇼핑.json'
import SeoulAccommodationData from '../../day03/data/서울/서울_숙박.json'
import SeoulFestivalData from '../../day03/data/서울/서울_축제공연행사.json'

const categories = ['관광지', '레포츠', '문화시설', '쇼핑', '숙박', '축제공연행사']
const selectedCategory = ref('관광지')
const selectedPlace = ref(null)
const selectedCourse = ref(null)
const cartItems = ref([])
const viewMode = ref('category')

const categoryDataMap = {
  관광지: SeoulTourData,
  레포츠: SeoulLeportsData,
  문화시설: SeoulCultureData,
  쇼핑: SeoulShoppingData,
  숙박: SeoulAccommodationData,
  축제공연행사: SeoulFestivalData
}

const mapContainer = ref(null)
const map = ref(null)
let markerLayer = null

const normalizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const stopWords = [
  '코스', '여행', '서울', '속', '과', '와', '을', '를', '의', '에', '에서',
  '하는', '하다', '한', '가', '이', '도', '로', '안', '앞', '중', '좀', '더'
]

const getPlacesByCategory = (category) => {
  const data = categoryDataMap[category]
  return (data?.items || []).filter((item) => {
    const lat = parseFloat(item.mapy)
    const lng = parseFloat(item.mapx)
    return !Number.isNaN(lat) && !Number.isNaN(lng)
  })
}

const getPlacesForCourse = (course) => {
  if (!course?.title) return []

  const keywords = course.title
    .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !stopWords.includes(word))

  const allPlaces = Object.values(categoryDataMap).flatMap((data) => data?.items || [])

  const scored = allPlaces
    .filter((item) => {
      const lat = parseFloat(item.mapy)
      const lng = parseFloat(item.mapx)
      return !Number.isNaN(lat) && !Number.isNaN(lng)
    })
    .map((item) => {
      const text = `${item.title || ''} ${item.addr1 || ''}`
      const normalizedTextValue = normalizeText(text)
      let score = 0

      keywords.forEach((keyword) => {
        const normalizedKeyword = normalizeText(keyword)
        if (!normalizedKeyword) return
        if (normalizedTextValue.includes(normalizedKeyword)) {
          score += 2
        }
      })

      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || (a.item.title || '').localeCompare(b.item.title || '', 'ko'))

  if (scored.length) {
    return scored.slice(0, 8).map((entry) => entry.item)
  }

  return getPlacesByCategory(selectedCategory.value).slice(0, 6)
}

const getPlacesForCart = () => {
  return cartItems.value.filter((item) => {
    const lat = parseFloat(item.mapy)
    const lng = parseFloat(item.mapx)
    return !Number.isNaN(lat) && !Number.isNaN(lng)
  })
}

const displayedPlaces = computed(() => {
  if (viewMode.value === 'course' && selectedCourse.value) {
    return getPlacesForCourse(selectedCourse.value)
  }

  if (viewMode.value === 'cart') {
    return getPlacesForCart()
  }

  return getPlacesByCategory(selectedCategory.value)
})

const listTitle = computed(() => {
  if (viewMode.value === 'course' && selectedCourse.value) {
    return selectedCourse.value.title
  }
  if (viewMode.value === 'cart') {
    return '보관함 장소'
  }
  return `${selectedCategory.value} 추천 장소`
})

const listDescription = computed(() => {
  if (viewMode.value === 'course' && selectedCourse.value) {
    return '선택한 코스와 관련된 장소들을 보여줍니다.'
  }
  if (viewMode.value === 'cart') {
    return '보관함에 담긴 장소만 지도와 목록에 표시됩니다.'
  }
  return '선택한 카테고리 기준으로 무작위로 6곳을 보여줍니다.'
})

const renderPlaces = () => {
  if (!map.value) return

  if (markerLayer) {
    markerLayer.clearLayers()
  }

  const places = displayedPlaces.value

  places.forEach((place) => {
    const lat = parseFloat(place.mapy)
    const lng = parseFloat(place.mapx)

    const marker = L.marker([lat, lng])

    marker.on('click', () => {
      selectedPlace.value = place
    })

    marker.addTo(markerLayer)
  })
}

const selectCategory = (category) => {
  selectedCategory.value = category
  selectedCourse.value = null
  selectedPlace.value = null
  viewMode.value = 'category'
  renderPlaces()
}

const handleSelectCourse = (course) => {
  selectedCourse.value = course
  selectedPlace.value = null
  viewMode.value = 'course'
  renderPlaces()

  if (course) {
    const firstPlace = displayedPlaces.value[0]
    if (firstPlace) {
      const lat = parseFloat(firstPlace.mapy)
      const lng = parseFloat(firstPlace.mapx)

      if (map.value && !Number.isNaN(lat) && !Number.isNaN(lng)) {
        map.value.flyTo([lat, lng], 13, { duration: 0.8 })
      }
    }
  }
}

const handleSelectPlace = (place) => {
  if (!place) return

  selectedPlace.value = place

  const lat = parseFloat(place.mapy)
  const lng = parseFloat(place.mapx)

  if (map.value && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    map.value.flyTo([lat, lng], 14, { duration: 0.8 })
  }
}

const handleAddToCart = (place) => {
  if (!place) return

  const exists = cartItems.value.some((item) => item.contentid === place.contentid)
  if (!exists) {
    cartItems.value.push(place)
  }

  viewMode.value = 'cart'
  selectedCourse.value = null
  selectedPlace.value = null
  renderPlaces()
}

const removeFromCart = (place) => {
  cartItems.value = cartItems.value.filter((item) => item.contentid !== place.contentid)

  if (cartItems.value.length === 0) {
    viewMode.value = 'category'
    selectedCourse.value = null
    selectedPlace.value = null
    renderPlaces()
  } else {
    renderPlaces()
  }
}

const clearCart = () => {
  cartItems.value = []
  viewMode.value = 'category'
  selectedCourse.value = null
  selectedPlace.value = null
  renderPlaces()
}

watch(cartItems, () => {
  if (viewMode.value === 'cart') {
    renderPlaces()
  }
})

const initMap = () => {
  if (!mapContainer.value) return

  map.value = L.map(mapContainer.value, {
    center: [37.5665, 126.9780],
    zoom: 12,
    scrollWheelZoom: true
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map.value)

  markerLayer = L.layerGroup().addTo(map.value)

  renderPlaces()

  setTimeout(() => {
    map.value?.invalidateSize()
  }, 200)
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  map.value?.remove()
  map.value = null
  markerLayer = null
})
</script>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-view__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-btn {
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
}

.filter-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.map-view__content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 1rem;
  align-items: start;
}

.map-view__map {
  width: 100%;
  height: 560px;
  min-height: 560px;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
}

.map-view__side {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.map-view__card {
  min-width: 0;
}
</style>