<template>
  <div class="weather-route-container max-w-6xl mx-auto p-4 md:p-6">
    <div class="relative overflow-hidden rounded-[32px] border border-stone-200/70 shadow-2xl bg-stone-50">
      <div class="absolute inset-0 bg-[url('/src/assets/map-bg.jpg')] bg-cover bg-center opacity-10"></div>
      
      <div class="relative z-10 px-6 py-6 md:px-8 md:py-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-stone-200/50 pb-6">
          <div>
            <p class="text-xs uppercase tracking-[0.25em] font-semibold text-stone-400">LocalHub</p>
            <h1 class="text-2xl md:text-3xl font-bold text-stone-900 mt-1 font-serif">서울 날씨 & 추천 코스</h1>
          </div>
          <button
            @click="fetchWeather"
            :disabled="loading"
            class="inline-flex h-12 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <span class="animate-spin text-sm">⏳</span> 로딩 중...
            </span>
            <span v-else>날씨 새로 고침</span>
          </button>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-2">
          
          <div class="flex flex-col rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl justify-between h-full">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] font-semibold text-stone-400">실시간 날씨</p>
              
              <div class="mt-4 flex items-baseline gap-4">
                <h2 class="text-5xl font-black text-stone-900 tracking-tight">
                  {{ temperature }}°C
                </h2>
                <span class="text-4xl">{{ weatherEmoji }}</span>
              </div>
              
              <div class="mt-3 flex items-center gap-2">
                <span class="text-sm font-medium text-stone-600">현재 상태 :</span>
                <span class="text-sm font-semibold text-stone-900">{{ weatherLabel }}</span>
              </div>
            </div>

            <div class="mt-8 rounded-3xl bg-stone-50 p-5 border border-stone-200/50">
              <p class="text-xs font-semibold text-stone-400 uppercase tracking-wider">추천 테마</p>
              <p class="mt-2 text-lg font-bold text-stone-900">{{ currentRouteName }}</p>
              <p class="mt-1 text-sm text-stone-600 leading-relaxed">{{ themeDescription }}</p>
            </div>
          </div>

          <div class="flex flex-col rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-xl backdrop-blur-xl h-full justify-start">
            <p class="text-xs uppercase tracking-[0.2em] font-semibold text-stone-400 mb-4">추천 여행 코스</p>
            
            <div class="space-y-3">
              <div
                v-for="(item, index) in routeItems"
                :key="item.contentid || index"
                class="rounded-3xl border border-stone-200 bg-stone-50 p-4 transition duration-200 hover:shadow-sm"
              >
                <p class="text-xs font-semibold uppercase tracking-wider" :style="{ color: currentRouteColor }">
                  코스 {{ index + 1 }}
                </p>
                <p class="mt-1.5 font-bold text-stone-900 text-base">{{ item.title }}</p>
                <p v-if="item.addr1" class="mt-1 text-xs text-stone-400">{{ item.addr1 }}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="mt-6 rounded-[32px] border border-stone-200/70 bg-white shadow-2xl overflow-hidden">
      <div id="map" class="h-[420px] w-full z-10"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import courseData from '../../day03/data/서울/서울_여행코스.json'
import touristData from '../../day03/data/서울/서울_관광지.json'

// 1. 상태값 정의
const currentCondition = ref('sunny')
const temperature = ref(21)
const loading = ref(false)
const routeItems = ref([])

let mapInstance = null
let currentPolyline = null

// 2. 5가지 날씨 분류 및 각 날씨별 "3개"의 고정 좌표 정보 정의
const routesByWeather = {
  sunny: {
    name: '맑은 날 한강·공원 산책 코스',
    color: '#E87A5D',
    keywords: ['공원', '산책', '한강', '궁', '도심', '전망'],
    coords: [
      [37.5665, 126.9780],
      [37.5759, 126.9768],
      [37.5826, 126.9913]
    ]
  },
  partlyCloudy: {
    name: '구름 많은 날 감성 카페·문화 코스',
    color: '#F59E0B',
    keywords: ['카페', '전시', '문화', '미술관', '골목', '한옥'],
    coords: [
      [37.5796, 126.9848],
      [37.5730, 126.9873],
      [37.5680, 126.9890]
    ]
  },
  cloudy: {
    name: '흐린 날 조용한 골목 투어',
    color: '#78716c',
    keywords: ['골목', '한옥', '마을', '산책', '문화', '공원'],
    coords: [
      [37.5796, 126.9848],
      [37.5730, 126.9873],
      [37.5665, 126.9780]
    ]
  },
  rainy: {
    name: '비 오는 날 실내 전시·맛집 코스',
    color: '#3b82f6',
    keywords: ['박물관', '미술관', '전시', '도서관', '카페', '실내', '쇼핑', '문화'],
    coords: [
      [37.5598, 126.9753],
      [37.5612, 126.9850],
      [37.5660, 126.9880]
    ]
  },
  snowy: {
    name: '눈/추위 날 실내 힐링 코스',
    color: '#0f766e',
    keywords: ['숙박', '카페', '실내', '쇼핑', '전시', '미술관', '문화'],
    coords: [
      [37.5630, 126.9800],
      [37.5650, 126.9890],
      [37.5700, 126.9830]
    ]
  }
}

// 3. Computed 속성을 활용한 기상 상태 바인딩
const weatherLabel = computed(() => {
  const map = {
    sunny: '☀️ 맑음',
    partlyCloudy: '🌤️ 구름 많음',
    cloudy: '☁️ 흐림',
    rainy: '🌧️ 비',
    snowy: '❄️ 눈/폭풍'
  }
  return map[currentCondition.value] || `🌀 기타 (${currentCondition.value})`
})

