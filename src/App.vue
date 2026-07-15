<template>
  <header>
    <h1>LocalHub</h1>
    <nav>
      <router-link to="/">지도탐색</router-link>
      <router-link to="/board">커뮤니티</router-link>
    </nav>
  </header>
  
  <main>
    <router-view></router-view>
  </main>
</template>