<template>
  <!-- [상단 메뉴바 영역] -->
  <header class="bg-white shadow-sm z-20 h-16 flex items-center justify-between px-4 sm:px-6">
    <!-- 로고 및 지역 표시 -->
    <div class="flex items-center space-x-2">
      <h1 class="text-xl font-bold text-blue-600">LocalHub</h1>
      <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded">서울</span>
    </div>
    
    <!-- 탭 메뉴 (지도 / 커뮤니티) -->
    <nav class="flex space-x-2 bg-gray-100 p-1 rounded-lg">
      <router-link to="/" class="px-4 py-1.5 rounded-md text-sm font-semibold text-gray-500 hover:text-gray-900 transition" active-class="bg-white shadow-sm text-blue-600">
        지도탐색
      </router-link>
      <router-link to="/board" class="px-4 py-1.5 rounded-md text-sm font-semibold text-gray-500 hover:text-gray-900 transition" active-class="bg-white shadow-sm text-blue-600">
        커뮤니티
      </router-link>
    </nav>
  </header>
  
  <!-- [바뀌는 화면 영역] -->
  <main class="flex-1 overflow-hidden relative p-4">
    <router-view></router-view>
  </main>
</template>

<script setup>
</script>