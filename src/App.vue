<template>
  <div id="app">
    <template v-if="showLayout">
      <Header />
      <div style="display: flex; height: calc(100vh - 60px);">
        <Sidebar />
        <main class="main-content">
          <router-view />
        </main>
      </div>
    </template>
    <template v-else>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'



const route = useRoute()

const showLayout = computed(() => {
  return route.path !== '/login'
})
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  background-color: #f5f7fa;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background-color: #f5f7fa;
}
</style>
