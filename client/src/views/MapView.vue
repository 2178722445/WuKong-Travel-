<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocationStore } from '../stores/locations'
import { useToast } from '../utils/toast'

declare const AMap: any

const router = useRouter()
const locStore = useLocationStore()
const toast = useToast()

const mapContainer = ref<HTMLDivElement>()
const selectedIdx = ref<number | null>(null)
const searchQuery = ref('')
const cityFilter = ref('')
const showPanel = ref(true)
const isLoading = ref(true)

// 统一分析面板
const weatherData = ref<any>(null)
const weatherLoading = ref(false)
const routeStart = ref('')
const routeEnd = ref('')
const routeResult = ref<any>(null)
const routeSteps = ref<any[]>([])
const routeLoading = ref(false)
const bufferRadius = ref(5000)
const bufferCenter = ref('')
const bufferPOIs = ref<any[]>([])
const bufferPOILoading = ref(false)
const bufferPOIType = ref('停车场')
const expandedSection = ref<'weather' | 'route' | 'buffer' | null>(null)

const poiTypes = ['停车场', '加油站', '餐饮', '酒店', '超市', '医院', '银行', '厕所']
const poiTypeIcons: Record<string, string> = {
  '停车场': '🅿️', '加油站': '⛽', '餐饮': '🍽️', '酒店': '🏨',
  '超市': '🛒', '医院': '🏥', '银行': '🏦', '厕所': '🚻',
}

let map: any, markers: any[] = [], infoWindow: any
let driving: any, weather: any, placeSearch: any
let bufferCircles: any[] = [], bufferPOIMarkers: any[] = [], routeLine: any = null

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

onMounted(async () => {
  try { await locStore.fetchLocations() } catch { toast.error('加载取景地数据失败') }
  await waitForAMap()
  initMap()
})

function waitForAMap(): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    if (typeof AMap !== 'undefined') return resolve()
    const check = () => {
      attempts++
      if (typeof AMap !== 'undefined') { resolve(); return }
      if (attempts > 100) { reject(new Error('高德地图加载超时')); return }
      setTimeout(check, 100)
    }
    check()
  })
}

onUnmounted(() => { map?.destroy() })

function initMap() {
  map = new AMap.Map(mapContainer.value, {
    zoom: 7, center: [112.0, 37.0], mapStyle: 'amap://styles/light',
    resizeEnable: true, features: ['bg', 'road', 'building', 'point'],
    showBuildingBlock: true, animateEnable: true,
  })
  AMap.plugin(['AMap.Driving', 'AMap.Weather', 'AMap.PlaceSearch', 'AMap.AutoComplete'], () => {
    driving = new AMap.Driving({ map: map, autoFitView: true, showTraffic: false, policy: 0 })
    weather = new AMap.Weather()
    placeSearch = new AMap.PlaceSearch({ pageSize: 20, pageIndex: 1 })
  })
  infoWindow = new AMap.InfoWindow({ offset: new AMap.Pixel(0, -50), closeWhenClickMap: true })
  addMarkers()
  setTimeout(() => {
    if (markers.length > 0) map.setFitView(markers, false, [80, 80, 80, 520])
    isLoading.value = false
  }, 600)
  document.addEventListener('keydown', handleKeydown)
}

function handleKeydown(e: KeyboardEvent) { if (e.key === 'Escape') resetView() }

function addMarkers() {
  markers.forEach(m => m.setMap(null))
  markers = []
  locStore.locations.forEach((loc, i) => {
    const m = createMarker(i)
    m.setMap(map)
    markers.push(m)
  })
}

