<template>
  <section class="course-select">
    <div class="course-select__header">
      <h3>서울 여행 코스</h3>
      <p>테마별로 정리된 서울 여행 코스를 확인해보세요.</p>
    </div>

    <div class="course-select__filters">
      <button
        v-for="theme in themes"
        :key="theme.value"
        class="course-select__filter-btn"
        :class="{ active: selectedTheme === theme.value }"
        @click="selectedTheme = theme.value"
      >
        {{ theme.label }}
      </button>
    </div>

    <div class="course-select__summary">
      {{ filteredCourses.length }}개의 코스
    </div>

    <div v-if="filteredCourses.length" class="course-select__grid">
      <article
        v-for="course in filteredCourses"
        :key="course.contentid"
        class="course-select__card"
        @click="emit('select-course', course)"
      >
        <img
          v-if="course.firstimage"
          :src="course.firstimage"
          :alt="course.title"
          class="course-select__image"
        />
        <div v-else class="course-select__image course-select__image--empty">
          이미지 없음
        </div>

        <div class="course-select__body">
          <h4>{{ course.title }}</h4>
          <p>{{ course.addr1 || '주소 정보 없음' }}</p>
        </div>
      </article>
    </div>

    <p v-else class="course-select__empty">표시할 코스가 없습니다.</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import courseData from '../../day03/data/서울/서울_여행코스.json'

const emit = defineEmits(['select-course'])

const rawCourses = [...(courseData.items || [])]

const normalizeText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const themeConfig = [
  {
    value: 'all',
    label: '전체 보기',
    titles: []
  },
  {
    value: 'history',
    label: '역사와 전통의 발자취',
    titles: [
      '태조 이성계, 조선을 건국하고 종묘와 사직을 세우다',
      '한양의 500년 도읍을 거닐다',
      '경복궁 북쪽마을 북촌 즐기기',
      '600년 역사의 재미난 스토리가 흐르는 골목',
      '동대문 주변에서 만나는 역사의 현장',
      '북촌을 중심으로 한 조선시대 생활 이야기',
      '고풍스러움이 흐르는 북촌',
      '조선의 왕들이 지극히 아끼던 공간',
      '서울의 순교성지 약현성당 탐방 코스',
      '3·1운동의 정신을 느껴보는 서울 여행',
      '옛 서울의 아름다움에 반하다',
      '사라진 성곽길을 따라 걷기',
      '도시의 고풍스러운 정취를 즐기다'
    ]
  },
  {
    value: 'healing',
    label: '도심 속 힐링과 자연 산책',
    titles: [
      '서울의 하이드파크와 전통시장',
      '서울 양천구 서서울호수공원 코스',
      '‘충혼’의 수양벚꽃 마중하는 호젓한 꽃길',
      '여의도 샛강을 따라 걷는 길',
      '남산 자락 딸각발이를 만나러 가는 길',
      '오래된 시장의 북적임과 들꽃이 가득한 홍릉수목원에서 하루를 보내다',
      '청계천을 돌아 경복궁에서 인사동까지',
      '빌딩 숲 강남 속에서 찾은 힐링'
    ]
  },
  {
    value: 'culture',
    label: '감성 골목과 예술·문화 탐방',
    titles: [
      '세련됨에 깃든 촌스러움이 정겹다. 부암동',
      '과거와 현재의 시간이 겹쳐진 부암동길',
      '강북의 오래된 길을 따라 걷다',
      '미술관과 아쿠아리움으로 떠나는 힐링 여행',
      '남산을 중심으로 문화놀이',
      '성북동 마을과 문화 유적 이야기',
      '서울의 거리에 핀 세계의 멋과 맛 서래마을 탐방',
      '서울의 상수동 이색골목 탐방',
      '성안 마을 혜화동의 어제와 오늘',
      '성북동 마을과 고택, 예술가들의 이야기'
    ]
  },
  {
    value: 'food-night',
    label: '미식과 야경, 그리고 일상 여행',
    titles: [
      '청와대 앞 코스 돌아보기',
      '가정의 달, 싱글을 위한 혼자 먹는 밥상 코스',
      '서울시티투어 버스를 이용하면 서울여행이 쉬워진다',
      '낮이 좋아? 밤이 좋아? 서울의 주경, 야경 여행코스',
      '서울의 대문 숭례문과 그 주변의 사람들을 찾아',
      '서울의 아름다운 밤을 바라보다.',
      '서촌에서 즐기는 즐거운 맛산책',
      '서울의 놀거리, 볼거리를 하루에',
      '서울 해방촌의 이국적인 맛집을 찾아서',
      '명동에서 이태원까지 서울의 낭만을...',
      '혼자만의 시간이 필요할 때 떠나는 도심 속 나홀로 여행',
      '서울 용산을 중심으로 알차게 하루 즐기기',
      '동대문 투어하기',
      '서울에서 전통주 체험을 할 수 있는 곳',
      '잠실 관광특구 코스'
    ]
  }
]

const selectedTheme = ref('all')
const themes = themeConfig

const filteredCourses = computed(() => {
  const selected = themes.find((theme) => theme.value === selectedTheme.value)

  if (!selected) {
    return []
  }

  const courses = rawCourses.filter((course) => {
    if (selected.value === 'all') {
      return true
    }

    const title = normalizeText(course.title)
    return selected.titles.some((target) => {
      const normalizedTarget = normalizeText(target)
      return title === normalizedTarget || title.includes(normalizedTarget) || normalizedTarget.includes(title)
    })
  })

  return courses.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
})
</script>

<style scoped>
.course-select {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
}

.course-select__header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.course-select__header h3 {
  margin: 0;
  font-size: 1.15rem;
}

.course-select__header p {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}

.course-select__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.course-select__filter-btn {
  border: 1px solid #cbd5e1;
  background: white;
  color: #334155;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
}

.course-select__filter-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.course-select__summary {
  color: #475569;
  font-size: 0.95rem;
}

.course-select__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.course-select__card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.course-select__image {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
  background: #f8fafc;
}

.course-select__image--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.course-select__body {
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.course-select__body h4 {
  margin: 0;
  font-size: 1rem;
}

.course-select__body p {
  margin: 0;
  color: #64748b;
  font-size: 0.9rem;
}

.course-select__empty {
  margin: 0;
  color: #64748b;
  padding: 1rem;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}

@media (max-width: 900px) {
  .course-select__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .course-select__grid {
    grid-template-columns: 1fr;
  }
}
</style>