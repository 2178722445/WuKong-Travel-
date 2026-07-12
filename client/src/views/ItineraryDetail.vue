<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationStore } from '../stores/locations'
import { useAuthStore } from '../stores/auth'
import http from '../api'

const route = useRoute()
const router = useRouter()
const locStore = useLocationStore()
const auth = useAuthStore()

const itinerary = ref<any>(null)

onMounted(async () => {
  await locStore.fetchLocations()
  const id = route.params.id
  if (auth.isLoggedIn) {
    const { data } = await http.get(`/itineraries/${id}`)
    itinerary.value = data
  } else {
    router.push('/login')
  }
})

function getLoc(id: number) {
  return locStore.locations.find(l => l.id === id)
}

function parseIds(ids: any): number[] {
  if (Array.isArray(ids)) return ids
  try { return JSON.parse(ids) } catch { return [] }
}
</script>

<template>
  <div class="page">
    <div v-if="itinerary" class="container">
      <button @click="router.push('/itinerary')" class="back-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        返回行程列表
      </button>

      <div class="hero">
        <div class="hero-content">
          <h1 class="hero-title">{{ itinerary.name }}</h1>
          <p class="hero-meta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ itinerary.startDate }} ~ {{ itinerary.endDate }}
            <span class="hero-days">· {{ itinerary.days?.length }} 天</span>
          </p>
          <p class="hero-created">创建于 {{ new Date(itinerary.createdAt).toLocaleDateString() }}</p>
        </div>
      </div>

      <div class="timeline">
        <div v-for="day in itinerary.days" :key="day.id" class="day-card">
          <div class="day-header">
            <div class="day-badge">第 {{ day.dayNumber }} 天</div>
            <div v-if="parseIds(day.locationIds).length > 0" class="day-count">
              {{ parseIds(day.locationIds).length }} 个景点
            </div>
          </div>

          <div v-if="parseIds(day.locationIds).length === 0" class="day-empty">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            暂无安排
          </div>

          <div v-for="(lid, idx) in parseIds(day.locationIds)" :key="lid" class="loc-row" @click="router.push(`/location/${lid}`)">
            <div class="loc-step">
              <div class="step-dot"></div>
              <div v-if="idx < parseIds(day.locationIds).length - 1" class="step-line"></div>
            </div>
            <div class="loc-content">
              <div class="loc-name">{{ getLoc(lid)?.name || '未知景点' }}</div>
              <div class="loc-city">{{ getLoc(lid)?.city }} · {{ getLoc(lid)?.district }}</div>
              <div v-if="getLoc(lid)?.tags" class="loc-tags">
                <span v-for="t in (getLoc(lid)?.tags || [])" :key="t" class="loc-tag">{{ t }}</span>
              </div>
            </div>
            <div class="loc-arrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          <div v-if="day.note" class="day-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {{ day.note }}
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="router.push(`/itinerary/${itinerary.id}/edit`)" class="btn-primary">编辑行程</button>
      </div>
    </div>

    <div v-else class="loading-state">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
      </div>
      <p>加载中...</p>
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

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: var(--font-size-sm);
  cursor: pointer;
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
  transition: all var(--transition-fast);
}
.back-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
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
  margin-bottom: 8px;
  color: var(--text-primary);
}
.hero-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  margin-bottom: 4px;
}
.hero-days {
  color: var(--color-primary);
  font-weight: 600;
}
.hero-created {
  font-size: var(--font-size-xs);
  color: var(--text-quaternary);
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.day-card {
  background: var(--bg-container);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--color-primary);
  padding: var(--space-lg);
  transition: box-shadow var(--transition-fast);
}
.day-card:hover {
  box-shadow: var(--shadow-sm);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}
.day-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.day-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: 500;
}

.day-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--space-md);
  color: var(--text-quaternary);
  font-size: var(--font-size-sm);
}

.loc-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.loc-row:hover {
  background: var(--bg-hover);
}

.loc-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 6px;
}
.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-gold);
  border: 2px solid var(--color-gold-light);
  flex-shrink: 0;
}
.step-line {
  width: 2px;
  height: 24px;
  background: var(--border-color);
  margin-top: 4px;
}

.loc-content {
  flex: 1;
  min-width: 0;
}
.loc-name {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.loc-city {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-bottom: 4px;
}
.loc-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.loc-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  background: var(--color-gold-light);
  color: var(--color-gold);
  font-weight: 500;
}

.loc-arrow {
  color: var(--text-quaternary);
  padding-top: 4px;
  flex-shrink: 0;
  transition: color var(--transition-fast);
}
.loc-row:hover .loc-arrow {
  color: var(--color-primary);
}

.day-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-page);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-sm);
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color);
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

.loading-state {
  text-align: center;
  padding: 60px;
  color: var(--text-tertiary);
}
.loading-spinner {
  margin-bottom: var(--space-md);
}
.spinner-ring {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>