function createMarker(i: number) {
  const loc = locStore.locations[i]
  const isFav = locStore.favorites.includes(loc.id)
  const isSel = selectedIdx.value === i
  const bg = isSel ? '#ff4d4f' : '#fff'
  const border = isSel ? '#ff4d4f' : (isFav ? '#ff4d4f' : '#d4a853')
  const textColor = isSel ? '#fff' : (isFav ? '#ff4d4f' : '#d4a853')
  const size = isSel ? 42 : 34
  const content = `<div class="custom-marker" style="background:${bg};border:2.5px solid ${border};border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${isSel ? 15 : 13}px;font-weight:700;color:${textColor};cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.18);pointer-events:auto;transition:all 0.2s;">${i + 1}</div>`
  const m = new AMap.Marker({ position: [loc.lng, loc.lat], content, offset: new AMap.Pixel(-size / 2, -size / 2), zIndex: isSel ? 200 : 100, extData: { index: i } })
  m.on('click', () => onMarkerClick(i))
  m.on('mouseover', () => {
    if (selectedIdx.value !== i) {
      m.setContent(`<div class="custom-marker" style="background:${isFav ? '#ff4d4f' : '#d4a853'};border:2.5px solid ${isFav ? '#ff4d4f' : '#d4a853'};border-radius:50%;width:42px;height:42px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.3);pointer-events:auto;">${i + 1}</div>`)
    }
  })
  m.on('mouseout', () => {
    if (selectedIdx.value !== i) {
      m.setContent(`<div class="custom-marker" style="background:#fff;border:2.5px solid ${isFav ? '#ff4d4f' : '#d4a853'};border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:${isFav ? '#ff4d4f' : '#d4a853'};cursor:pointer;box-shadow:0 3px 14px rgba(0,0,0,.18);pointer-events:auto;">${i + 1}</div>`)
    }
  })
  return m
}

function onMarkerClick(idx: number) { selectLocation(idx); openInfoWindow(idx) }

function openInfoWindow(idx: number) {
  const loc = locStore.locations[idx]
  const isFav = locStore.favorites.includes(loc.id)
  const tagsHtml = loc.tags.map((t: string) => `<span style="font-size:13px;padding:4px 12px;border-radius:6px;background:#faf6ed;color:#d4a853;font-weight:500;margin-right:8px;">${t}</span>`).join('')
  infoWindow.setContent(`
    <div style="padding:10px;min-width:300px;font-family:-apple-system,sans-serif;">
      <h4 style="font-size:17px;font-weight:700;margin:0 0 8px;color:#1f1f1f;">${loc.name}</h4>
      <p style="font-size:14px;color:#999;margin:0 0 10px;">${loc.city} ${loc.district}</p>
      <div style="margin-bottom:12px;">${tagsHtml}</div>
      <p style="font-size:14px;color:#666;margin:0 0 14px;line-height:1.8;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${loc.description.slice(0, 100)}...</p>
      <div style="display:flex;gap:10px;">
        <button onclick="window._wkViewDetail(${loc.id})" style="padding:8px 20px;background:#1677ff;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:500;">查看详情</button>
        <button onclick="window._wkToggleFav(${loc.id})" style="padding:8px 18px;background:#fff;border:1px solid ${isFav ? '#ff4d4f' : '#e5e7eb'};border-radius:8px;font-size:14px;cursor:pointer;color:${isFav ? '#ff4d4f' : '#666'};">${isFav ? '已收藏' : '收藏'}</button>
      </div>
    </div>`)
  infoWindow.open(map, markers[idx].getPosition())
}

declare global { interface Window { _wkViewDetail: (id: number) => void; _wkToggleFav: (id: number) => void; _wkRouteToPOI: (name: string) => void } }
window._wkViewDetail = (id: number) => router.push(`/location/${id}`)
window._wkToggleFav = async (id: number) => {
  await locStore.toggleFavorite(id)
  updateMarkers()
  const idx = locStore.locations.findIndex(l => l.id === id)
  if (idx >= 0 && selectedIdx.value === idx) openInfoWindow(idx)
  toast.success(locStore.favorites.includes(id) ? '已加入收藏' : '已取消收藏')
}
window._wkRouteToPOI = (name: string) => {
  const poi = bufferPOIs.value.find(p => p.name === name)
  if (poi) planRouteToPOI(poi)
}

function selectLocation(idx: number) {
  selectedIdx.value = idx
  map.setZoomAndCenter(14, [locStore.locations[idx].lng, locStore.locations[idx].lat], false, 400)
  expandedSection.value = 'weather'
  updateMarkers()
  queryWeather()
}

