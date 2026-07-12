<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useLocationStore } from '../stores/locations'
import http from '../api'
import type { DashboardStats } from '../types'

const auth = useAuthStore()
const locStore = useLocationStore()
const stats = ref<DashboardStats | null>(null)
const tab = ref<'overview' | 'locations' | 'users' | 'reviews'>('overview')
const searchQuery = ref('')
const locations = ref<any[]>([])
const users = ref<any[]>([])
const reviews = ref<any[]>([])
const totalPages = ref(1)
const page = ref(1)
const editingLoc = ref<any | null>(null)
const showLocEditor = ref(false)

onMounted(async () => {
  await loadStats()
  await loadLocations()
})

async function loadStats() {
  const { data } = await http.get('/dashboard/stats')
  stats.value = data
}

async function loadLocations() {
  const { data } = await http.get('/dashboard/locations', { params: { page: page.value, search: searchQuery.value, pageSize: 20 } })
  locations.value = data.locations
  totalPages.value = Math.ceil(data.total / 20)
}

async function loadUsers() {
  const { data } = await http.get('/dashboard/users', { params: { page: page.value } })
  users.value = data.users
  totalPages.value = Math.ceil(data.total / 20)
}

async function loadReviews() {
  const { data } = await http.get('/dashboard/reviews', { params: { page: page.value } })
  reviews.value = data.reviews
  totalPages.value = Math.ceil(data.total / 20)
}

function switchTab(t: string) {
  tab.value = t as any
  page.value = 1
  if (t === 'locations') loadLocations()
  else if (t === 'users') loadUsers()
  else if (t === 'reviews') loadReviews()
}

function doSearch() {
  page.value = 1
  loadLocations()
}

function openLocEditor(loc?: any) {
  editingLoc.value = loc ? { ...loc, tags: loc.tags?.join(',') || '' } : { name: '', city: '', district: '', lng: 0, lat: 0, tags: '', period: '', description: '', ticket: '', hours: '', bestSeason: '', highlight: '' }
  showLocEditor.value = true
}

async function saveLoc() {
  const data = editingLoc.value
  if (!data.name) return
  const payload = { ...data, tags: data.tags.split(',').map((s: string) => s.trim()).filter(Boolean) }
  if (data.id) {
    await http.put(`/locations/${data.id}`, payload)
  } else {
    await http.post('/locations', payload)
  }
  showLocEditor.value = false
  await loadLocations()
}

async function deleteLoc(id: number) {
  if (!confirm('确定删除此取景地？')) return
  await http.delete(`/locations/${id}`)
  await loadLocations()
}

async function changeRole(userId: number, role: string) {
  await http.put(`/dashboard/users/${userId}/role`, { role })
  await loadUsers()
}

async function deleteReview(id: number) {
  if (!confirm('确定删除此评价？')) return
  await http.delete(`/reviews/${id}`)
  await loadReviews()
}
</script>

