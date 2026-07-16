<template>
  <div class="weather-route-container">
    <div class="weather-route-card">
      <div class="weather-route-header">
        <div>
          <p class="weather-route-eyebrow">서울 날씨 & 추천 코스</p>
        </div>

        <div class="weather-route-actions">
          <button
            v-if="selectedCourse"
            type="button"
            class="weather-reset-btn"
            @click="emit('reset-course-selection')"
          >
            선택 해제
          </button>

          <button
            @click="fetchWeather"
            :disabled="loading"
            class="weather-refresh-btn"
          >
            <span v-if="loading" class="weather-refresh-loading">
              <span class="weather-spinner">⏳</span> 로딩 중...
            </span>
            <span v-else>날씨 새로 고침</span>
          </button>
        </div>
      </div>

      <div class="weather-route-body">
        <div class="weather-panel">
          <p class="weather-panel-label">실시간 날씨</p>

          <div class="weather-main">
            <h2 class="weather-temp">{{ temperature }}°C</h2>
            <span class="weather-emoji">{{ weatherEmoji }}</span>
          </div>

          <div class="weather-status-row">
            <span class="weather-status-label">현재 상태 :</span>
            <span class="weather-status-value">{{ weatherLabel }}</span>
          </div>

          <div class="weather-theme-box">
            <p class="weather-theme-label">추천 테마</p>
            <p class="weather-theme-title">{{ currentRouteName }}</p>
            <p class="weather-theme-description">{{ themeDescription }}</p>
          </div>
        </div>

        <div class="weather-course-panel">
          <p class="weather-course-label">추천 여행 코스</p>

          <div class="weather-course-list">
            <button
              v-for="(item, index) in routeItems"
              :key="item.contentid || item.title || index"
              type="button"
              class="weather-course-item"
              :class="{ active: isSelected(item) }"
              @click="selectCourse(item)"
            >
              <p class="weather-course-index" :style="{ color: currentRouteColor }">
                코스 {{ index + 1 }}
              </p>
              <p class="weather-course-title">{{ item.title }}</p>
              <p v-if="item.addr1" class="weather-course-address">{{ item.addr1 }}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import courseData from '../../day03/data/서울/서울_여행코스.json'

const props = defineProps({
  selectedCourse: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['select-course', 'reset-course-selection'])

const currentCondition = ref('sunny')
const temperature = ref(21)
const loading = ref(false)
const routeItems = ref([])

const routesByWeather = {
  sunny: {
    name: '맑은 날 한강·공원 산책 코스',
    color: '#E87A5D',
    keywords: ['공원', '산책', '한강', '궁', '도심', '전망']
  },
  partlyCloudy: {
    name: '구름 많은 날 감성 카페·문화 코스',
    color: '#F59E0B',
    keywords: ['카페', '전시', '문화', '미술관', '골목', '한옥']
  },
  cloudy: {
    name: '흐린 날 조용한 골목 투어',
    color: '#78716c',
    keywords: ['골목', '한옥', '마을', '산책', '문화', '공원']
  },
  rainy: {
    name: '비 오는 날 실내 전시·맛집 코스',
    color: '#3b82f6',
    keywords: ['박물관', '미술관', '전시', '도서관', '카페', '실내', '쇼핑', '문화']
  },
  snowy: {
    name: '눈/추위 날 실내 힐링 코스',
    color: '#0f766e',
    keywords: ['숙박', '카페', '실내', '쇼핑', '전시', '미술관', '문화']
  }
}

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

function pickCourseItems(weatherState) {
  const pool = Array.isArray(courseData?.items) ? courseData.items : []

  if (!pool.length) return []

  const keywords = routesByWeather[weatherState]?.keywords || routesByWeather.sunny.keywords
  const matched = pool.filter((item) => {
    const title = (item?.title || '').toLowerCase()
    return keywords.some((keyword) => title.includes(keyword.toLowerCase()))
  })

  return (matched.length >= 3 ? matched.slice(0, 3) : pool.slice(0, 3)).slice(0, 3)
}

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

const isSelected = (item) => {
  if (!props.selectedCourse) return false
  return props.selectedCourse.contentid === item.contentid || props.selectedCourse.title === item.title
}

const selectCourse = (item) => {
  if (!item) return
  emit('select-course', item)
}

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
    routeItems.value = pickCourseItems(weatherState)
  } catch (error) {
    console.error('날씨 정보 로딩 실패', error)
    currentCondition.value = 'sunny'
    temperature.value = 21
    routeItems.value = pickCourseItems(currentCondition.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchWeather()
})
</script>

<style scoped>
.weather-route-container {
  width: 100%;
  margin: 0.5rem 0 1rem;
}

.weather-route-card {
  border: 1px solid #e7e5e4;
  border-radius: 24px;
  background: #fafaf9;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.weather-route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #e7e5e4;
  padding-bottom: 1rem;
}

.weather-route-eyebrow {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  font-weight: 700;
  color: #a8a29e;
  text-transform: uppercase;
}

.weather-route-actions {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.weather-refresh-btn,
.weather-reset-btn {
  border: none;
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
}

.weather-refresh-btn {
  background: #1c1917;
  color: white;
}

.weather-reset-btn {
  background: #e7e5e4;
  color: #1c1917;
}

.weather-refresh-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.weather-refresh-loading {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.weather-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

.weather-route-body {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.weather-panel,
.weather-course-panel {
  border: 1px solid #f5f5f4;
  border-radius: 20px;
  background: white;
  padding: 1rem;
}

.weather-panel-label,
.weather-course-label {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  letter-spacing: 0.2em;
  font-weight: 700;
  color: #a8a29e;
  text-transform: uppercase;
}

.weather-main {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}

.weather-temp {
  margin: 0;
  font-size: 2.3rem;
  font-weight: 800;
  color: #1c1917;
}

.weather-emoji {
  font-size: 1.8rem;
}

.weather-status-row {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.weather-status-label {
  color: #78716c;
  font-size: 0.95rem;
}

.weather-status-value {
  color: #1c1917;
  font-weight: 600;
}

.weather-theme-box {
  margin-top: 1rem;
  border-radius: 16px;
  background: #f8fafc;
  padding: 1rem;
}

.weather-theme-label {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #a8a29e;
  text-transform: uppercase;
}

.weather-theme-title {
  margin: 0.45rem 0 0.35rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1c1917;
}

.weather-theme-description {
  margin: 0;
  color: #57534e;
  font-size: 0.95rem;
  line-height: 1.5;
}

.weather-course-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.weather-course-item {
  width: 100%;
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  background: #f8fafc;
  padding: 0.9rem;
  text-align: left;
  cursor: pointer;
}

.weather-course-item.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.weather-course-index {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.weather-course-title {
  margin: 0.4rem 0 0.2rem;
  font-weight: 700;
  color: #1c1917;
}

.weather-course-address {
  margin: 0;
  font-size: 0.85rem;
  color: #78716c;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .weather-route-body {
    grid-template-columns: 1fr;
  }
}
</style>