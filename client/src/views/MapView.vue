<script setup lang="ts">
import { ref, onMounted, computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '../stores/locations'
import { useToast } from '../utils/toast'
import {
  distanceBetween,
  createBuffer,
  findPointsInBuffer,
  computeRouteLength,
  projectCoordinate,
  locationsToGeoJSON,
  type LocationFeature,
} from '../utils/spatial'
import CesiumViewer from '../components/cesium/CesiumViewer.vue'
import OLViewer from '../components/openlayers/OLViewer.vue'

const router = useRouter()
const locStore = useLocationStore()
const toast = useToast()

const selectedIdx = ref<number | null>(null)
const searchQuery = ref('')
const cityFilter = ref('')
const showPanel = ref(window.innerWidth > 760)
const isLoading = ref(true)
const mapMode = ref<'2d' | '3d'>('2d')

// Spatial analysis
const bufferRadius = ref(5000)
const bufferCenterId = ref<number | null>(null)
const bufferPOIs = ref<(LocationFeature & { distance: number })[]>([])

// Route planning
const routeStartId = ref<number | null>(null)
const routeEndId = ref<number | null>(null)
const routePath = ref<{ lng: number; lat: number }[]>([])
const routeDistance = ref<{ meters: number; kilometers: number } | null>(null)

// Analysis panel
const expandedSection = ref<'route' | 'buffer' | null>(null)

const cesiumRef = shallowRef<InstanceType<typeof CesiumViewer>>()
const olRef = shallowRef<InstanceType<typeof OLViewer>>()

const cities = computed(() => [...new Set(locStore.locations.map(l => l.city))])

const filteredLocations = computed(() => {
  let list = locStore.locations
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(l => l.name.includes(q) || l.city.includes(q) || l.description.includes(q))
  }
  if (cityFilter.value) {
    list = list.filter(l => l.city === cityFilter.value)
  }
  return list
})

const selectedLocation = computed(() => {
  if (selectedIdx.value === null) return null
  return locStore.locations[selectedIdx.value]
})

const bufferGeometry = computed(() => {
  if (bufferCenterId.value === null || bufferPOIs.value.length === 0) return null
  const center = locStore.locations.find(l => l.id === bufferCenterId.value)
  if (!center) return null
  return createBuffer(center.lng, center.lat, bufferRadius.value).geometry
})

onMounted(async () => {
  try {
    await locStore.fetchLocations()
  } catch {
    toast.error('加载取景地数据失败')
  }
  isLoading.value = false
})

function selectLocation(id: number) {
  selectedIdx.value = locStore.locations.findIndex(item => item.id === id)
}

function onMarkerSelect(id: number) {
  const idx = locStore.locations.findIndex(l => l.id === id)
  if (idx >= 0) selectLocation(id)
}

function onViewDetail(id: number) {
  router.push(`/location/${id}`)
}

function toggleFav(id: number) {
  locStore.toggleFavorite(id)
}

function fitAll() {
  if (mapMode.value === '3d' && cesiumRef.value?.viewer) {
    cesiumRef.value.viewer.zoomTo(cesiumRef.value.viewer.entities)
  }
}

function resetView() {
  selectedIdx.value = null
  clearRoute()
  clearBuffer()
  expandedSection.value = null
}

function onSearch() {
  locStore.fetchLocations({ search: searchQuery.value || undefined, city: cityFilter.value || undefined })
}

// ========== Buffer Analysis (Turf.js) ==========
function drawBuffer() {
  if (bufferCenterId.value === null) {
    toast.info('请先选择一个取景地作为缓冲区中心')
    return
  }
  const center = locStore.locations.find(l => l.id === bufferCenterId.value)
  if (!center) return

  bufferPOIs.value = []

  const locationFeatures: LocationFeature[] = locStore.locations
    .filter(l => l.id !== bufferCenterId.value)
    .map(l => ({ id: l.id, name: l.name, lng: l.lng, lat: l.lat }))

  bufferPOIs.value = findPointsInBuffer(center.lng, center.lat, bufferRadius.value, locationFeatures)
  toast.success(`缓冲区半径 ${(bufferRadius.value / 1000).toFixed(1)}km，包含 ${bufferPOIs.value.length} 个取景地`)
}