<template>
  <div class="admin-page">
    <div class="admin-header">
      <h2 class="admin-title">管理后台</h2>
    </div>

    <nav class="tab-bar">
      <button v-for="t in (['overview', 'locations', 'users', 'reviews'] as const)" :key="t" @click="switchTab(t)"
        class="tab-item" :class="{ active: tab === t }">
        {{ { overview: '概览', locations: '取景地管理', users: '用户管理', reviews: '评价管理' }[t] }}
      </button>
    </nav>

    <div class="admin-content">
      <template v-if="tab === 'overview' && stats">
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-icon users">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="stat-num">{{ stats.userCount }}</div>
            <div class="stat-label">用户数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon locations">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div class="stat-num">{{ stats.locationCount }}</div>
            <div class="stat-label">取景地</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon reviews">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <div class="stat-num">{{ stats.reviewCount }}</div>
            <div class="stat-label">评价数</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon itineraries">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="stat-num">{{ stats.itineraryCount }}</div>
            <div class="stat-label">行程数</div>
          </div>
        </div>

        <div class="section-card">
          <h3 class="section-title">热门取景地</h3>
          <div v-for="loc in stats.topLocations" :key="loc.id" class="top-row">
            <span class="top-name">{{ loc.name }}</span>
            <span class="top-city">{{ loc.city }}</span>
            <span class="top-views">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {{ loc.viewCount }} 次浏览
            </span>
          </div>
        </div>
      </template>

      <template v-if="tab === 'locations'">
        <div class="toolbar">
          <div class="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="searchQuery" @keyup.enter="doSearch" placeholder="搜索取景地..." class="search-input">
          </div>
          <button @click="doSearch" class="btn-ghost-sm">搜索</button>
          <button @click="openLocEditor()" class="btn-primary-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新增
          </button>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>ID</th><th>名称</th><th>城市</th><th>浏览量</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="loc in locations" :key="loc.id">
                <td class="col-id">{{ loc.id }}</td>
                <td class="col-name">{{ loc.name }}</td>
                <td>{{ loc.city }}</td>
                <td>{{ loc.viewCount }}</td>
                <td class="col-actions">
                  <button @click="openLocEditor(loc)" class="btn-ghost-xs">编辑</button>
                  <button @click="deleteLoc(loc.id)" class="btn-ghost-xs danger">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-if="tab === 'users'">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th><th>注册时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="col-id">{{ u.id }}</td>
                <td>{{ u.username }}</td>
                <td>{{ u.email }}</td>
                <td><span class="role-badge" :class="u.role">{{ u.role === 'admin' ? '管理员' : '用户' }}</span></td>
                <td class="col-date">{{ new Date(u.createdAt).toLocaleDateString() }}</td>
                <td>
                  <button v-if="u.role === 'user'" @click="changeRole(u.id, 'admin')" class="btn-ghost-xs">设为管理员</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-if="tab === 'reviews'">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>ID</th><th>用户</th><th>取景地</th><th>评分</th><th>内容</th><th>时间</th><th>操作</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in reviews" :key="r.id">
                <td class="col-id">{{ r.id }}</td>
                <td>{{ r.user?.username }}</td>
                <td>{{ r.location?.name }}</td>
                <td><span class="rating-stars">{{ '★'.repeat(r.rating) }}</span></td>
                <td class="col-content">{{ r.content }}</td>
                <td class="col-date">{{ new Date(r.createdAt).toLocaleDateString() }}</td>
                <td><button @click="deleteReview(r.id)" class="btn-ghost-xs danger">删除</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div v-if="totalPages > 1" class="pagination">
        <button @click="page--; switchTab(tab)" :disabled="page <= 1" class="btn-ghost-sm">上一页</button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button @click="page++; switchTab(tab)" :disabled="page >= totalPages" class="btn-ghost-sm">下一页</button>
      </div>
    </div>

    <div v-if="showLocEditor" class="modal-overlay" @click.self="showLocEditor = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editingLoc?.id ? '编辑取景地' : '新增取景地' }}</h3>
          <button @click="showLocEditor = false" class="modal-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field"><label>名称</label><input v-model="editingLoc.name"></div>
            <div class="form-field"><label>城市</label><input v-model="editingLoc.city"></div>
            <div class="form-field"><label>区县</label><input v-model="editingLoc.district"></div>
            <div class="form-field"><label>经度</label><input v-model.number="editingLoc.lng" type="number" step="any"></div>
            <div class="form-field"><label>纬度</label><input v-model.number="editingLoc.lat" type="number" step="any"></div>
            <div class="form-field"><label>标签 (逗号分隔)</label><input v-model="editingLoc.tags"></div>
            <div class="form-field"><label>年代</label><input v-model="editingLoc.period"></div>
            <div class="form-field"><label>门票</label><input v-model="editingLoc.ticket"></div>
            <div class="form-field"><label>开放时间</label><input v-model="editingLoc.hours"></div>
            <div class="form-field"><label>最佳季节</label><input v-model="editingLoc.bestSeason"></div>
          </div>
          <div class="form-field"><label>简介</label><textarea v-model="editingLoc.description" rows="3"></textarea></div>
          <div class="form-field"><label>看点</label><textarea v-model="editingLoc.highlight" rows="2"></textarea></div>
        </div>
        <div class="modal-footer">
          <button @click="saveLoc" class="btn-primary-sm">保存</button>
          <button @click="showLocEditor = false" class="btn-ghost-sm">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.admin-header {
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-container);
  border-bottom: 1px solid var(--border-color);
}
.admin-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.tab-bar {
  display: flex;
  gap: 0;
  background: var(--bg-container);
  padding: 0 var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}
