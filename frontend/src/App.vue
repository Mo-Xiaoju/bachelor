<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'

</script>

<template>
  <div class="app">
    <Navbar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
.app {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.main-content {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
