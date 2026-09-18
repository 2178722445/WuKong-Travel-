<script setup lang="ts">
/**
 * PhotoSpotsView — 光影机位页（C 模块试点：应县木塔）
 * 左：机位卡片 + 日期/时刻控制 + 经验时段 vs 算法时段对照
 * 右：PhotoSpot3D 三维场景（日照阴影 / 视线通廊）
 */
import { computed, ref } from 'vue'
import PhotoSpot3D from '../components/cesium/PhotoSpot3D.vue'
import { getPhotoSpotSite, photoSpotDataSources } from '../data/photoSpots'
import { sunPosition, evaluateLight, daySlots, bestWindows, type LightQuality } from '../utils/sun'

const site = getPhotoSpotSite(3)!

/* ---------------- 日期 / 时刻控制（北京时间） ---------------- */
function todayISO(): string {
  // 以北京时区输出当日日期
  const now = new Date()
  const bj = new Date(now.getTime() + 8 * 3600000 - now.getTimezoneOffset() * 60000)
  return bj.toISOString().slice(0, 10)
}

const dateISO = ref(todayISO())
const timeMinutes = ref(9 * 60 + 30)
const timeInput = computed({
  get: () => `${String(Math.floor(timeMinutes.value / 60)).padStart(2, '0')}:${String(timeMinutes.value % 60).padStart(2, '0')}`,
  set: (value: string) => {
    const [hours, minutes] = value.split(':').map(Number)
    if (Number.isFinite(hours) && Number.isFinite(minutes)) timeMinutes.value = Math.min(1170, Math.max(300, hours * 60 + minutes))
  },
})
const showSightline = ref(true)
const selectedSpotId = ref<string | null>(site.spots[0]?.id ?? null)
const baseMap = ref<'tdt' | 'bing' | 'vec'>('tdt')

const timeLabel = computed(() => {
  const hh = String(Math.floor(timeMinutes.value / 60)).padStart(2, '0')
  const mm = String(timeMinutes.value % 60).padStart(2, '0')
  return `${hh}:${mm}`
})

/** 当前时刻太阳位置（取木塔中心） */
const currentSun = computed(() => {
  const [y, m, d] = dateISO.value.split('-').map(Number)
  const hh = Math.floor(timeMinutes.value / 60)
  const mm = timeMinutes.value % 60
  const utc = new Date(Date.UTC(y, m - 1, d, hh - 8, mm))
  return sunPosition(utc, site.building.center.lng, site.building.center.lat)
})

const selectedSpot = computed(() => site.spots.find(s => s.id === selectedSpotId.value) ?? null)

const currentLight = computed(() => {
  if (!selectedSpot.value || selectedSpot.value.bearingDeg === null) return null
  return evaluateLight(currentSun.value, selectedSpot.value.bearingDeg)
})