function updateMarkers() {
  markers.forEach((m, i) => {
    const oldM = m as any
    const isSel = i === selectedIdx.value
    const isFav = locStore.favorites.includes(locStore.locations[i].id)
    const bg = isSel ? '#ff4d4f' : '#fff'
    const border = isSel ? '#ff4d4f' : (isFav ? '#ff4d4f' : '#d4a853')
    const textColor = isSel ? '#fff' : (isFav ? '#ff4d4f' : '#d4a853')
    const size = isSel ? 46 : 38
    oldM.setContent(`<div class="custom-marker" style="background:${bg};border:3px solid ${border};border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${isSel ? 16 : 14}px;font-weight:700;color:${textColor};cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.2);pointer-events:auto;">${i + 1}</div>`)
    oldM.setzIndex(isSel ? 200 : 100)
  })
}

function fitAll() { map.setFitView(markers, false, [80, 80, 80, 520]) }
function resetView() {
  selectedIdx.value = null; weatherData.value = null
  expandedSection.value = null
  if (infoWindow) infoWindow.close()
  clearRoute(); clearBuffer()
  map.setZoomAndCenter(7, [112.0, 37.0]); updateMarkers()
}

function onSearch() {
  isLoading.value = true
  locStore.fetchLocations({ search: searchQuery.value || undefined, city: cityFilter.value || undefined }).then(() => {
    addMarkers()
    if (markers.length > 0) map.setFitView(markers, false, [80, 80, 80, 520])
    else toast.info('未找到匹配的取景地')
  }).catch(() => toast.error('搜索失败')).finally(() => isLoading.value = false)
}

function toggleFavPanel(id: number) { locStore.toggleFavorite(id); updateMarkers() }

// ========== 天气查询 ==========
async function queryWeather() {
  if (selectedIdx.value === null) return
  weatherLoading.value = true
  const loc = locStore.locations[selectedIdx.value]
  try {
    weather.getLive(loc.city, (err: any, data: any) => {
      weatherLoading.value = false
      if (err) { weatherData.value = null; return }
      weatherData.value = {
        city: data.city, weather: data.weather, temperature: data.temperature,
        windDirection: data.windDirection, windPower: data.windPower,
        humidity: data.humidity, reportTime: data.reportTime
      }
    })
  } catch { weatherLoading.value = false }
}

// ========== 路径规划 ==========
async function planRoute() {
  if (!routeStart.value || !routeEnd.value) { toast.info('请输入起点和终点'); return }
  if (!driving) { toast.error('路径规划服务未就绪，请稍后重试'); return }
  routeLoading.value = true
  routeResult.value = null
  routeSteps.value = []
  clearRoute()
  driving.search(
    [{ keyword: routeStart.value }, { keyword: routeEnd.value }],
    { policy: 0, extensions: 'all' },
    (status: string, result: any) => {
      routeLoading.value = false
      if (status === 'complete') {
        if (result.routes && result.routes.length > 0) {
          routeResult.value = result
          const route = result.routes[0]
          const steps = route.steps || []
          routeSteps.value = steps.map((s: any) => ({
            instruction: s.instruction,
            road: s.road,
            distance: s.distance,
            time: s.time,
          }))
          if (route.policy) {
            route._policy = route.policy
          }
          map.setFitView([], false, [80, 80, 80, 520])
          toast.success(`路径规划完成，共 ${(route.distance / 1000).toFixed(1)}km`)
        } else {
          toast.error('未找到可行路线，请检查地址是否正确')
        }
      } else {
        if (result && result.info) {
          toast.error(`路径规划失败：${result.info}`)
        } else {
          toast.error('路径规划失败，请检查地址是否正确')
        }
      }
    }
  )
}

function clearRoute() {
  if (driving) driving.clear()
  routeResult.value = null
  routeSteps.value = []
}

function useSelectedAsStart() {
  if (selectedIdx.value !== null) {
    const loc = locStore.locations[selectedIdx.value]
    routeStart.value = `${loc.city}${loc.district}${loc.name}`
  }
}
function useSelectedAsEnd() {
  if (selectedIdx.value !== null) {
    const loc = locStore.locations[selectedIdx.value]
    routeEnd.value = `${loc.city}${loc.district}${loc.name}`
  }
}

