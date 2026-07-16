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

      <button class="ghost-action">Plan a stay</button>
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
            <router-link to="/board" class="secondary-btn">Join the community</router-link>
          </div>
        </div>

        <div class="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
            alt="Scenic travel landscape"
          />
          <div class="floating-card">
            <p>Featured now</p>
            <strong>Seoul • after-hours city walks</strong>
          </div>
        </div>
      </section>

      <section class="content-surface">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script setup>
</script>