/* ---------------- 机位派生信息 ---------------- */
function haversine(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

function bearingText(b: number | null): string {
  if (b === null) return '朝向待核实'
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  return `望${dirs[Math.round(b / 45) % 8]} · ${Math.round(b)}°`
}

const spotCards = computed(() =>
  site.spots.map((spot, idx) => {
    const slots = daySlots(dateISO.value, spot.lng, spot.lat, spot.bearingDeg ?? 0)
    return {
      spot,
      index: idx + 1,
      distance: haversine(spot.lng, spot.lat, site.building.center.lng, site.building.center.lat),
      windows: bestWindows(slots),
    }
  }),
)

const qualityClass = (q: LightQuality) => ({
  'q-shun': q === '顺光',
  'q-ce': q === '侧光',
  'q-ni': q === '逆光',
  'q-night': q === '夜间',
})

function selectSpot(id: string) {
  selectedSpotId.value = id
}
</script>

<template>
  <div class="ps-page">
    <!-- ============ 左侧控制面板 ============ -->
    <aside class="ps-panel">
      <header class="ps-header">
        <div class="ps-title-row">
          <h1>光影机位</h1>
          <span class="ps-pilot">试点</span>
        </div>
        <div class="ps-sub">应县木塔（佛宫寺释迦塔）· 机位 · 日照 · 视线分析</div>
        <div class="ps-unverified">
          机位为卫星影像判读，未经现场踏勘；塔身为参数化体量示意，非实测模型
        </div>
      </header>

      <!-- 时刻控制 -->
      <section class="ps-control">
        <div class="ctl-row">
          <label>日期</label>
          <input type="date" v-model="dateISO" class="ctl-date" />
        </div>
        <div class="ctl-row ctl-time-row">
          <label for="sun-time">时刻</label>
          <input id="sun-time" type="time" min="05:00" max="19:30" step="600" v-model="timeInput" class="ctl-time-input" />
          <span class="ctl-time">{{ timeLabel }}</span>
        </div>
        <div class="sun-readout">
          <div class="sun-item">
            <span class="sun-k">太阳方位</span>
            <span class="sun-v">{{ currentSun.azimuth.toFixed(1) }}°</span>
          </div>
          <div class="sun-item">
            <span class="sun-k">高度角</span>
            <span class="sun-v">{{ currentSun.elevation.toFixed(1) }}°</span>
          </div>
          <div class="sun-item" v-if="currentLight">
            <span class="sun-k">选中机位光质</span>
            <span class="sun-q" :class="qualityClass(currentLight.quality)">{{ currentLight.quality }}</span>
          </div>
        </div>
        <label class="ctl-check">
          <input type="checkbox" v-model="showSightline" />
          显示机位→塔身视线通廊分析（绿=可见，红=遮挡）
        </label>
      </section>

      <!-- 机位卡片 -->
      <section class="ps-spots">
        <article
          v-for="card in spotCards"
          :key="card.spot.id"
          class="spot-card"
          :class="{ active: card.spot.id === selectedSpotId }"
          @click="selectSpot(card.spot.id)"
        >
          <div class="spot-head">
            <span class="spot-no">{{ card.index }}</span>
            <div class="spot-name-box">
              <div class="spot-name">{{ card.spot.name }}</div>
              <div class="spot-meta">{{ bearingText(card.spot.bearingDeg) }} · 约 {{ card.distance }}m</div>
            </div>
            <span class="spot-status" :title="card.spot.note">待核实</span>
          </div>

          <div class="spot-framing">{{ card.spot.framing }}</div>
          <div class="spot-focal">焦段：{{ card.spot.focalLength }}</div>

          <div class="spot-time-block">
            <div class="time-line">
              <span class="time-tag tag-exp">经验</span>
              <span class="time-text">{{ card.spot.experienceBestTime ?? '暂无信源，待补充游记/机位帖' }}</span>
            </div>
            <div class="time-line">
              <span class="time-tag tag-algo">算法 · {{ dateISO }}</span>
              <span class="time-text">
                <template v-if="card.windows.length">
                  <span v-for="(w, i) in card.windows" :key="i" class="win-chip" :class="qualityClass(w.quality)">
                    {{ w.start }}–{{ w.end }} {{ w.quality }}
                  </span>
                </template>
                <template v-else>当日无较好的顺/侧光窗口</template>
              </span>
            </div>
          </div>
        </article>
      </section>

      <footer class="ps-footer">
        <div class="footer-title">数据与算法说明</div>
        <ul>
          <li>塔中心/八角轮廓/总高 67.31m：OpenStreetMap（ODbL）+ 天地图影像目视核对</li>
          <li>太阳位置：NOAA 太阳位置公式（±0.1°），顺光=太阳在机位背后直射被摄面</li>
          <li>阴影与遮挡基于体量盒，仅供出行参考，现场以实际为准</li>
          <li v-for="(s, i) in photoSpotDataSources" :key="i">
            信源：{{ s.title }}<a v-if="s.url" :href="s.url" target="_blank" rel="noopener"> 链接</a>
          </li>
        </ul>
      </footer>
    </aside>

    <!-- ============ 右侧三维场景 ============ -->
    <main class="ps-map">
      <PhotoSpot3D
        :site="site"
        :selected-spot-id="selectedSpotId"
        :dateISO="dateISO"
        :time-minutes="timeMinutes"
        :show-sightline="showSightline"
        :base-map="baseMap"
        @select-spot="selectSpot"
      />
      <div class="basemap-switch">
        <button
          v-for="opt in [{ k: 'tdt', t: '天地图影像' }, { k: 'bing', t: 'Bing 卫星' }, { k: 'vec', t: '天地图矢量' }]"
          :key="opt.k"
          class="bm-btn"
          :class="{ active: baseMap === opt.k }"
          @click="baseMap = opt.k as 'tdt' | 'bing' | 'vec'"
        >
          {{ opt.t }}
        </button>
      </div>
      <div v-if="selectedSpot" class="map-hint">
        <strong>{{ selectedSpot.name }}</strong>
        <span>{{ selectedSpot.note }}</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ps-page {
  height: 100%;
  display: flex;
  background: var(--bg-page);
}

/* ---------- 左侧面板 ---------- */
.ps-panel {
  width: 380px;
  flex-shrink: 0;
  height: 100%;
  overflow-y: auto;
  background: #fbf8f2;
  border-right: 1px solid #e8e0d2;
  display: flex;
  flex-direction: column;
}

.ps-header {
  padding: 20px 20px 14px;
  border-bottom: 1px solid #ece4d6;
}
.ps-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ps-title-row h1 {
  margin: 0;
  font-size: 22px;
  color: #5a4626;
  letter-spacing: 2px;
}
.ps-pilot {
  font-size: 11px;
  color: #9a7740;
  border: 1px solid #d8bd8f;
  border-radius: 10px;
  padding: 1px 8px;
  background: #f6eddf;
}
.ps-sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}
.ps-unverified {
  margin-top: 10px;
  font-size: 12px;
  color: #8a6420;
  background: #fdf3e0;
  border: 1px solid #f0dcb4;
  border-radius: 6px;
  padding: 7px 10px;
  line-height: 1.5;
}