// ========== 缓冲区分析 ==========
function drawBuffer() {
  clearBuffer()
  const center = bufferCenter.value
  if (!center) { toast.info('请输入缓冲区中心点地址'); return }
  const geocoder = new AMap.Geocoder()
  geocoder.getLocation(center, (status: string, result: any) => {
    if (status === 'complete' && result.geocodes.length > 0) {
      const pos = result.geocodes[0].location
      const circle = new AMap.Circle({
        center: [pos.lng, pos.lat],
        radius: bufferRadius.value,
        strokeColor: '#1677ff', strokeWeight: 3, strokeOpacity: 0.8,
        fillColor: '#1677ff', fillOpacity: 0.12, zIndex: 10,
      })
      circle.setMap(map)
      bufferCircles.push(circle)
      map.setFitView([circle], false, [80, 80, 80, 520])
      searchBufferPOIs(pos.lng, pos.lat)
      toast.success(`缓冲区已生成，半径 ${(bufferRadius.value / 1000).toFixed(1)}km`)
    } else {
      toast.error('地址解析失败，请检查输入')
    }
  })
}

function searchBufferPOIs(lng: number, lat: number) {
  if (!placeSearch) {
    placeSearch = new AMap.PlaceSearch({ pageSize: 20, pageIndex: 1 })
  }
  bufferPOILoading.value = true
  bufferPOIs.value = []
  clearPOIMarkers()
  const keyword = bufferPOIType.value
  const radius = bufferRadius.value
  placeSearch.searchNearBy(keyword, [lng, lat], radius, (status: string, result: any) => {
    bufferPOILoading.value = false
    if (status === 'complete' && result.poiList) {
      bufferPOIs.value = result.poiList.pois.map((p: any) => ({
        name: p.name, address: p.address, location: p.location,
        distance: p.distance, type: p.type, tel: p.tel,
      }))
      addPOIMarkers()
      if (bufferPOIs.value.length === 0) {
        toast.info(`未找到周边${keyword}`)
      } else {
        toast.success(`找到 ${bufferPOIs.value.length} 个${keyword}`)
      }
    } else {
      toast.info(`搜索${keyword}失败，请重试`)
    }
  })
}

function addPOIMarkers() {
  clearPOIMarkers()
  bufferPOIs.value.forEach((poi) => {
    const iconMap: Record<string, string> = {
      '停车场': '🅿️', '加油站': '⛽', '餐饮': '🍽️', '酒店': '🏨',
      '超市': '🛒', '医院': '🏥', '银行': '🏦', '厕所': '🚻',
    }
    const icon = iconMap[bufferPOIType.value] || '📍'
    const marker = new AMap.Marker({
      position: [poi.location.lng, poi.location.lat],
      content: `<div style="background:#fff;border:2px solid #1677ff;border-radius:8px;padding:3px 8px;font-size:14px;display:flex;align-items:center;gap:4px;box-shadow:0 2px 10px rgba(0,0,0,.15);cursor:pointer;white-space:nowrap;"><span style="font-size:16px;">${icon}</span><span style="font-size:12px;color:#1677ff;font-weight:500;">${poi.name.length > 8 ? poi.name.slice(0, 8) + '..' : poi.name}</span></div>`,
      offset: new AMap.Pixel(-35, -20),
      zIndex: 80,
    })
    marker.on('click', () => {
      infoWindow.setContent(`
        <div style="padding:10px;font-family:-apple-system,sans-serif;min-width:240px;">
          <h4 style="font-size:15px;font-weight:700;margin:0 0 6px;color:#1f1f1f;">${poi.name}</h4>
          <p style="font-size:13px;color:#999;margin:0 0 6px;">${poi.address || '暂无地址'}</p>
          ${poi.tel ? `<p style="font-size:13px;color:#666;margin:0 0 6px;">📞 ${poi.tel}</p>` : ''}
          <p style="font-size:13px;color:#1677ff;margin:0 0 10px;">距离中心 ${poi.distance ? poi.distance + 'm' : '未知'}</p>
          <button onclick="window._wkRouteToPOI('${poi.name}')" style="padding:7px 18px;background:#1677ff;color:#fff;border:none;border-radius:8px;font-size:13px;cursor:pointer;font-weight:500;">🧭 导航到此</button>
        </div>`)
      infoWindow.open(map, marker.getPosition())
    })
    marker.setMap(map)
    bufferPOIMarkers.push(marker)
  })
}

