<template>
  <div class="cart">
    <div class="cart__header">
      <button class="cart__toggle" @click="emit('toggle-cart')">
        {{ isOpen ? '보관함 닫기' : '보관함 열기' }}
        <span v-if="items.length" class="cart__badge" aria-hidden="true">{{ items.length }}</span>
      </button>
      <button v-if="items.length" class="cart__clear" @click="emit('clear-cart')">
        보관함 초기화
      </button>
    </div>

    <div v-if="isOpen" class="cart__panel">
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

      <p v-else class="cart__empty">보관함이 비어 있습니다.</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-cart', 'remove-from-cart', 'clear-cart', 'select-place'])
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
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.cart__toggle,
.cart__clear,
.cart__remove {
  border: none;
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.cart__toggle {
  background: #2563eb;
  color: white;
  position: relative;
}

.cart__badge {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  color: white;
  border-radius: 999px;
  font-size: 0.85rem;
  margin-left: 6px;
}

.cart__clear {
  background: #ef4444;
  color: white;
}

.cart__remove {
  background: #f1f5f9;
  color: #334155;
}

.cart__panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
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