function clearBuffer() {
  bufferPOIs.value = []
  bufferCenterId.value = null
}

// ========== Route Planning (Turf.js) ==========
import { computeOptimalPath } from '../utils/spatial'

function planRoute() {
  if (routeStartId.value === null || routeEndId.value === null) {
    toast.info('请选择起点和终点')
    return
  }
  const startLoc = locStore.locations.find(l => l.id === routeStartId.value)
  const endLoc = locStore.locations.find(l => l.id === routeEndId.value)
  if (!startLoc || !endLoc) return

  const waypoints: LocationFeature[] = locStore.locations
    .filter(l => l.id !== routeStartId.value && l.id !== routeEndId.value)
    .map(l => ({ id: l.id, name: l.name, lng: l.lng, lat: l.lat }))

  const line = computeOptimalPath(startLoc.lng, startLoc.lat, endLoc.lng, endLoc.lat, waypoints)
  const coords = line.geometry.coordinates.map((c: any) => ({ lng: c[0], lat: c[1] }))
  routePath.value = coords
  routeDistance.value = computeRouteLength(line)
  toast.success(`路径规划完成，全程 ${routeDistance.value!.kilometers}km`)
}

function clearRoute() {
  routePath.value = []
  routeDistance.value = null
}

function toggleSection(section: 'route' | 'buffer') {
  expandedSection.value = expandedSection.value === section ? null : section
}
</script>