function clearPOIMarkers() {
  bufferPOIMarkers.forEach(m => m.setMap(null))
  bufferPOIMarkers = []
}

function clearBuffer() {
  bufferCircles.forEach(c => c.setMap(null))
  bufferCircles = []
  clearPOIMarkers()
  bufferPOIs.value = []
}

function onBufferCenterChange() {
  if (bufferCircles.length > 0 && bufferCenter.value) {
    drawBuffer()
  }
}

function planRouteToPOI(poi: any) {
  const center = bufferCenter.value
  if (!center) { toast.info('请先选择缓冲区中心点'); return }
  routeStart.value = center
  routeEnd.value = poi.name
  expandedSection.value = 'route'
  planRoute()
}

function onPOITypeChange() {
  if (bufferCircles.length > 0 && bufferCenter.value) {
    const geocoder = new AMap.Geocoder()
    geocoder.getLocation(bufferCenter.value, (_status: string, result: any) => {
      if (result?.geocodes?.length > 0) {
        const pos = result.geocodes[0].location
        searchBufferPOIs(pos.lng, pos.lat)
      }
    })
  }
}

function toggleSection(section: 'weather' | 'route' | 'buffer') {
  expandedSection.value = expandedSection.value === section ? null : section
}
</script>

<template>
  <div class="map-page">
    <div ref="mapContainer" class="map-container"></div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <p class="loading-text">地图加载中...</p>
      </div>
    </div>

    <!-- 左侧搜索面板 -->
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
          @click="onMarkerClick(i)"
          class="loc-item"
          :class="{ active: selectedIdx === i }"
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

    <!-- 统一分析面板（右侧） -->
    <div class="analysis-panel" :class="{ visible: showPanel }">
      <div class="analysis-header">
        <h3>分析工具</h3>
        <div class="analysis-header-actions">
          <button v-if="selectedIdx !== null" @click="expandedSection = 'weather'; queryWeather()" class="header-action-btn" title="刷新天气">🔄</button>
          <button @click="showPanel = false" class="panel-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="analysis-body">
        <!-- 天气模块 -->
        <div class="analysis-section">
          <div class="section-header" @click="toggleSection('weather')">
            <div class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
              <span>实时天气</span>
              <span v-if="weatherData" class="section-badge">{{ weatherData.temperature }}°</span>
            </div>
            <svg class="section-arrow" :class="{ open: expandedSection === 'weather' }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div v-if="expandedSection === 'weather'" class="section-content">
            <div v-if="weatherLoading" class="section-loading">查询中...</div>
            <div v-else-if="weatherData" class="weather-card">
              <div class="weather-city">{{ weatherData.city }}</div>
              <div class="weather-main">
                <span class="weather-temp">{{ weatherData.temperature }}°</span>
                <span class="weather-desc">{{ weatherData.weather }}</span>
              </div>
              <div class="weather-details">
                <div class="weather-detail-item"><span>风向</span><strong>{{ weatherData.windDirection }}</strong></div>
                <div class="weather-detail-item"><span>风力</span><strong>{{ weatherData.windPower }}级</strong></div>
                <div class="weather-detail-item"><span>湿度</span><strong>{{ weatherData.humidity }}%</strong></div>
              </div>
              <div class="weather-time">{{ weatherData.reportTime }}</div>
            </div>
            <div v-else class="section-empty">请先选择一个取景地</div>
          </div>
        </div>

        <!-- 路径规划模块 -->
        <div class="analysis-section">
          <div class="section-header" @click="toggleSection('route')">
            <div class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              <span>路径规划</span>
              <span v-if="routeResult" class="section-badge green">{{ (routeResult.routes[0].distance / 1000).toFixed(1) }}km</span>
            </div>
            <svg class="section-arrow" :class="{ open: expandedSection === 'route' }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div v-if="expandedSection === 'route'" class="section-content">
            <div class="field-group">
              <label>起点</label>
              <div class="field-row">
                <input v-model="routeStart" placeholder="输入起点地址" class="field-input">
                <button @click="useSelectedAsStart" class="pick-btn" title="使用当前选中取景地">📍</button>
              </div>
            </div>
            <div class="field-group">
              <label>终点</label>
              <div class="field-row">
                <input v-model="routeEnd" placeholder="输入终点地址" class="field-input">
                <button @click="useSelectedAsEnd" class="pick-btn" title="使用当前选中取景地">📍</button>
              </div>
            </div>
            <div class="section-actions">
              <button @click="planRoute" class="btn-primary" :disabled="routeLoading">
                {{ routeLoading ? '规划中...' : '开始规划' }}
              </button>
              <button v-if="routeResult" @click="clearRoute" class="btn-ghost">清除路线</button>
            </div>
            <div v-if="routeResult" class="route-result">
              <div class="route-summary">
                <span class="route-stat">📏 {{ (routeResult.routes[0].distance / 1000).toFixed(1) }} km</span>
                <span class="route-stat">⏱ {{ Math.round(routeResult.routes[0].time / 60) }} 分钟</span>
                <span v-if="routeResult.routes[0].tolls" class="route-stat">💰 {{ routeResult.routes[0].tolls }}元</span>
              </div>
              <div class="route-steps">
                <div v-for="(step, si) in routeSteps.slice(0, 20)" :key="si" class="route-step">
                  <span class="step-num">{{ si + 1 }}</span>
                  <span class="step-text">{{ step.instruction }}</span>
                </div>
                <div v-if="routeSteps.length > 20" class="step-more">... 还有 {{ routeSteps.length - 20 }} 步</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 缓冲区分析模块 -->
        <div class="analysis-section">
          <div class="section-header" @click="toggleSection('buffer')">
            <div class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
              <span>缓冲区分析</span>
              <span v-if="bufferPOIs.length > 0" class="section-badge">{{ bufferPOIs.length }}个POI</span>
            </div>
            <svg class="section-arrow" :class="{ open: expandedSection === 'buffer' }" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div v-if="expandedSection === 'buffer'" class="section-content">
            <div class="field-group">
              <label>中心点</label>
              <select v-model="bufferCenter" class="field-select" @change="onBufferCenterChange">
                <option value="">-- 选择取景地 --</option>
                <option v-for="loc in locStore.locations" :key="loc.id" :value="loc.city + loc.district + loc.name">
                  {{ loc.name }}（{{ loc.city }}{{ loc.district }}）
                </option>
              </select>
              <input v-model="bufferCenter" placeholder="或手动输入地址" class="field-input" style="margin-top:8px;">
            </div>
            <div class="field-group">
              <label>缓冲区半径</label>
              <div class="slider-row">
                <input type="range" v-model.number="bufferRadius" min="500" max="50000" step="500" class="range-slider">
                <span class="slider-value">{{ (bufferRadius / 1000).toFixed(1) }} km</span>
              </div>
            </div>
            <div class="field-group">
              <label>搜索周边 POI 类型</label>
              <select v-model="bufferPOIType" @change="onPOITypeChange" class="field-select">
                <option v-for="t in poiTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="section-actions">
              <button @click="drawBuffer" class="btn-primary">生成缓冲区</button>
              <button v-if="bufferCircles.length > 0" @click="clearBuffer" class="btn-ghost">清除</button>
            </div>
            <div v-if="bufferPOILoading" class="section-loading">🔍 搜索 POI 中...</div>
            <div v-if="bufferPOIs.length > 0" class="poi-list">
              <div class="poi-list-header">周边 {{ bufferPOIType }}（{{ bufferPOIs.length }}）</div>
              <div v-for="(poi, pi) in bufferPOIs.slice(0, 20)" :key="pi" class="poi-item">
                <span class="poi-icon">{{ poiTypeIcons[bufferPOIType] || '📍' }}</span>
                <div class="poi-info">
                  <div class="poi-name">{{ poi.name }}</div>
                  <div class="poi-addr">{{ poi.address || '暂无地址' }}</div>
                </div>
                <span v-if="poi.distance" class="poi-dist">{{ poi.distance }}m</span>
                <button @click="planRouteToPOI(poi)" class="poi-route-btn" title="导航到此">🧭</button>
              </div>
              <div v-if="bufferPOIs.length > 20" class="poi-more">还有 {{ bufferPOIs.length - 20 }} 个未显示...</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情面板 -->
    <div class="detail-panel" :class="{ open: showPanel }">
      <div class="panel-header">
        <h3>取景地详情</h3>
        <button @click="showPanel = false" class="panel-close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="panel-body" v-if="selectedIdx !== null && locStore.locations[selectedIdx]">
        <div class="panel-hero">
          <h2 class="panel-loc-name">{{ locStore.locations[selectedIdx].name }}</h2>
          <p class="panel-loc-addr">{{ locStore.locations[selectedIdx].city }} {{ locStore.locations[selectedIdx].district }}</p>
          <div class="panel-tags">
            <span v-for="t in locStore.locations[selectedIdx].tags" :key="t" class="panel-tag">{{ t }}</span>
          </div>
        </div>
        <div class="panel-info-grid">
          <div class="panel-info-item"><label>年代</label><span>{{ locStore.locations[selectedIdx].period }}</span></div>
          <div class="panel-info-item"><label>门票</label><span>{{ locStore.locations[selectedIdx].ticket }}</span></div>
          <div class="panel-info-item"><label>开放时间</label><span>{{ locStore.locations[selectedIdx].hours }}</span></div>
        </div>
        <div class="panel-section">
          <h4 class="panel-section-title">简介</h4>
          <p class="panel-section-text">{{ locStore.locations[selectedIdx].description }}</p>
        </div>
        <div class="panel-section">
          <h4 class="panel-section-title">看点</h4>
          <p class="panel-section-text">{{ locStore.locations[selectedIdx].highlight }}</p>
        </div>
        <div class="panel-actions">
          <button @click="router.push(`/location/${locStore.locations[selectedIdx].id}`)" class="btn-primary">查看完整详情</button>
          <button @click="toggleFavPanel(locStore.locations[selectedIdx].id)" class="btn-outline" :class="{ danger: locStore.favorites.includes(locStore.locations[selectedIdx].id) }">
            <svg width="16" height="16" viewBox="0 0 24 24" :fill="locStore.favorites.includes(locStore.locations[selectedIdx].id) ? '#ff4d4f' : 'none'" :stroke="locStore.favorites.includes(locStore.locations[selectedIdx].id) ? '#ff4d4f' : 'currentColor'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {{ locStore.favorites.includes(locStore.locations[selectedIdx].id) ? '已收藏' : '收藏' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 地图控件 -->
    <div class="map-controls">
      <button @click="showPanel = !showPanel" :title="showPanel ? '隐藏分析面板' : '显示分析面板'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
      </button>
      <button @click="fitAll" title="显示全部"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/></svg></button>
      <button @click="resetView" title="重置视图"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>
      <button @click="map?.zoomIn()" title="放大"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>
      <button @click="map?.zoomOut()" title="缩小"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg></button>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="legend-dot gold"></span>取景地</span>
      <span class="legend-item"><span class="legend-dot red"></span>已收藏</span>
      <span class="legend-item"><span class="legend-dot red"></span>选中</span>
      <span class="legend-item"><span class="legend-dot blue"></span>POI</span>
    </div>
  </div>
