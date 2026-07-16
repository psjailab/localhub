<template>
  <div class="app-shell">
    <header class="topbar">
      <router-link to="/" class="brand-wrap">
        <div class="brand-mark">L</div>
        <div>
          <p class="brand-name">LocalHub</p>
          <p class="brand-sub">Travel • Community</p>
        </div>
      </router-link>

      <nav class="nav-pills" aria-label="Primary navigation">
        <router-link to="/" class="nav-pill" active-class="nav-pill--active">
          <span>Discover</span>
        </router-link>
        <router-link to="/board" class="nav-pill" active-class="nav-pill--active">
          <span>Community</span>
        </router-link>
      </nav>
    </header>

    <main class="main-shell">
      <section class="hero-panel">
        <div class="hero-copy">
          <p class="eyebrow">Premium regional living</p>
          <h1>Find your next favorite place with calm confidence.</h1>
          <p class="hero-text">
            Explore neighborhoods, local stories, and thoughtful recommendations in a refined experience crafted for modern travelers.
          </p>
          <div class="hero-actions">
            <router-link to="/" class="primary-btn">Start exploring</router-link>
            <router-link to="/board" class="primary-btn">Join the community</router-link>
          </div>
        </div>

        <div class="hero-visual">
          <img src="/seoul.png" alt="Seoul" />
          <div class="floating-card">
            <strong>Seoul</strong>
          </div>
        </div>
      </section>

      <section class="content-surface">
        <router-view />
      </section>

      <footer class="app-footer">
        본 서비스는 한국관광공사의 국문 관광정보 서비스(TourAPI 4.0) 데이터를 활용하였으며, 공공누리 제3유형(출처 표시, 변경 금지) 조건에 따라 출처를 표기합니다. (원본 출처: 한국관광공사 / 공공데이터포털) 또한, 서비스 내 일부 시각 자료는 생성형 AI를 활용하여 자체 제작되었습니다.
      </footer>
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-footer {
  margin-top: 2rem;
  padding: 1rem 1.25rem;
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.6;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-radius: 16px;
}
</style>