.tab-item {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: var(--font-size-sm);
  cursor: pointer;
  color: var(--text-tertiary);
  border-bottom: 2px solid transparent;
  font-weight: 500;
  transition: all var(--transition-fast);
}
.tab-item:hover {
  color: var(--text-primary);
}
.tab-item.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
.stat-card {
  background: var(--bg-container);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  text-align: center;
  border: 1px solid var(--border-color);
  transition: box-shadow var(--transition-fast);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
}
.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-sm);
}
.stat-icon.users { background: var(--color-primary-bg); color: var(--color-primary); }
.stat-icon.locations { background: var(--color-gold-light); color: var(--color-gold); }
.stat-icon.reviews { background: var(--color-success-bg); color: var(--color-success); }
.stat-icon.itineraries { background: #f0f5ff; color: #722ed1; }
.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.section-card {
  background: var(--bg-container);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  border: 1px solid var(--border-color);
}
.section-title {
  font-size: var(--font-size-md);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}
.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-page);
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  font-size: var(--font-size-sm);
  border: 1px solid var(--border-color);
}
.top-name {
  font-weight: 500;
  color: var(--text-primary);
}
.top-city {
  color: var(--text-tertiary);
}
.top-views {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-primary);
  font-weight: 600;
  font-size: var(--font-size-xs);
}

.toolbar {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
  align-items: center;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  flex: 1;
  color: var(--text-tertiary);
}
.search-input {
  flex: 1;
  padding: 7px 0;
  border: none;
  font-size: var(--font-size-xs);
  outline: none;
  background: transparent;
  color: var(--text-primary);
}

.table-wrapper {
  background: var(--bg-container);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.data-table th {
  background: var(--bg-page);
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  border-bottom: 1px solid var(--border-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-color);
  color: var(--text-secondary);
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}
.data-table tbody tr:hover {
  background: var(--bg-hover);
}
.col-id {
  color: var(--text-quaternary);
  font-size: var(--font-size-xs);
  width: 50px;
}
.col-name {
  font-weight: 500;
  color: var(--text-primary);
}
.col-actions {
  white-space: nowrap;
}
.col-content {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.col-date {
  white-space: nowrap;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.role-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: var(--font-size-xs);
  font-weight: 500;
}
.role-badge.admin {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}
.role-badge.user {
  background: var(--bg-page);
  color: var(--text-tertiary);
}

.rating-stars {
  color: var(--color-gold);
  font-size: var(--font-size-xs);
}

.btn-primary-sm {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.btn-primary-sm:hover {
  background: var(--color-primary-hover);
}

.btn-ghost-sm {
  padding: 6px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  font-size: var(--font-size-xs);
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.btn-ghost-sm:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.btn-ghost-sm:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-ghost-xs {
  padding: 3px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xs);
  background: var(--bg-container);
  font-size: 11px;
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}
.btn-ghost-xs:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.btn-ghost-xs.danger {
  color: var(--color-error);
  border-color: var(--color-error-border);
}
.btn-ghost-xs.danger:hover {
  background: var(--color-error-bg);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-md);
}
.page-info {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  padding: 0 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.modal-card {
  background: var(--bg-container);
  border-radius: var(--radius-lg);
  width: 640px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-color);
}
.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}
.modal-close {
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-page);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}
.modal-close:hover {
  background: var(--color-error-bg);
  color: var(--color-error);
}
.modal-body {
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
}
.modal-footer {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-color);
  justify-content: flex-end;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}
.form-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--space-sm);
}
.form-field label {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-secondary);
}
.form-field input,
.form-field textarea {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-family: inherit;
  outline: none;
  background: var(--bg-page);
  transition: border-color var(--transition-fast);
  box-sizing: border-box;
}
.form-field input:focus,
.form-field textarea:focus {
  border-color: var(--color-primary);
  background: #fff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.08);
}
</style>