</template>

<style scoped>
.map-page { height: 100%; position: relative; }
.map-container { width: 100%; height: 100%; }

/* Loading */
.loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,.85);
  z-index: 51; display: flex; align-items: center; justify-content: center;
}
.loading-spinner { text-align: center; }
.spinner-ring { width: 52px; height: 52px; border: 4px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin .8s linear infinite; margin: 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 17px; color: var(--text-tertiary); margin-top: 16px; }

/* 左侧搜索面板 */
.search-panel {
  position: absolute; top: 20px; left: 20px; z-index: 50;
  background: rgba(255,255,255,.97); backdrop-filter: blur(12px);
  border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08);
  border: 1px solid var(--border-color); padding: 18px; width: 420px;
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

.loc-list { max-height: 400px; overflow-y: auto; }
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

/* 统一分析面板 */
.analysis-panel {
  position: absolute; left: 20px; bottom: 80px; z-index: 50;
  width: 480px; max-height: calc(100% - 160px);
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
.analysis-header-actions { display: flex; align-items: center; gap: 10px; }
.header-action-btn {
  width: 36px; height: 36px; border: none; background: var(--bg-page);
  border-radius: 10px; cursor: pointer; display: flex; align-items: center;
  justify-content: center; font-size: 18px; transition: all .2s;
}
.header-action-btn:hover { background: var(--color-primary-bg); }
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
.section-loading { font-size: 15px; color: var(--text-tertiary); text-align: center; padding: 20px 0; }
.section-empty { font-size: 15px; color: var(--text-quaternary); text-align: center; padding: 20px 0; }

/* 天气 */
.weather-card { text-align: center; padding: 8px 0; }
.weather-city { font-size: 15px; color: var(--text-tertiary); margin-bottom: 8px; }
.weather-main { display: flex; align-items: baseline; justify-content: center; gap: 14px; margin-bottom: 18px; }
.weather-temp { font-size: 60px; font-weight: 700; color: var(--text-primary); line-height: 1; }
.weather-desc { font-size: 18px; color: var(--text-secondary); }
.weather-details { display: flex; justify-content: center; gap: 32px; margin-bottom: 14px; }
.weather-detail-item { text-align: center; }
.weather-detail-item span { display: block; font-size: 13px; color: var(--text-tertiary); margin-bottom: 4px; }
.weather-detail-item strong { font-size: 16px; color: var(--text-primary); }
.weather-time { font-size: 13px; color: var(--text-quaternary); }

/* 表单元素 */
.field-group { margin-bottom: 16px; }
.field-group label { display: block; font-size: 14px; color: var(--text-tertiary); font-weight: 500; margin-bottom: 6px; }
.field-row { display: flex; gap: 10px; }
.field-input {
  flex: 1; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 12px;
  font-size: 15px; outline: none; transition: border-color .2s; box-sizing: border-box;
}
.field-input:focus { border-color: var(--color-primary); }
.pick-btn {
  width: 48px; border: 1px solid var(--border-color); border-radius: 12px;
  background: #fff; cursor: pointer; font-size: 20px; transition: all .2s; flex-shrink: 0;
}
.pick-btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }

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

