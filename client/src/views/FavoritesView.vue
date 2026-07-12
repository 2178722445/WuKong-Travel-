<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '../stores/locations'
import { useAuthStore } from '../stores/auth'
import http from '../api'

const router = useRouter()
const locStore = useLocationStore()
const auth = useAuthStore()
const favLocations = ref<any[]>([])

onMounted(async () => {
  if (!auth.isLoggedIn) { router.push('/login'); return }
  const { data } = await http.get('/favorites')
  favLocations.value = data.map((f: any) => f.location)
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">我的收藏</h2>
          <p class="page-desc">共收藏了 {{ favLocations.length }} 个取景地</p>
        </div>
      </div>

      <div v-if="favLocations.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <p class="empty-text">还没有收藏任何取景地</p>
        <router-link to="/map" class="btn-primary">去地图浏览</router-link>
      </div>

      <div v-for="loc in favLocations" :key="loc.id" class="fav-card" @click="router.push(`/location/${loc.id}`)">
        <div class="fav-card-left">
          <div class="fav-index">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="fav-info">
            <h3 class="fav-name">{{ loc.name }}</h3>
            <p class="fav-location">{{ loc.city }} · {{ loc.district }}</p>
            <div class="fav-tags">
              <span v-for="t in loc.tags" :key="t" class="fav-tag">{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="fav-card-right">
          <span class="fav-arrow">
            查看详情
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </div>
      </div>
    </div>
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}
.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.page-title {
  font-size: var(--font-size-xxl);
  font-weight: 700;
  color: var(--text-primary);
}
.page-desc {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-fast);
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-container);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}
.empty-icon {
  color: var(--text-quaternary);
  margin-bottom: var(--space-md);
}
.empty-text {
  font-size: var(--font-size-md);
  color: var(--text-tertiary);
  margin-bottom: var(--space-md);
}

.fav-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-container);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
  margin-bottom: var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.fav-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-border);
  transform: translateY(-1px);
}

.fav-card-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}
.fav-index {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--color-gold-light);
  color: var(--color-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fav-info {
  min-width: 0;
}
.fav-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fav-location {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-bottom: 6px;
}
.fav-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.fav-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  background: var(--color-gold-light);
  color: var(--color-gold);
  font-weight: 500;
}

.fav-card-right {
  flex-shrink: 0;
  margin-left: var(--space-md);
}
.fav-arrow {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-quaternary);
  transition: color var(--transition-fast);
  white-space: nowrap;
}
.fav-card:hover .fav-arrow {
  color: var(--color-primary);
}
</style>