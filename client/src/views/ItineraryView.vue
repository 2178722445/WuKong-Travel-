<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '../stores/locations'
import { useAuthStore } from '../stores/auth'
import http from '../api'
import type { Itinerary, ItineraryDay } from '../types'

const router = useRouter()
const locStore = useLocationStore()
const auth = useAuthStore()

const itineraries = ref<Itinerary[]>([])
const editing = ref(false)
const editName = ref('')
const editStartDate = ref('')
const editEndDate = ref('')
const days = ref<{ dayNumber: number; locationIds: number[]; note: string }[]>([])
const editId = ref<number | null>(null)

onMounted(async () => {
  await locStore.fetchLocations()
  if (auth.isLoggedIn) loadItineraries()
})

async function loadItineraries() {
  try {
    const { data } = await http.get('/itineraries')
    itineraries.value = data
  } catch { /* ignore */ }
}

function newItinerary() {
  editing.value = true
  editId.value = null
  editName.value = '我的山西古建之旅'
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 3)
  editStartDate.value = today.toISOString().slice(0, 10)
  editEndDate.value = tomorrow.toISOString().slice(0, 10)
  days.value = [{ dayNumber: 1, locationIds: [], note: '' }]
}

function editItinerary(it: Itinerary) {
  editing.value = true
  editId.value = it.id
  editName.value = it.name
  editStartDate.value = it.startDate
  editEndDate.value = it.endDate
  days.value = it.days.map(d => ({
    dayNumber: d.dayNumber,
    locationIds: d.locationIds,
    note: d.note
  }))
}

function addDay() {
  days.value.push({ dayNumber: days.value.length + 1, locationIds: [], note: '' })
}

function removeDay(idx: number) {
  days.value.splice(idx, 1)
  days.value.forEach((d, i) => d.dayNumber = i + 1)
}

function toggleLocation(dayIdx: number, locId: number) {
  const day = days.value[dayIdx]
  const idx = day.locationIds.indexOf(locId)
  if (idx >= 0) day.locationIds.splice(idx, 1)
  else day.locationIds.push(locId)
}

function getLocById(id: number) {
  return locStore.locations.find(l => l.id === id)
}

async function saveItinerary() {
  if (!auth.isLoggedIn) { router.push('/login'); return }
  const payload = { name: editName.value, startDate: editStartDate.value, endDate: editEndDate.value, days: days.value }
  if (editId.value) {
    await http.put(`/itineraries/${editId.value}`, payload)
  } else {
    await http.post('/itineraries', payload)
  }
  editing.value = false
  await loadItineraries()
}

async function deleteItinerary(id: number) {
  if (!confirm('确定删除此行程？')) return
  await http.delete(`/itineraries/${id}`)
  await loadItineraries()
}