/* 路径结果 */
.route-result { margin-top: 16px; }
.route-summary {
  display: flex; gap: 20px; flex-wrap: wrap;
  padding: 14px 16px; background: var(--color-primary-bg);
  border-radius: 12px; margin-bottom: 14px;
}
.route-stat { font-size: 15px; color: var(--color-primary); font-weight: 600; }
.route-steps { max-height: 280px; overflow-y: auto; }
.route-step {
  display: flex; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f5f5f5;
  font-size: 14px; line-height: 1.7;
}
.step-num {
  width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary-bg);
  color: var(--color-primary); display: flex; align-items: center;
  justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; margin-top: 1px;
}
.step-text { color: var(--text-secondary); }
.step-more { font-size: 14px; color: var(--text-tertiary); text-align: center; padding: 12px; }

/* POI 列表 */
.poi-list { margin-top: 14px; }
.poi-list-header { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; }
.poi-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 0;
  border-bottom: 1px solid #f5f5f5; font-size: 14px;
}
.poi-icon { font-size: 18px; flex-shrink: 0; }
.poi-dot { width: 10px; height: 10px; border-radius: 50%; background: #1677ff; flex-shrink: 0; }
.poi-info { flex: 1; min-width: 0; }
.poi-name { font-size: 14px; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.poi-addr { font-size: 13px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.poi-dist { font-size: 13px; color: var(--color-primary); font-weight: 500; white-space: nowrap; }
.poi-route-btn {
  width: 32px; height: 32px; border: 1px solid var(--border-color); border-radius: 8px;
  background: #fff; cursor: pointer; font-size: 16px; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; transition: all .2s;
}
.poi-route-btn:hover { border-color: var(--color-primary); background: var(--color-primary-bg); }
.poi-more { font-size: 13px; color: var(--text-tertiary); text-align: center; padding: 10px; }

/* 详情面板 */
.detail-panel {
  position: absolute; top: 0; right: 0; width: 520px; height: 100%;
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
.panel-loc-addr { font-size: 16px; color: var(--text-tertiary); margin-bottom: 16px; }
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

/* 地图控件 */
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