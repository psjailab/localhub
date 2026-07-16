<template>
  <div class="map-view">
    <h2>서울 여행 지도</h2>

    <CourseSelect @select-course="handleSelectCourse" @reset-course-selection="handleResetCourseSelection" />

    <Weatherinfo />

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
        <Chatbot />

        <div v-if="selectedPlace" class="map-view__card">
          <PlaceCard
            :place="selectedPlace"
            @add-to-cart="handleAddToCart"
            @select-place="handleSelectPlace"
          />
        </div>

        <Cart
          :items="cartItems"
          :is-open="isCartOpen"
          @toggle-cart="toggleCart"
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
      :allow-no-image="(viewMode === 'cart' && isCartOpen) || (viewMode === 'course' && selectedCourse)"
      @select-place="handleSelectPlace"
      @add-to-cart="handleAddToCart"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PlaceCard from '../components/PlaceCard.vue'
import PlaceListView from '../components/PlaceListView.vue'
import Cart from '../components/Cart.vue'
import CourseSelect from '../components/CourseSelect.vue'
import Chatbot from '../components/Chatbot.vue'
import Weatherinfo from '../components/Weatherinfo.vue'

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
const isCartOpen = ref(false)

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
const visiblePlaces = ref([])

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

const getVisiblePlaces = (places) => {
  if (!map.value || !map.value.getBounds) return places
  const bounds = map.value.getBounds()
  return (places || []).filter((place) => {
    const lat = parseFloat(place.mapy)
    const lng = parseFloat(place.mapx)
    return !Number.isNaN(lat) && !Number.isNaN(lng) && bounds.contains([lat, lng])
  })
}

const updateVisiblePlaces = () => {
  if (viewMode.value === 'category') {
    visiblePlaces.value = getVisiblePlaces(getPlacesByCategory(selectedCategory.value))
  } else if (viewMode.value === 'course' && selectedCourse.value) {
    visiblePlaces.value = getPlacesForCourse(selectedCourse.value)
  } else if (viewMode.value === 'cart' && isCartOpen.value) {
    visiblePlaces.value = getPlacesForCart()
  } else {
    visiblePlaces.value = getPlacesByCategory(selectedCategory.value)
  }
}

const displayedPlaces = computed(() => {
  if (viewMode.value === 'course' && selectedCourse.value) {
    return getPlacesForCourse(selectedCourse.value)
  }

  if (viewMode.value === 'cart' && isCartOpen.value) {
    return getPlacesForCart()
  }

  return visiblePlaces.value
})

const listTitle = computed(() => {
  if (viewMode.value === 'course' && selectedCourse.value) {
    return selectedCourse.value.title
  }
  if (viewMode.value === 'cart' && isCartOpen.value) {
    return '보관함'
  }
  return `${selectedCategory.value} 추천 장소`
})

const listDescription = computed(() => {
  if (viewMode.value === 'course' && selectedCourse.value) {
    return '선택한 코스의 장소들을 보여줍니다.'
  }
  if (viewMode.value === 'cart' && isCartOpen.value) {
    return '보관함에 담긴 장소만 표시됩니다.'
  }
  return '선택한 카테고리 기준으로 추천 장소를 보여줍니다.'
})

const renderPlaces = () => {
  if (!map.value) return

  if (!markerLayer) {
    markerLayer = L.layerGroup().addTo(map.value)
  } else {
    markerLayer.clearLayers()
  }

  updateVisiblePlaces()

  const places = displayedPlaces.value

  places.forEach((place) => {
    const lat = parseFloat(place.mapy)
    const lng = parseFloat(place.mapx)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return
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

const flyToFirstValidPlace = (places, zoom = 13) => {
  if (!map.value || !places || !places.length) return
  const first = places.find((p) => {
    const lat = parseFloat(p.mapy)
    const lng = parseFloat(p.mapx)
    return !Number.isNaN(lat) && !Number.isNaN(lng)
  })
  if (!first) return
  const lat = parseFloat(first.mapy)
  const lng = parseFloat(first.mapx)
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    map.value.flyTo([lat, lng], zoom, { duration: 0.8 })
  }
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

const handleResetCourseSelection = () => {
  selectedCourse.value = null
  selectedPlace.value = null
  viewMode.value = 'category'
  renderPlaces()
}

const toggleCart = () => {
  isCartOpen.value = !isCartOpen.value
  if (isCartOpen.value) {
    viewMode.value = 'cart'
    selectedCourse.value = null
    selectedPlace.value = null
    renderPlaces()
    const cartPlaces = getPlacesForCart()
    if (cartPlaces.length > 0) {
      flyToFirstValidPlace(cartPlaces, 13)
    }
  } else {
    viewMode.value = 'category'
    selectedCourse.value = null
    selectedPlace.value = null
    renderPlaces()
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
}

const removeFromCart = (place) => {
  cartItems.value = cartItems.value.filter((item) => item.contentid !== place.contentid)

  if (cartItems.value.length === 0) {
    if (isCartOpen.value) {
      viewMode.value = 'cart'
    } else {
      viewMode.value = 'category'
    }
    selectedCourse.value = null
    selectedPlace.value = null
    renderPlaces()
  } else {
    renderPlaces()
  }
}

const clearCart = () => {
  cartItems.value = []
  if (isCartOpen.value) {
    viewMode.value = 'cart'
  } else {
    viewMode.value = 'category'
  }
  selectedCourse.value = null
  selectedPlace.value = null
  renderPlaces()
}

watch(cartItems, () => {
  if (viewMode.value === 'cart' && isCartOpen.value) {
    renderPlaces()
    const cartPlaces = getPlacesForCart()
    if (cartPlaces.length > 0) {
      flyToFirstValidPlace(cartPlaces, 13)
    }
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

  map.value.on('moveend', renderPlaces)
  map.value.on('zoomend', renderPlaces)

  setTimeout(() => {
    map.value?.invalidateSize()
  }, 200)
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.off('moveend', renderPlaces)
    map.value.off('zoomend', renderPlaces)
    map.value.remove()
  }
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
  grid-template-columns: 1.5fr 360px;
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
</style>