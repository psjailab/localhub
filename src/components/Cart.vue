<template>
  <div class="cart">
    <div class="cart__header">
      <h3>보관함</h3>
      <button v-if="items.length" class="cart__clear" @click="emit('clear-cart')">
        전체 초기화
      </button>
    </div>

    <div v-if="items.length" class="cart__list">
      <div
        v-for="item in items"
        :key="item.contentid"
        class="cart__item"
        @click="emit('select-place', item)"
      >
        <div>
          <strong>{{ item.title }}</strong>
          <p>{{ item.addr1 || '주소 정보 없음' }}</p>
        </div>
        <button class="cart__remove" @click.stop="emit('remove-from-cart', item)">
          삭제
        </button>
      </div>
    </div>

    <p v-else class="cart__empty">아직 보관한 장소가 없습니다.</p>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['remove-from-cart', 'clear-cart', 'select-place'])
</script>

<style scoped>
.cart {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.cart__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.cart__clear,
.cart__remove {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
}

.cart__clear {
  background: #ef4444;
  color: white;
}

.cart__remove {
  background: #f1f5f9;
  color: #334155;
}

.cart__list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.cart__item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.7rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  cursor: pointer;
}

.cart__item:hover {
  border-color: #cbd5e1;
  background: #eef2ff;
}

.cart__item p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #64748b;
}

.cart__empty {
  margin: 0;
  color: #64748b;
}
</style>