/* 控制区 */
.ps-control {
  padding: 14px 20px;
  border-bottom: 1px solid #ece4d6;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ctl-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}
.ctl-date,
.ctl-time-input {
  border: 1px solid var(--border-color-strong);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  background: #fff;
}
.ctl-time-row {
  gap: 8px;
}
.ctl-range {
  flex: 1;
  accent-color: #9a7740;
}
.ctl-time {
  width: 46px;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: #5a4626;
}
.sun-readout {
  display: flex;
  gap: 8px;
}
.sun-item {
  flex: 1;
  background: #fff;
  border: 1px solid #ece4d6;
  border-radius: 6px;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sun-k {
  font-size: 11px;
  color: var(--text-tertiary);
}
.sun-v {
  font-size: 15px;
  font-weight: 600;
  color: #5a4626;
  font-variant-numeric: tabular-nums;
}
.sun-q {
  font-size: 14px;
  font-weight: 700;
}
.q-shun { color: #1f7a3d; }
.q-ce { color: #b07a18; }
.q-ni { color: #c0392b; }
.q-night { color: var(--text-tertiary); }

.ctl-check {
  font-size: 12px;
  color: var(--text-secondary);
  display: flex;
  gap: 6px;
  align-items: flex-start;
  cursor: pointer;
  line-height: 1.5;
}

/* 机位卡 */
.ps-spots {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.spot-card {
  background: #fff;
  border: 1px solid #ece4d6;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s;
}
.spot-card:hover {
  border-color: #d8bd8f;
}
.spot-card.active {
  border-color: #9a7740;
  box-shadow: 0 0 0 2px rgba(154, 119, 64, 0.15);
}
.spot-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.spot-no {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #c8963e;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.spot-card.active .spot-no {
  background: #d43c2f;
}
.spot-name-box {
  flex: 1;
  min-width: 0;
}
.spot-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.spot-meta {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 1px;
}
.spot-status {
  font-size: 11px;
  color: #8a6420;
  background: #fdf3e0;
  border-radius: 4px;
  padding: 1px 7px;
  flex-shrink: 0;
}
.spot-framing {
  margin-top: 8px;
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.55;
}
.spot-focal {
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.spot-time-block {
  margin-top: 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 9px;
  border-top: 1px dashed #ece4d6;
}
.time-line {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.5;
}
.time-tag {
  flex-shrink: 0;
  font-size: 10.5px;
  border-radius: 4px;
  padding: 1px 6px;
  margin-top: 1px;
}
.tag-exp {
  color: #7a6a4f;
  background: #f2ece1;
}
.tag-algo {
  color: #fff;
  background: #9a7740;
}
.time-text {
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.win-chip {
  border-radius: 4px;
  padding: 1px 6px;
  background: #f5f5f5;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.win-chip.q-shun { background: #e6f6ea; }
.win-chip.q-ce { background: #fdf3e0; }
.win-chip.q-ni { background: #fdecea; }

/* 页脚 */
.ps-footer {
  padding: 12px 20px 18px;
  border-top: 1px solid #ece4d6;
  font-size: 11.5px;
  color: var(--text-tertiary);
  line-height: 1.6;
}
.footer-title {
  color: #8a7a5e;
  font-weight: 600;
  margin-bottom: 4px;
}
.ps-footer ul {
  margin: 0;
  padding-left: 16px;
}
.ps-footer a {
  color: #9a7740;
}

/* ---------- 右侧地图 ---------- */
.ps-map {
  flex: 1;
  position: relative;
  min-width: 0;
}
.basemap-switch {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e8e0d2;
  border-radius: 8px;
  padding: 3px;
  box-shadow: var(--shadow-md);
  z-index: 10;
}
.bm-btn {
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all .15s;
}
.bm-btn:hover {
  color: #5a4626;
}
.bm-btn.active {
  background: #9a7740;
  color: #fff;
}
.map-hint {
  position: absolute;
  left: 14px;
  bottom: 14px;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e8e0d2;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: var(--shadow-md);
  pointer-events: none;
}
.map-hint strong {
  color: #5a4626;
  font-size: 13px;
}

@media (max-width: 900px) {
  .ps-page {
    flex-direction: column;
  }
  .ps-panel {
    width: 100%;
    height: 46%;
    border-right: none;
    border-bottom: 1px solid #e8e0d2;
  }
  .ps-map {
    height: 54%;
  }
}
</style>
