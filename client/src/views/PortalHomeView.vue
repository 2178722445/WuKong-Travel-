<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import OLViewer from '../components/openlayers/OLViewer.vue'
import CesiumViewer from '../components/cesium/CesiumViewer.vue'
import { demoLocations } from '../data/demo'
import { YINGXIAN_ID, yingxianAssets } from '../data/yingxian'
import { useVisitStore } from '../stores/visit'

type MapMode = '2d' | 'satellite' | '3d'
const router = useRouter()
const visit = useVisitStore()
const mapMode = ref<MapMode>('2d')
const query = ref('')
const typeFilter = ref('')

const selected = computed(() => demoLocations.find(item => item.id === visit.selectedLocationId) ?? null)
const buildingTypes = computed(() => [...new Set(demoLocations.map(item => item.tags[0]))])
const filtered = computed(() => demoLocations.filter(item => {
  const q = query.value.trim()
  return (!q || `${item.name}${item.city}${item.district}`.includes(q)) && (!typeFilter.value || item.tags[0] === typeFilter.value)
}))
const grouped = computed(() => {
  const groups = new Map<string, typeof demoLocations>()
  filtered.value.forEach(item => groups.set(item.city, [...(groups.get(item.city) ?? []), item]))
  return [...groups.entries()]
})

function selectLocation(id: number) {
  visit.selectLocation(id)
}

function showInterest() {
  if (selected.value) localStorage.setItem(`wukong-shanxi-interest-${selected.value.id}`, '1')
}

function openService(service: string) {
  if (!selected.value) return
  router.push(selected.value.id === YINGXIAN_ID ? `/${service}/${YINGXIAN_ID}` : `/service/${service}/${selected.value.id}`)
}
</script>