<template>
  <div class="map-page">
    <!-- Map Container -->
    <div class="map-container">
      <CesiumViewer
        v-if="mapMode === '3d'"
        ref="cesiumRef"
        :locations="locStore.locations"
        :selected-location-id="selectedLocation?.id ?? null"
        @select-location="onMarkerSelect"
        @view-detail="onViewDetail"
      />
      <OLViewer
        v-else
        ref="olRef"
        :locations="locStore.locations"
        :selected-location-id="selectedLocation?.id ?? null"
        :route-path="routePath"
        :buffer-geometry="bufferGeometry"
        @select-location="onMarkerSelect"
        @view-detail="onViewDetail"
      />

      <!-- Map Mode Toggle -->
      <div class="map-mode-toggle">
        <button :class="{ active: mapMode === '3d' }" @click="mapMode = '3d'" title="3D Cesium 视图">🌐 3D</button>
        <button :class="{ active: mapMode === '2d' }" @click="mapMode = '2d'" title="2D OpenLayers 视图">🗺️ 2D</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <p class="loading-text">地图加载中...</p>
      </div>
    </div>

    <!-- Left Search Panel -->
    <div class="search-panel">
      <div class="search-box">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="searchQuery" @keyup.enter="onSearch" placeholder="搜索取景地..." class="search-input">
      </div>
      <div class="search-actions">
        <select v-model="cityFilter" @change="onSearch" class="city-select">
          <option value="">全部城市</option>
          <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
        </select>
        <button @click="onSearch" class="search-btn">搜索</button>
      </div>
      <div class="loc-list">
        <div
          v-for="(loc, i) in filteredLocations"
          :key="loc.id"
          @click="selectLocation(loc.id)"
          class="loc-item"
          :class="{ active: selectedLocation?.id === loc.id }"
        >
          <span class="loc-num" :class="{ fav: locStore.favorites.includes(loc.id) }">{{ i + 1 }}</span>
          <div class="loc-info">
            <div class="loc-name">{{ loc.name }}</div>
            <div class="loc-city">{{ loc.city }} {{ loc.district }}</div>
          </div>
          <svg v-if="locStore.favorites.includes(loc.id)" class="fav-icon" width="14" height="14" viewBox="0 0 24 24" fill="#ff4d4f" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
      </div>
    </div>

    <!-- Analysis Panel -->
    <div class="analysis-panel" :class="{ visible: showPanel }">
      <div class="analysis-header">
        <h3>空间分析 (Turf.js)</h3>
        <button @click="showPanel = false" class="panel-close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="analysis-body">
        <!-- Route Planning -->
        <div class="analysis-section">
          <div class="section-header" @click="toggleSection('route')">
            <div class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>路径规划 (Turf.js)</span>
              <span v-if="routeDistance" class="section-badge green">{{ routeDistance.kilometers }}km</span>
            </div>
            <svg class="section-arrow" :class="{ open: expandedSection === 'route' }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div v-if="expandedSection === 'route'" class="section-content">
            <div class="field-group">
              <label>起点取景地</label>
              <select v-model="routeStartId" class="field-select">
                <option :value="null">-- 选择起点 --</option>
                <option v-for="loc in locStore.locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </div>
            <div class="field-group">
              <label>终点取景地</label>
              <select v-model="routeEndId" class="field-select">
                <option :value="null">-- 选择终点 --</option>
                <option v-for="loc in locStore.locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </div>
            <div class="section-actions">
              <button @click="planRoute" class="btn-primary">开始规划</button>
              <button v-if="routePath.length > 0" @click="clearRoute" class="btn-ghost">清除路线</button>
            </div>
            <div v-if="routeDistance" class="route-result">
              <div class="route-summary">
                <span class="route-stat">📏 {{ routeDistance.kilometers }} km</span>
                <span class="route-stat">📍 {{ routePath.length }} 个节点</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Buffer Analysis -->
        <div class="analysis-section">
          <div class="section-header" @click="toggleSection('buffer')">
            <div class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <span>缓冲区分析 (Turf.js)</span>
              <span v-if="bufferPOIs.length > 0" class="section-badge">{{ bufferPOIs.length }}个</span>
            </div>
            <svg class="section-arrow" :class="{ open: expandedSection === 'buffer' }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div v-if="expandedSection === 'buffer'" class="section-content">
            <div class="field-group">
              <label>中心点取景地</label>
              <select v-model="bufferCenterId" class="field-select">
                <option :value="null">-- 选择取景地 --</option>
                <option v-for="loc in locStore.locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </div>
            <div class="field-group">
              <label>缓冲区半径</label>
              <div class="slider-row">
                <input type="range" v-model.number="bufferRadius" min="5000" max="200000" step="5000" class="range-slider">
                <span class="slider-value">{{ (bufferRadius / 1000).toFixed(0) }} km</span>
              </div>
            </div>
            <div class="section-actions">
              <button @click="drawBuffer" class="btn-primary">生成缓冲区</button>
              <button v-if="bufferPOIs.length > 0" @click="clearBuffer" class="btn-ghost">清除</button>
            </div>
            <div v-if="bufferPOIs.length > 0" class="poi-list">
              <div class="poi-list-header">缓冲区内取景地（{{ bufferPOIs.length }}）</div>
              <div v-for="poi in bufferPOIs" :key="poi.id" class="poi-item">
                <span class="poi-dot"></span>
                <div class="poi-info">
                  <div class="poi-name">{{ poi.name }}</div>
                </div>
                <span class="poi-dist">{{ (poi.distance! / 1000).toFixed(1) }}km</span>
                <button @click="onMarkerSelect(poi.id)" class="poi-route-btn" title="定位">📍</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Panel -->
    <div class="detail-panel" :class="{ open: showPanel && selectedLocation }">
      <div class="panel-header">
        <h3>取景地详情</h3>
        <button @click="showPanel = false" class="panel-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="panel-body" v-if="selectedLocation">
        <div class="panel-hero">
          <h2 class="panel-loc-name">{{ selectedLocation.name }}</h2>
          <p class="panel-loc-addr">{{ selectedLocation.city }} {{ selectedLocation.district }}</p>
          <p class="panel-coords">经度: {{ selectedLocation.lng.toFixed(4) }} 纬度: {{ selectedLocation.lat.toFixed(4) }}</p>
          <div class="panel-tags">
            <span v-for="t in selectedLocation.tags" :key="t" class="panel-tag">{{ t }}</span>
          </div>
        </div>
        <div class="panel-info-grid">
          <div class="panel-info-item"><label>年代</label><span>{{ selectedLocation.period }}</span></div>
          <div class="panel-info-item"><label>门票</label><span>{{ selectedLocation.ticket }}</span></div>
          <div class="panel-info-item"><label>开放时间</label><span>{{ selectedLocation.hours }}</span></div>
        </div>
        <div class="panel-section">
          <h4 class="panel-section-title">简介</h4>
          <p class="panel-section-text">{{ selectedLocation.description }}</p>
        </div>
        <div class="panel-section">
          <h4 class="panel-section-title">看点</h4>
          <p class="panel-section-text">{{ selectedLocation.highlight }}</p>
        </div>
        <div class="panel-actions">
          <button @click="router.push(`/location/${selectedLocation.id}`)" class="btn-primary">查看完整详情</button>
          <button @click="toggleFav(selectedLocation.id)" class="btn-outline" :class="{ danger: locStore.favorites.includes(selectedLocation.id) }">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="locStore.favorites.includes(selectedLocation.id) ? '#ff4d4f' : 'none'" :stroke="locStore.favorites.includes(selectedLocation.id) ? '#ff4d4f' : 'currentColor'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {{ locStore.favorites.includes(selectedLocation.id) ? '已收藏' : '收藏' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Map Controls -->
    <div class="map-controls">
      <button @click="showPanel = !showPanel" :title="showPanel ? '隐藏分析面板' : '显示分析面板'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
      </button>
      <button @click="fitAll" title="显示全部"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg></button>
      <button @click="resetView" title="重置视图"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>
      <button @click="router.push('/itinerary')" title="行程规划"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></button>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="legend-dot gold"></span>取景地</span>
      <span class="legend-item"><span class="legend-dot red"></span>已收藏/选中</span>
      <span class="legend-item"><span class="legend-dot blue"></span>路径</span>
    </div>
  </div>
