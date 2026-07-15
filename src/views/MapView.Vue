<template>
  <div class="map-view">
    <h2>지도 화면</h2>

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

      <div v-if="selectedPlace" class="map-view__card">
        <PlaceCard :place="selectedPlace" @add-to-cart="handleAddToCart" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import PlaceCard from '../components/PlaceCard.vue'

import SeoulTourData from '../../day03/data/서울/서울_관광지.json'
import SeoulLeportsData from '../../day03/data/서울/서울_레포츠.json'
import SeoulCultureData from '../../day03/data/서울/서울_문화시설.json'
import SeoulShoppingData from '../../day03/data/서울/서울_쇼핑.json'
import SeoulAccommodationData from '../../day03/data/서울/서울_숙박.json'
import SeoulFestivalData from '../../day03/data/서울/서울_축제공연행사.json'

const categories = ['관광지', '레포츠', '문화시설', '쇼핑', '숙박', '축제공연행사']
const selectedCategory = ref('관광지')
const selectedPlace = ref(null)

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

const getPlacesByCategory = (category) => {
  const data = categoryDataMap[category]
  return (data?.items || []).filter((item) => {
    const lat = parseFloat(item.mapy)
    const lng = parseFloat(item.mapx)
    return !Number.isNaN(lat) && !Number.isNaN(lng)
  })
}

const renderPlaces = (category) => {
  if (!map.value) return

  if (markerLayer) {
    markerLayer.clearLayers()
  }

  const places = getPlacesByCategory(category)

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
  selectedPlace.value = null
  renderPlaces(category)
}

const handleAddToCart = (place) => {
  console.log('장바구니 추가:', place.title)
}

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

  renderPlaces(selectedCategory.value)

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

.map-view__card {
  min-width: 0;
}
</style>