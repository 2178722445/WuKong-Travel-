<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationStore } from '../stores/locations'

const route = useRoute()
const router = useRouter()
const locStore = useLocationStore()
const location = ref<any>(null)

onMounted(async () => {
  const id = Number(route.params.id)
  location.value = await locStore.fetchLocation(id)
  if (location.value) {
    document.title = `${location.value.name} - 黑神话·悟空 山西取景地`
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta')
    meta.setAttribute('name', 'description')
    meta.setAttribute('content', `${location.value.name}位于${location.value.city}${location.value.district}，${location.value.description.slice(0, 150)}`)
    document.head.appendChild(meta)
  }
})
</script>

<template>
  <div class="page">
    <div v-if="location" class="container">
      <nav class="breadcrumb">
        <router-link to="/map" class="breadcrumb-link">取景地图</router-link>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        <router-link :to="`/location/${location.id}`" class="breadcrumb-link">{{ location.name }}</router-link>
      </nav>

      <div class="hero">
        <h1 class="hero-title">{{ location.name }}</h1>
        <p class="hero-subtitle">{{ location.city }} {{ location.district }}</p>
        <div class="hero-tags">
          <span v-for="t in location.tags" :key="t" class="hero-tag">{{ t }}</span>
        </div>
      </div>

      <div class="card">
        <h2 class="card-title">基本信息</h2>
        <table class="info-table">
          <tr><th>年代</th><td>{{ location.period }}</td></tr>
          <tr><th>门票</th><td>{{ location.ticket }}</td></tr>
          <tr><th>开放时间</th><td>{{ location.hours }}</td></tr>
          <tr><th>最佳季节</th><td>{{ location.bestSeason }}</td></tr>
        </table>
      </div>

      <div class="card">
        <h2 class="card-title">简介</h2>
        <p class="card-text">{{ location.description }}</p>
      </div>

      <div class="card">
        <h2 class="card-title">核心看点</h2>
        <p class="card-text">{{ location.highlight }}</p>
      </div>

      <div class="cta-section">
        <router-link :to="`/location/${location.id}`" class="btn-primary">查看完整详情 &rarr;</router-link>
        <router-link to="/itinerary" class="btn-outline">加入行程规划</router-link>
      </div>
    </div>
    <div v-else class="loading-state">加载中...</div>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  overflow-y: auto;
  padding: var(--space-lg);
}
.container {
  max-width: 800px;
  margin: 0 auto;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-bottom: var(--space-lg);
}
.breadcrumb-link {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
}
.breadcrumb-link:hover {
  text-decoration: underline;
}

.hero {
  background: linear-gradient(135deg, var(--color-primary-bg), #f0f5ff);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
}
.hero-title {
  font-size: var(--font-size-title);
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary);
}
.hero-subtitle {
  font-size: var(--font-size-md);
  color: var(--text-tertiary);
  margin-bottom: 12px;
}
.hero-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.hero-tag {
  font-size: 11px;
  padding: 3px 12px;
  border-radius: var(--radius-xs);
  background: var(--color-gold-light);
  color: var(--color-gold);
  font-weight: 500;
}

.card {
  background: var(--bg-container);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  border: 1px solid var(--border-color);
}
.card-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}
.card-text {
  font-size: var(--font-size-md);
  line-height: 1.8;
  color: var(--text-secondary);
}

.info-table {
  width: 100%;
  font-size: var(--font-size-sm);
}
.info-table th {
  width: 100px;
  text-align: left;
  padding: 8px 0;
  color: var(--text-tertiary);
  font-weight: 500;
  border-bottom: 1px solid var(--border-color);
}
.info-table td {
  padding: 8px 0;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
}

.cta-section {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: var(--space-lg);
  background: var(--bg-container);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-md);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-fast);
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: #fff;
  color: var(--color-primary);
  font-size: var(--font-size-md);
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-fast);
}
.btn-outline:hover {
  background: var(--color-primary-bg);
}

.loading-state {
  text-align: center;
  padding: 60px;
  color: var(--text-tertiary);
}
</style>