</template>

<style scoped>
.map-page { height: 100%; position: relative; }
.map-container { width: 100%; height: 100%; position: relative; }

.map-mode-toggle {
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 52;
  display: flex; gap: 0; background: rgba(255,255,255,.95); border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,.08); overflow: hidden;
}
.map-mode-toggle button {
  padding: 10px 20px; border: none; background: transparent; font-size: 14px;
  font-weight: 500; cursor: pointer; transition: all .2s; color: var(--text-tertiary);
}
.map-mode-toggle button.active {
  background: var(--color-primary); color: #fff;
}
.map-mode-toggle button:not(.active):hover { background: var(--bg-hover); }

.loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,.85);
  z-index: 51; display: flex; align-items: center; justify-content: center;
}
.loading-spinner { text-align: center; }
.spinner-ring { width: 52px; height: 52px; border: 4px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 17px; color: var(--text-tertiary); margin-top: 16px; }

.search-panel {
  position: absolute; top: 80px; left: 20px; z-index: 50;
  background: rgba(255,255,255,.97); backdrop-filter: blur(12px);
  border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08);
  border: 1px solid var(--border-color); padding: 18px; width: 380px;
  display: flex; flex-direction: column; gap: 14px;
}
.search-box { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 16px; pointer-events: none; width: 20px; height: 20px; }
.search-input {
  width: 100%; padding: 14px 16px 14px 46px; border: 1px solid var(--border-color);
  border-radius: 12px; font-size: 16px; outline: none;
  transition: border-color .2s; background: var(--bg-page); box-sizing: border-box;
}
.search-input:focus { border-color: var(--color-primary); background: #fff; }
.search-actions { display: flex; gap: 10px; }
.city-select {
  flex: 1; padding: 12px 14px; border: 1px solid var(--border-color);
  border-radius: 12px; font-size: 15px; background: #fff; cursor: pointer;
}
.search-btn {
  padding: 12px 26px; border: none; border-radius: 12px;
  background: var(--color-primary); color: #fff; font-size: 15px;
  font-weight: 500; cursor: pointer; white-space: nowrap; transition: background .2s;
}
.search-btn:hover { background: var(--color-primary-hover); }

.loc-list { max-height: 360px; overflow-y: auto; }
.loc-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 16px;
  border-radius: 12px; cursor: pointer; transition: background .2s;
}
.loc-item:hover { background: var(--bg-hover); }
.loc-item.active { background: var(--color-primary-bg); }
.loc-num {
  width: 32px; height: 32px; border-radius: 50%; background: var(--color-gold);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.loc-num.fav { background: var(--color-error); }
.loc-info { flex: 1; min-width: 0; }
.loc-name { font-size: 16px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loc-city { font-size: 14px; color: var(--text-tertiary); }
.fav-icon { flex-shrink: 0; width: 16px; height: 16px; }

/* Analysis Panel */
.analysis-panel {
  position: absolute; left: 20px; bottom: 80px; z-index: 50;
  width: 440px; max-height: calc(100% - 200px);
  background: rgba(255,255,255,.97); backdrop-filter: blur(12px);
  border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08);
  border: 1px solid var(--border-color);
  display: flex; flex-direction: column;
  opacity: 0; transform: translateX(-20px); pointer-events: none;
  transition: all .3s ease;
}
.analysis-panel.visible { opacity: 1; transform: translateX(0); pointer-events: auto; }
.analysis-header {
  padding: 18px 22px; border-bottom: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
}
.analysis-header h3 { font-size: 18px; font-weight: 600; }
.panel-close-btn {
  width: 36px; height: 36px; border: none; background: var(--bg-page);
  border-radius: 10px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--text-tertiary); transition: all .2s;
}
.panel-close-btn:hover { background: var(--color-error-bg); color: var(--color-error); }