function viewItinerary(id: number) {
  router.push(`/itinerary/${id}`)
}
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="page-header">
        <div class="header-left">
          <h2 class="page-title">行程规划</h2>
          <p class="page-desc">规划你的山西古建之旅，按天安排游览路线</p>
        </div>
        <button v-if="!editing" @click="newItinerary" class="btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建行程
        </button>
      </div>

      <div v-if="!auth.isLoggedIn" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <p class="empty-text">登录后即可规划行程</p>
        <router-link to="/login" class="btn-primary" style="display:inline-flex;">立即登录</router-link>
      </div>

      <div v-else-if="editing" class="editor-card">
        <div class="editor-header">
          <h3>{{ editId ? '编辑行程' : '新建行程' }}</h3>
        </div>

        <div class="field-group">
          <label class="field-label">行程名称</label>
          <input v-model="editName" class="field-input" placeholder="例如：五一山西古建三日游">
        </div>

        <div class="field-row">
          <div class="field-group">
            <label class="field-label">开始日期</label>
            <input v-model="editStartDate" type="date" class="field-input">
          </div>
          <div class="field-group">
            <label class="field-label">结束日期</label>
            <input v-model="editEndDate" type="date" class="field-input">
          </div>
        </div>

        <div v-for="(day, di) in days" :key="di" class="day-block">
          <div class="day-header">
            <h4 class="day-title">
              <span class="day-badge">第 {{ day.dayNumber }} 天</span>
            </h4>
            <button v-if="days.length > 1" @click="removeDay(di)" class="btn-danger-text">删除此天</button>
          </div>

          <div class="loc-pool">
            <span class="loc-pool-label">选择景点：</span>
            <button v-for="loc in locStore.locations" :key="loc.id" @click="toggleLocation(di, loc.id)"
              class="loc-chip" :class="{ active: day.locationIds.includes(loc.id) }">
              {{ loc.name }}
            </button>
          </div>

          <div v-if="day.locationIds.length > 0" class="selected-bar">
            <div class="selected-list">
              <span v-for="lid in day.locationIds" :key="lid" class="selected-item">
                <span class="selected-dot"></span>
                {{ getLocById(lid)?.name }}
                <button @click="toggleLocation(di, lid)" class="selected-remove">&times;</button>
              </span>
            </div>
            <div class="route-summary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              已选择 {{ day.locationIds.length }} 个景点
            </div>
          </div>

          <textarea v-model="day.note" placeholder="当日备注（可选）..." class="field-textarea"></textarea>
        </div>

        <button @click="addDay" class="btn-outline" style="width:100%;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          添加一天
        </button>

        <div class="editor-actions">
          <button @click="saveItinerary" class="btn-primary">保存行程</button>
          <button @click="editing = false" class="btn-ghost">取消</button>
        </div>
      </div>

      <div v-else>
        <div v-if="itineraries.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <p class="empty-text">还没有行程，点击上方按钮创建你的第一个行程</p>
        </div>

        <div v-for="it in itineraries" :key="it.id" class="itinerary-card" @click="viewItinerary(it.id)">
          <div class="itinerary-card-body">
            <div class="itinerary-info">
              <h3 class="itinerary-name">{{ it.name }}</h3>
              <p class="itinerary-date">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ it.startDate }} ~ {{ it.endDate }}
                <span class="itinerary-days">· {{ it.days?.length || 0 }} 天</span>
              </p>
            </div>
            <div class="itinerary-actions" @click.stop>
              <button @click="editItinerary(it)" class="btn-ghost-sm">编辑</button>
              <button @click="deleteItinerary(it.id)" class="btn-ghost-sm danger">删除</button>
            </div>
          </div>
          <div class="itinerary-card-footer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            查看详情
          </div>
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
  max-width: 900px;
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
  white-space: nowrap;
}
.btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.btn-outline:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-ghost {
  padding: 8px 20px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: #fff;
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.btn-ghost:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.btn-ghost-sm {
  padding: 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
  background: #fff;
  font-size: var(--font-size-xs);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.btn-ghost-sm:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.btn-ghost-sm.danger {
  color: var(--color-error);
  border-color: var(--color-error-border);
}
.btn-ghost-sm.danger:hover {
  background: var(--color-error-bg);
}

.btn-danger-text {
  border: none;
  background: none;
  color: var(--color-error);
  font-size: var(--font-size-xs);
  cursor: pointer;
  padding: 0;
  font-weight: 500;
}
.btn-danger-text:hover {
  text-decoration: underline;
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

.editor-card {
  background: var(--bg-container);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}
.editor-header {
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-color);
}
.editor-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.field-group {
  margin-bottom: var(--space-md);
}
.field-label {
  display: block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.field-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: var(--bg-page);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  box-sizing: border-box;
}
.field-input:focus {
  border-color: var(--color-primary);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
}
.field-textarea {
  width: 100%;
  min-height: 48px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background: var(--bg-page);
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
  margin-top: var(--space-xs);
}
.field-textarea:focus {
  border-color: var(--color-primary);
  background: #fff;
}
.field-row {
  display: flex;
  gap: var(--space-md);
}
.field-row .field-group {
  flex: 1;
}

.day-block {
  background: var(--bg-page);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-sm);
  border: 1px solid var(--border-color);
}
.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.day-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}
.day-badge {
  display: inline-block;
  padding: 3px 10px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.loc-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: var(--space-sm);
  align-items: center;
}
.loc-pool-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-weight: 500;
}
.loc-chip {
  padding: 3px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
  background: #fff;
  font-size: var(--font-size-xs);
  cursor: pointer;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  font-weight: 500;
}
.loc-chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.loc-chip.active {
  background: var(--color-primary-bg);
  border-color: var(--color-primary-border);
  color: var(--color-primary);
  font-weight: 600;
}

.selected-bar {
  margin-bottom: var(--space-xs);
}
.selected-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.selected-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: var(--color-primary-bg);
  border: 1px solid var(--color-primary-border);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 500;
}
.selected-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
  flex-shrink: 0;
}
.selected-remove {
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}
.route-summary {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
  font-weight: 500;
}

.editor-actions {
  display: flex;
  gap: var(--space-xs);
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-color);
}

.itinerary-card {
  background: var(--bg-container);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  overflow: hidden;
}
.itinerary-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-border);
}
.itinerary-card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-md) var(--space-lg);
}
.itinerary-info {
  flex: 1;
}
.itinerary-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}
.itinerary-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}
.itinerary-days {
  color: var(--color-primary);
  font-weight: 500;
}
.itinerary-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.itinerary-card-footer {
  padding: 8px var(--space-lg);
  background: var(--bg-page);
  border-top: 1px solid var(--border-color);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color var(--transition-fast);
}
.itinerary-card:hover .itinerary-card-footer {
  color: var(--color-primary);
}
</style>