const currentRouteName = computed(() => {
  return routesByWeather[currentCondition.value]?.name || routesByWeather.sunny.name
})

const currentRouteColor = computed(() => {
  return routesByWeather[currentCondition.value]?.color || routesByWeather.sunny.color
})

const weatherEmoji = computed(() => {
  const map = {
    sunny: '☀️',
    partlyCloudy: '🌤️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️'
  }
  return map[currentCondition.value] || '🌦️'
})

const themeDescription = computed(() => {
  const map = {
    sunny: '맑은 날 한강과 공원 산책 코스를 추천합니다.',
    partlyCloudy: '구름 많은 날 감성 카페와 문화 코스를 추천합니다.',
    cloudy: '흐린 날 조용한 골목 코스를 추천합니다.',
    rainy: '비 오는 날 실내 전시와 맛집 코스를 추천합니다.',
    snowy: '눈/추위에는 따스한 실내 힐링 코스를 추천합니다.'
  }
  return map[currentCondition.value] || '서울 맞춤 여행 코스를 추천합니다.'
})

// 4. Leaflet 지도 제어
function initMap() {
  if (typeof window.L === 'undefined') {
    console.error('Leaflet.js가 아직 로드되지 않았습니다.')
    return
  }

  const L = window.L
  mapInstance = L.map('map').setView([37.5665, 126.9780], 13)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(mapInstance)

  drawRecommendedRoute(currentCondition.value)
}

function getRouteCoordsFromItems(items) {
  return (items || [])
    .map(item => {
      const lat = Number(item?.mapy)
      const lng = Number(item?.mapx)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
      return [lat, lng]
    })
    .filter(Boolean)
}

// 5. 서울 데이터에서 날씨별 3가지 코스 필터링 추출
function pickCourseItems(weatherState) {
  const pool = [
    ...(Array.isArray(courseData?.items) ? courseData.items : []),
    ...(Array.isArray(touristData?.items) ? touristData.items : [])
  ]

  if (!pool.length) return []

  const keywords = routesByWeather[weatherState]?.keywords || routesByWeather.sunny.keywords
  const matched = pool.filter(item => {
    const title = (item?.title || '').toLowerCase()
    return keywords.some(keyword => title.includes(keyword.toLowerCase()))
  })

  // 항상 정확하게 "3가지 코스"만 추출하여 리스트 구성 및 지도 매핑 보장
  return (matched.length >= 3 ? matched.slice(0, 3) : pool.slice(0, 3)).slice(0, 3)
}

// 6. 날씨 분류 로직
function classifyWeather(code, temp) {
  const numericCode = Number(code)
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]
  const snowCodes = [71, 73, 75, 77, 85, 86]
  const cloudyCodes = [2, 3, 45, 48]

  if (rainCodes.includes(numericCode)) return 'rainy'
  if (snowCodes.includes(numericCode)) return 'snowy'
  if (cloudyCodes.includes(numericCode)) return 'cloudy'
  if (numericCode === 1) return 'partlyCloudy'
  if (Number.isFinite(temp) && temp <= 5) return 'snowy'
  return 'sunny'
}

// 7. 추천 동선 라인 그리기 (3선 연결)
function drawRecommendedRoute(weatherState) {
  if (!mapInstance || typeof window.L === 'undefined') return

  const L = window.L

  if (currentPolyline) {
    mapInstance.removeLayer(currentPolyline)
    currentPolyline = null
  }

  const selectedItems = pickCourseItems(weatherState)
  routeItems.value = selectedItems

  const coords = getRouteCoordsFromItems(selectedItems)

  if (coords.length >= 2) {
    currentPolyline = L.polyline(coords, {
      color: routesByWeather[weatherState]?.color || routesByWeather.sunny.color,
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineJoin: 'round'
    }).addTo(mapInstance)

    mapInstance.fitBounds(currentPolyline.getBounds(), { padding: [50, 50] })
    return
  }

  const fallbackRoute = routesByWeather[weatherState] || routesByWeather.sunny
  currentPolyline = L.polyline(fallbackRoute.coords, {
    color: fallbackRoute.color,
    weight: 5,
    opacity: 0.85,
    dashArray: '8, 8',
    lineJoin: 'round'
  }).addTo(mapInstance)

  mapInstance.fitBounds(currentPolyline.getBounds(), { padding: [50, 50] })
}

// 8. 오픈메테오 날씨 API 동적 갱신
async function fetchWeather() {
  loading.value = true

  try {
    const response = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weather_code&timezone=Asia%2FSeoul'
    )

    if (!response.ok) {
      throw new Error(`날씨 API 오류: ${response.status}`)
    }

    const data = await response.json()
    const weatherCode = data?.current?.weather_code
    const currentTemp = data?.current?.temperature_2m

    const weatherState = classifyWeather(weatherCode, Number(currentTemp))
    currentCondition.value = weatherState
    temperature.value = Math.round(Number(currentTemp ?? 21))

    drawRecommendedRoute(weatherState)
  } catch (error) {
    console.error('날씨 정보 로딩 실패', error)
    currentCondition.value = 'sunny'
    temperature.value = 21
    drawRecommendedRoute(currentCondition.value)
  } finally {
    loading.value = false
  }
}

// 9. 마운트 시 동작 제어
onMounted(() => {
  setTimeout(() => {
    initMap()
    fetchWeather()
  }, 100)
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style scoped>
.weather-route-container {
  min-height: 100vh;
}
</style>