.analysis-body { flex: 1; overflow-y: auto; padding: 0; }
.analysis-section { border-bottom: 1px solid var(--border-color); }
.analysis-section:last-child { border-bottom: none; }

.section-header {
  padding: 18px 22px; display: flex; justify-content: space-between;
  align-items: center; cursor: pointer; transition: background .2s;
}
.section-header:hover { background: var(--bg-page); }
.section-title { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 600; color: var(--text-primary); }
.section-badge {
  font-size: 13px; padding: 3px 10px; border-radius: 12px; background: var(--color-primary-bg);
  color: var(--color-primary); font-weight: 600;
}
.section-badge.green { background: #f6ffed; color: #52c41a; }
.section-arrow { transition: transform .2s; color: var(--text-tertiary); }
.section-arrow.open { transform: rotate(180deg); }

.section-content { padding: 0 22px 20px; }

.field-group { margin-bottom: 16px; }
.field-group label { display: block; font-size: 14px; color: var(--text-tertiary); font-weight: 500; margin-bottom: 6px; }
.field-input {
  width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 12px;
  font-size: 15px; outline: none; transition: border-color .2s; box-sizing: border-box;
}
.field-input:focus { border-color: var(--color-primary); }
.field-select {
  width: 100%; padding: 12px 16px; border: 1px solid var(--border-color);
  border-radius: 12px; font-size: 15px; background: #fff; cursor: pointer; outline: none;
}
.field-select:focus { border-color: var(--color-primary); }

.slider-row { display: flex; align-items: center; gap: 16px; }
.range-slider { flex: 1; accent-color: var(--color-primary); height: 10px; }
.slider-value { font-size: 15px; color: var(--color-primary); font-weight: 600; white-space: nowrap; }

.section-actions { display: flex; gap: 12px; margin-top: 8px; }

.btn-primary {
  padding: 12px 28px; border: none; border-radius: 12px;
  background: var(--color-primary); color: #fff; font-size: 15px;
  font-weight: 500; cursor: pointer; transition: all .2s;
}
.btn-primary:hover { background: var(--color-primary-hover); box-shadow: 0 2px 10px rgba(22,119,255,.3); }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }

.btn-ghost {
  padding: 12px 22px; border: 1px solid var(--border-color); border-radius: 12px;
  background: #fff; font-size: 15px; cursor: pointer; color: var(--text-secondary);
  transition: all .2s;
}
.btn-ghost:hover { border-color: var(--color-error); color: var(--color-error); }

.route-result { margin-top: 16px; }
.route-summary {
  display: flex; gap: 20px; flex-wrap: wrap;
  padding: 14px 16px; background: var(--color-primary-bg);
  border-radius: 12px; margin-bottom: 14px;
}
.route-stat { font-size: 15px; color: var(--color-primary); font-weight: 600; }

