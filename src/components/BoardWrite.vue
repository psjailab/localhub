<template>
  <form class="space-y-4">
    <!-- 제목 입력 -->
    <div>
      <input 
        type="text" 
        placeholder="제목을 입력하세요" 
        class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
    </div>

    <!-- 내용 입력 -->
    <div>
      <textarea 
        placeholder="내용을 자유롭게 적어주세요." 
        rows="4" 
        class="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      ></textarea>
    </div>

    <!-- 등록 버튼 -->
    <div class="flex justify-end">
      <button 
        type="button" 
        class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition shadow-sm"
      >
        등록하기
      </button>
    </div>
  </form>
</template>

<script setup>
// 아직 기능이 없으므로 비워둡니다.
</script>