<template>
  <div class="home-workspace">
    <section class="map-pane">
      <OLViewer v-if="mapMode !== '3d'" :locations="filtered" :selected-location-id="selected?.id ?? null" :base-mode="mapMode" @select-location="selectLocation" />
      <CesiumViewer v-else :locations="filtered" :selected-location-id="selected?.id ?? null" @select-location="selectLocation" />
      <div class="map-modes" aria-label="地图模式">
        <button :class="{ active: mapMode === '2d' }" @click="mapMode = '2d'">地图</button>
        <button :class="{ active: mapMode === 'satellite' }" @click="mapMode = 'satellite'">卫星</button>
        <button :class="{ active: mapMode === '3d' }" @click="mapMode = '3d'">3D</button>
      </div>
      <div class="map-caption"><strong>山西取景地</strong><span>{{ filtered.length }} 处地点</span></div>
    </section>

    <aside class="location-pane">
      <template v-if="!selected">
        <header class="list-header">
          <p>山西行摄索引</p>
          <h1>从一张地图开始</h1>
          <div class="service-notice">深度行摄服务正在逐站完善，目前已开放应县木塔。</div>
          <div class="filters">
            <input v-model="query" type="search" placeholder="搜索地点或城市">
            <select v-model="typeFilter" aria-label="古建类型">
              <option value="">全部类型</option>
              <option v-for="type in buildingTypes" :key="type">{{ type }}</option>
            </select>
          </div>
        </header>
        <div class="location-list">
          <section v-for="[city, items] in grouped" :key="city" class="city-group">
            <h2>{{ city }}<span>{{ items.length }}</span></h2>
            <button v-for="item in items" :key="item.id" class="location-row" @click="selectLocation(item.id)">
              <span class="row-index">{{ String(item.id).padStart(2, '0') }}</span>
              <span><b>{{ item.name }}</b><small>{{ item.district }} · {{ item.tags[0] }}</small></span>
              <i v-if="item.id === YINGXIAN_ID">已开放</i><span class="row-arrow">›</span>
            </button>
          </section>
          <div v-if="!filtered.length" class="empty">没有匹配的地点</div>
        </div>
      </template>

      <template v-else>
        <button class="back-button" @click="visit.selectLocation(null)">← 返回全部地点</button>
        <img class="detail-cover" :src="selected.id === YINGXIAN_ID ? yingxianAssets.cover : '/images/xiaoxitian/overview.jpg'" :alt="selected.name">
        <div class="detail-body">
          <span class="detail-status">{{ selected.id === YINGXIAN_ID ? '行摄服务已开放' : '深度服务筹备中' }}</span>
          <h1>{{ selected.name }}</h1>
          <p class="detail-meta">{{ selected.city }} · {{ selected.district }} · {{ selected.tags[0] }}</p>
          <p class="detail-copy">{{ selected.description }}这里先提供地点索引与基础看点，深度路线、机位和对照内容将逐站补齐。</p>
          <div class="highlight"><small>看点</small><strong>{{ selected.highlight }}</strong></div>
          <div class="service-grid">
            <button @click="openService('tour')"><b>怎么逛</b><span>{{ selected.id === YINGXIAN_ID ? '参观顺序与看点' : '筹备中' }}</span></button>
            <button @click="openService('photo-spots')"><b>从哪拍</b><span>{{ selected.id === YINGXIAN_ID ? '实景机位与光影' : '筹备中' }}</span></button>
            <button @click="openService('practical')"><b>出发前看</b><span>{{ selected.id === YINGXIAN_ID ? '开放与到达信息' : '筹备中' }}</span></button>
            <button @click="openService('game-compare')"><b>游戏对照</b><span>{{ selected.id === YINGXIAN_ID ? '轮廓与构造观察' : '筹备中' }}</span></button>
          </div>
          <button v-if="selected.id !== YINGXIAN_ID" class="interest" @click="showInterest">想看这个地点</button>
        </div>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.home-workspace{height:100%;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(380px,.8fr);background:#f5f0e7;color:#2a211b}.map-pane{position:relative;min-width:0;background:#23201c}.map-modes{position:absolute;top:18px;right:18px;z-index:20;display:flex;padding:3px;background:rgba(41,32,26,.92);border:1px solid #745a43}.map-modes button{height:34px;min-width:58px;border:0;background:transparent;color:#d9cdbd;cursor:pointer}.map-modes button.active{background:#a23a2d;color:#fff}.map-caption{position:absolute;left:22px;bottom:20px;z-index:10;display:flex;align-items:baseline;gap:12px;padding:10px 14px;background:rgba(41,32,26,.9);color:#fff;border-left:3px solid #b34132}.map-caption span{font-size:12px;color:#cbbdaf}.location-pane{min-width:0;height:100%;overflow-y:auto;background:#f7f2e9;border-left:1px solid #d5c8b6}.list-header{position:sticky;top:0;z-index:5;padding:28px 30px 18px;background:rgba(247,242,233,.97);border-bottom:1px solid #d9cebd}.list-header>p{margin:0;color:#9b3429;font-size:12px}.list-header h1{margin:6px 0 14px;font:30px/1.2 Georgia,'Songti SC',serif}.service-notice{padding:9px 11px;border-left:3px solid #a23a2d;background:#eee4d5;font-size:12px;color:#5f5144}.filters{display:grid;grid-template-columns:1fr 130px;gap:8px;margin-top:14px}.filters input,.filters select{height:38px;border:1px solid #cfc2b0;background:#fffdf8;padding:0 10px;color:#342923}.location-list{padding:8px 24px 28px}.city-group h2{display:flex;justify-content:space-between;margin:18px 4px 7px;font-size:13px;color:#7d6b5d}.city-group h2 span{font-weight:400}.location-row{width:100%;display:grid;grid-template-columns:38px 1fr auto 16px;align-items:center;gap:10px;padding:12px 8px;border:0;border-top:1px solid #ddd2c2;background:transparent;text-align:left;cursor:pointer;color:#2a211b}.location-row:hover{background:#eee4d5}.row-index{font:14px Georgia,serif;color:#a23a2d}.location-row b,.location-row small{display:block}.location-row b{font-size:15px}.location-row small{margin-top:4px;color:#8a7869;font-size:11px}.location-row i{font-style:normal;font-size:11px;color:#9b3429}.row-arrow{font-size:22px;color:#a99a8c}.empty{text-align:center;padding:40px;color:#8a7869}.back-button{margin:20px 26px 12px;border:0;background:transparent;color:#8b3027;cursor:pointer}.detail-cover{display:block;width:calc(100% - 52px);height:220px;margin:0 26px;object-fit:cover}.detail-body{padding:22px 28px 36px}.detail-status{color:#9b3429;font-size:12px}.detail-body h1{font:34px Georgia,'Songti SC',serif;margin:6px 0}.detail-meta{color:#846f60;font-size:13px}.detail-copy{line-height:1.8;color:#5f5144}.highlight{display:flex;flex-direction:column;gap:3px;padding:12px 0;border-top:1px solid #d8ccbb;border-bottom:1px solid #d8ccbb}.highlight small{color:#927e6c}.service-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:18px}.service-grid button{min-height:76px;border:1px solid #cfc2b0;background:#fffdf8;text-align:left;padding:12px;cursor:pointer}.service-grid button:hover{border-color:#a23a2d}.service-grid b,.service-grid span{display:block}.service-grid span{margin-top:6px;color:#857366;font-size:11px}.interest{width:100%;margin-top:14px;height:42px;border:0;background:#94352b;color:#fff;cursor:pointer}@media(max-width:860px){.home-workspace{grid-template-columns:1fr;grid-template-rows:46% 54%}.location-pane{border-left:0;border-top:1px solid #d5c8b6}.list-header{padding:18px 20px 14px}.list-header h1{font-size:24px}.location-list{padding:6px 16px 24px}.detail-cover{height:160px}.map-modes{top:10px;right:10px}}
</style>