.poi-list { margin-top: 14px; }
.poi-list-header { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; }
.poi-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid #f5f5f5; font-size: 14px;
}
.poi-dot { width: 10px; height: 10px; border-radius: 50%; background: #1677ff; flex-shrink: 0; }
.poi-info { flex: 1; min-width: 0; }
.poi-name { font-size: 14px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.poi-dist { font-size: 13px; color: var(--color-primary); font-weight: 500; white-space: nowrap; }
.poi-route-btn {
  width: 32px; height: 32px; border: 1px solid var(--border-color); border-radius: 8px;
  background: #fff; cursor: pointer; font-size: 16px; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; transition: all .2s;
}
.poi-route-btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }

/* Detail Panel */
.detail-panel {
  position: absolute; top: 0; right: 0; width: 480px; height: 100%;
  background: #fff; border-left: 1px solid var(--border-color); z-index: 60;
  transform: translateX(100%); transition: transform .35s ease;
  display: flex; flex-direction: column; box-shadow: -4px 0 24px rgba(0,0,0,.08);
}
.detail-panel.open { transform: translateX(0); }
.panel-header {
  padding: 22px 26px; border-bottom: 1px solid var(--border-color);
  display: flex; justify-content: space-between; align-items: center;
}
.panel-header h3 { font-size: 19px; font-weight: 600; }
.panel-close {
  width: 36px; height: 36px; border: none; background: var(--bg-page);
  border-radius: 10px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--text-tertiary); transition: all .2s;
}
.panel-close:hover { background: var(--color-error-bg); color: var(--color-error); }

.panel-body { flex: 1; overflow-y: auto; padding: 26px; }
.panel-hero {
  background: linear-gradient(135deg, var(--color-primary-bg), #f0f5ff);
  border-radius: 14px; padding: 26px; margin-bottom: 22px;
}
.panel-loc-name { font-size: 26px; font-weight: 700; margin-bottom: 8px; }
.panel-loc-addr { font-size: 16px; color: var(--text-tertiary); margin-bottom: 4px; }
.panel-coords { font-size: 13px; color: var(--text-quaternary); margin-bottom: 12px; font-family: monospace; }
.panel-tags { display: flex; gap: 10px; flex-wrap: wrap; }
.panel-tag { font-size: 13px; padding: 6px 16px; border-radius: 8px; background: var(--color-gold-light); color: var(--color-gold); font-weight: 500; }

.panel-info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 22px; }
.panel-info-item { background: var(--bg-page); border-radius: 12px; padding: 16px; border: 1px solid var(--border-color); }
.panel-info-item label { display: block; font-size: 13px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 6px; }
.panel-info-item span { font-size: 15px; font-weight: 600; }

.panel-section { margin-bottom: 18px; }
.panel-section-title { font-size: 17px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary); }
.panel-section-text { font-size: 16px; line-height: 1.9; color: var(--text-secondary); }

.panel-actions { display: flex; gap: 14px; margin-top: 26px; }
.btn-outline {
  padding: 12px 24px; border: 1px solid var(--border-color); border-radius: 12px;
  background: #fff; font-size: 16px; cursor: pointer; font-weight: 500;
  display: flex; align-items: center; gap: 8px; color: var(--text-secondary); transition: all .2s;
}
.btn-outline:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-outline.danger { color: var(--color-error); border-color: var(--color-error-border); }
.btn-outline.danger:hover { background: var(--color-error-bg); }

/* Map Controls */
.map-controls {
  position: absolute; top: 20px; right: 20px; z-index: 49;
  display: flex; flex-direction: column; gap: 10px;
}
.map-controls button {
  width: 48px; height: 48px; border-radius: 12px; border: 1px solid var(--border-color);
  background: rgba(255,255,255,.97); cursor: pointer; display: flex; align-items: center;
  justify-content: center; color: var(--text-secondary); transition: all .2s;
  box-shadow: 0 2px 8px rgba(0,0,0,.06); backdrop-filter: blur(12px);
}
.map-controls button:hover { border-color: var(--color-primary); color: var(--color-primary); box-shadow: 0 4px 12px rgba(0,0,0,.1); }

.legend {
  position: absolute; bottom: 28px; right: 20px; z-index: 50;
  background: rgba(255,255,255,.97); border-radius: 12px; border: 1px solid var(--border-color);
  padding: 14px 20px; font-size: 14px; display: flex; gap: 24px; box-shadow: 0 2px 8px rgba(0,0,0,.06);
  backdrop-filter: blur(12px);
}
.legend-item { display: flex; align-items: center; gap: 10px; color: var(--text-tertiary); }
.legend-dot { width: 14px; height: 14px; border-radius: 50%; }
.legend-dot.gold { background: var(--color-gold); }
.legend-dot.red { background: var(--color-error); }
.legend-dot.blue { background: #1677ff; }
</style>
