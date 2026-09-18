<script setup lang="ts">
/**
 * PhotoSpot3D — 机位光影三维场景
 *
 * 职责：
 * - 天地图影像（img）+ 注记（cia）双图层，失败降级 OSM（避免蓝球）
 * - 按 BuildingMassing 参数化生成正八边形木塔体量盒（台基/五明层/檐带/塔刹）
 * - 场景时钟驱动太阳位置 → enableLighting + ShadowMap 实时日照阴影
 * - 机位实体（贴地 billboard）点击 → 飞行定位 + 视线通廊分析（地形/体量遮挡）
 */
import { ref, shallowRef, onMounted, onUnmounted, watch } from 'vue'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import type { PhotoSpotSite, PhotoSpot } from '../../types'

const props = defineProps<{
  site: PhotoSpotSite
  selectedSpotId: string | null
  /** 北京日期 yyyy-mm-dd */
  dateISO: string
  /** 北京时钟分钟数（如 12*60+30） */
  timeMinutes: number
  showSightline: boolean
  /** 底图源：天地图影像 / Bing 卫星 / 天地图矢量 */
  baseMap?: 'tdt' | 'bing' | 'vec'
}>()

const emit = defineEmits<{
  (e: 'select-spot', id: string): void
}>()

const container = ref<HTMLDivElement>()
const viewer = shallowRef<Cesium.Viewer>()
/** 场景就绪后才允许 watch 回调操作 */
const ready = shallowRef(false)
let handler: Cesium.ScreenSpaceEventHandler | null = null
/** 视线分析临时实体 id 列表 */
let sightlineIds: string[] = []
/** 各点地面高（椭球高 m），无地形时为 0 */
let groundH = new Map<string, number>()
/** 以建筑中心为原点的 ENU 矩阵 */
let enuMatrix: Cesium.Matrix4 | null = null

const RAD = Math.PI / 180

onMounted(async () => {
  if (!container.value) return
  const ionToken = import.meta.env.VITE_CESIUM_ION_TOKEN
  if (ionToken) Cesium.Ion.defaultAccessToken = ionToken

  // 显式创建并等待地形 provider 就绪后再建 Viewer —— Terrain.fromWorldTerrain()
  // 在 Viewer 内是异步装配的，挂载瞬间 terrainProvider 尚为 undefined，
  // 立即采样会抛 "terrainProvider is required"，导致体量误按椭球高 0 构建而埋入地下
  let terrain: Cesium.Terrain | undefined
  if (ionToken) {
    try {
      const resource = await Cesium.IonResource.fromAssetId(1)
      const provider = await Cesium.CesiumTerrainProvider.fromUrl(resource, {
        requestVertexNormals: true,
      })
      terrain = new Cesium.Terrain(Promise.resolve(provider))
    } catch (e) {
      console.warn('[PhotoSpot3D] Ion 世界地形加载失败，回退椭球面', e)
    }
  }

  const v = new Cesium.Viewer(container.value, {
    animation: false,
    timeline: false,
    baseLayerPicker: false,
    fullscreenButton: false,
    homeButton: false,
    geocoder: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    selectionIndicator: false,
    infoBox: false,
    terrain,
    baseLayer: false,
  })
  viewer.value = v
  v.scene.globe.enableLighting = true
  v.shadowMap.enabled = true
  v.scene.globe.depthTestAgainstTerrain = true
  // 机位飞行用 1.6m 人眼高度，默认碰撞检测会把相机抬离地面，破坏视角
  v.scene.screenSpaceCameraController.enableCollisionDetection = false
  applyRenderQuality(v)

  await setupImagery(v, props.baseMap ?? 'tdt')
  await waitForTerrainProvider(v)
  await sampleGround(v)
  buildPagoda(v)
  addSpotMarkers(v)
  applyClock()
  setInitialView(v)

  handler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas)
  handler.setInputAction((evt: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
    const picked = v.scene.pick(evt.position)
    const id = (picked?.id?.id as string) || ''
    if (id.startsWith('spot-')) emit('select-spot', id.slice(5))
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

  ready.value = true
})

onUnmounted(() => {
  handler?.destroy()
  viewer.value?.destroy()
})

watch(() => [props.dateISO, props.timeMinutes], () => {
  if (ready.value) applyClock()
})

watch(
  () => props.baseMap,
  (type) => {
    if (ready.value && viewer.value && type) void setupImagery(viewer.value, type)
  },
)

watch(
  () => [props.selectedSpotId, props.showSightline],
  () => {
    if (!ready.value || !viewer.value) return
    refreshSightlines(viewer.value)
  },
)

/* ------------------------------------------------------------------ */
/* 渲染质量：用稳定 API 提升地面细腻度                                  */
/* ------------------------------------------------------------------ */
function applyRenderQuality(v: Cesium.Viewer) {
  // 高分屏按设备像素比渲染（封顶 2 防止 4K 屏性能塌陷），消除高分屏"软糊"
  v.resolutionScale = Math.min(window.devicePixelRatio || 1, 2)
  // Globe LOD：默认 2 偏粗，调到 1 后同一视距加载更密的地形网格 + 更细影像瓦片，
  // 贴地斜视时影像贴附更锐利（显卡/流量换清晰度）
  v.scene.globe.maximumScreenSpaceError = 1
  // 增大瓦片缓存，飞行/拖时间轴回看时不再重新拉取糊瓦片
  v.scene.globe.tileCacheSize = 1000
  // 飞行途中预加载目的地瓦片，减少落地后的糊瓦片（部分版本挂在 cameraController 上）
  const ssc = v.scene.screenSpaceCameraController as unknown as { preloadFlightDestinations?: boolean }
  if ('preloadFlightDestinations' in ssc) ssc.preloadFlightDestinations = true
  ;(v.scene.globe as unknown as { preloadFlightDestinations?: boolean }).preloadFlightDestinations = true
  // 关 FXAA：默认快速近似抗锯齿会把地面纹理整体抹糊；改用 MSAA（若驱动支持）
  v.scene.postProcessStages.fxaa.enabled = false
  try {
    v.scene.msaaSamples = 2
  } catch {
    /* 旧驱动/WebGL2 不可用时忽略 */
  }
  // 贴地斜视时远处地面会被雾效洗白，本场景范围仅几百米，关闭更通透可读
  v.scene.fog.enabled = false
}

/** 每个影像层都开满各向异性过滤：斜视角度下地面纹理不会被双线性过滤糊成一片 */
function tuneLayer(v: Cesium.Viewer, layer: Cesium.ImageryLayer) {
  const ctx = (v.scene as unknown as { context?: { maximumTextureFilteringAnisotropy: number } }).context
  const maxAniso = ctx?.maximumTextureFilteringAnisotropy ?? 8
  ;(layer as unknown as { maximumAnisotropy: number }).maximumAnisotropy = maxAniso
}

/* ------------------------------------------------------------------ */
/* 底图切换：天地图影像(+注记) / Bing 卫星 / 天地图矢量；失败降级 OSM    */
/* 高德直连瓦片（webrd/webst）会被浏览器 ORB 拦截，禁止再用              */
/* ------------------------------------------------------------------ */
let imagerySeq = 0

function tdtWmts(layer: string) {
  const tk = import.meta.env.VITE_TIANDITU_KEY
  return new Cesium.WebMapTileServiceImageryProvider({
    url: `https://t0.tianditu.gov.cn/${layer}_w/wmts?service=wmts&request=GetTile&version=1.0.0&layer=${layer}&style=default&tileMatrixSet=w&format=tiles&tileMatrix={TileMatrix}&tileRow={TileRow}&tileCol={TileCol}&tk=${tk}`,
    layer,
    style: 'default',
    tileMatrixSetID: 'w',
    format: 'tiles',
    maximumLevel: 18,
  })
}

async function setupImagery(v: Cesium.Viewer, type: 'tdt' | 'bing' | 'vec') {
  const seq = ++imagerySeq
  const layers = v.imageryLayers
  layers.removeAll()

  const addFallbackOSM = () => {
    if (seq !== imagerySeq) return
    layers.removeAll()
    tuneLayer(v, layers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
    ))
    console.warn('[PhotoSpot3D] 影像源加载失败，已降级为 OSM')
  }

  try {
    if (type === 'bing') {
      // Bing 全球影像走 Ion token，城区分辨率可与天地图互为对照
      const provider = await Cesium.createWorldImageryAsync({
        style: Cesium.IonWorldImageryStyle.AERIAL,
      })
      if (seq !== imagerySeq) return
      tuneLayer(v, layers.addImageryProvider(provider))
      return
    }

    const tk = import.meta.env.VITE_TIANDITU_KEY
    if (!tk) throw new Error('缺少 VITE_TIANDITU_KEY')

    if (type === 'vec') {
      tuneLayer(v, layers.addImageryProvider(tdtWmts('vec')))
      tuneLayer(v, layers.addImageryProvider(tdtWmts('cva')))
      return
    }

    // 默认：天地图影像 + 中文注记
    const imgLayer = layers.addImageryProvider(tdtWmts('img'))
    tuneLayer(v, imgLayer)
    imgLayer.errorEvent.addEventListener(addFallbackOSM)
    const ciaLayer = layers.addImageryProvider(tdtWmts('cia'))
    tuneLayer(v, ciaLayer)
    // 注记失败不降级（影像本身可用，仅静默）
    ciaLayer.errorEvent.addEventListener(() => {})
  } catch (e) {
    console.warn('[PhotoSpot3D] 底图初始化失败：', e)
    addFallbackOSM()
  }
}

/** 等待 Viewer 完成地形 provider 装配（椭球 provider 会立即就绪，最多等 8s） */
function waitForTerrainProvider(v: Cesium.Viewer): Promise<void> {
  return new Promise(resolve => {
    if (v.terrainProvider) return resolve()
    let n = 0
    const timer = window.setInterval(() => {
      if (v.terrainProvider || ++n > 40) {
        window.clearInterval(timer)
        resolve()
      }
    }, 200)
  })
}

/* ------------------------------------------------------------------ */
/* 地面高程采样（无 token / 失败 → 0）                                 */
/* ------------------------------------------------------------------ */
async function sampleGround(v: Cesium.Viewer) {
  const b = props.site.building
  const pts: { key: string; carto: Cesium.Cartographic }[] = [
    { key: 'center', carto: Cesium.Cartographic.fromDegrees(b.center.lng, b.center.lat) },
    ...props.site.spots.map(s => ({ key: s.id, carto: Cesium.Cartographic.fromDegrees(s.lng, s.lat) })),
  ]
  try {
    if (!v.terrainProvider) throw new Error('terrainProvider unavailable')
    await Cesium.sampleTerrainMostDetailed(v.terrainProvider, pts.map(p => p.carto))
    pts.forEach(p => groundH.set(p.key, p.carto.height || 0))
  } catch (e) {
    console.warn('[PhotoSpot3D] 地形采样失败，按椭球面构建', e)
    pts.forEach(p => groundH.set(p.key, 0))
  }
}

/* ------------------------------------------------------------------ */
/* 八角塔身参数化                                                      */
/* ------------------------------------------------------------------ */
const BODY_COLOR = Cesium.Color.fromCssColorString('#8a6a45').withAlpha(0.92)
const EAVE_COLOR = Cesium.Color.fromCssColorString('#463b30')
const PLATFORM_COLOR = Cesium.Color.fromCssColorString('#9b9385')

function ringPoints(cx: number, cy: number, radiusM: number, rotationDeg: number, sides: number, heightM: number) {
  const mLat = 111320
  const mLon = 111320 * Math.cos(cy * Math.PI / 180)
  const pts: Cesium.Cartesian3[] = []
  for (let i = 0; i < sides; i++) {
    const theta = (rotationDeg + (360 / sides) * i) * RAD // 自正北顺时针
    const e = radiusM * Math.sin(theta)
    const n = radiusM * Math.cos(theta)
    pts.push(Cesium.Cartesian3.fromDegrees(cx + e / mLon, cy + n / mLat, heightM))
  }
  return pts
}

function buildPagoda(v: Cesium.Viewer) {
  const b = props.site.building
  const ground = groundH.get('center') ?? 0
  const centerCart = Cesium.Cartesian3.fromDegrees(b.center.lng, b.center.lat, ground)
  enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerCart)

  // 台基
  v.entities.add({
    id: 'pagoda-platform',
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(
        ringPoints(b.center.lng, b.center.lat, b.platform.diameterM / 2, b.rotationDeg, b.sides, ground + b.platform.heightM),
      ),
      height: ground,
      extrudedHeight: ground + b.platform.heightM,
      material: PLATFORM_COLOR,
      shadows: Cesium.ShadowMode.ENABLED,
    },
  })

  // 五明层（层间暗带表现檐部）
  let base = ground + b.platform.heightM
  b.tiers.forEach((tier, idx) => {
    const radius = tier.diameterM / 2
    v.entities.add({
      id: `pagoda-tier-${idx}`,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(
          ringPoints(b.center.lng, b.center.lat, radius, b.rotationDeg, b.sides, base + tier.heightM),
        ),
        height: base,
        extrudedHeight: base + tier.heightM,
        material: BODY_COLOR,
        shadows: Cesium.ShadowMode.ENABLED,
      },
    })
    // 檐带（外挑深色薄环）
    v.entities.add({
      id: `pagoda-eave-${idx}`,
      polygon: {
        hierarchy: new Cesium.PolygonHierarchy(
          ringPoints(b.center.lng, b.center.lat, radius + tier.eaveOverhangM, b.rotationDeg, b.sides, base + tier.heightM),
        ),
        height: base + tier.heightM - 0.5,
        extrudedHeight: base + tier.heightM,
        material: EAVE_COLOR,
        shadows: Cesium.ShadowMode.ENABLED,
      },
    })
    base += tier.heightM
  })

  // 塔刹
  v.entities.add({
    id: 'pagoda-spire',
    position: Cesium.Cartesian3.fromDegrees(b.center.lng, b.center.lat, base + b.spireHeightM / 2),
    cylinder: {
      length: b.spireHeightM,
      topRadius: 0.1,
      bottomRadius: 1.1,
      material: Cesium.Color.fromCssColorString('#3c3a36'),
      shadows: Cesium.ShadowMode.ENABLED,
    },
  })
}

/* ------------------------------------------------------------------ */
/* 机位标记                                                            */
/* ------------------------------------------------------------------ */
const markerCanvas = document.createElement('canvas')

function markerImage(index: number, selected: boolean): string {
  const size = 40
  markerCanvas.width = size + 8
  markerCanvas.height = size + 12
  const ctx = markerCanvas.getContext('2d')!
  ctx.clearRect(0, 0, size + 8, size + 12)
  ctx.beginPath()
  ctx.arc(size / 2 + 4, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = selected ? '#d43c2f' : '#c8963e'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(index), size / 2 + 4, size / 2)
  ctx.beginPath()
  ctx.moveTo(size / 2, size - 2)
  ctx.lineTo(size / 2 + 4, size + 10)
  ctx.lineTo(size / 2 + 8, size - 2)
  ctx.fillStyle = selected ? '#d43c2f' : '#c8963e'
  ctx.fill()
  return markerCanvas.toDataURL()
}

function addSpotMarkers(v: Cesium.Viewer) {
  props.site.spots.forEach((spot, idx) => {
    const selected = spot.id === props.selectedSpotId
    v.entities.add({
      id: `spot-${spot.id}`,
      position: Cesium.Cartesian3.fromDegrees(spot.lng, spot.lat),
      billboard: {
        image: markerImage(idx + 1, selected),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        scale: 0.85,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: spot.name,
        font: '13px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -58),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      properties: { spotId: spot.id },
    })
  })
}

/** 外部切换选中时刷新标记样式 */
function refreshMarkerStyle(v: Cesium.Viewer) {
  props.site.spots.forEach((spot, idx) => {
    const ent = v.entities.getById(`spot-${spot.id}`)
    if (ent?.billboard) ent.billboard.image = new Cesium.ConstantProperty(markerImage(idx + 1, spot.id === props.selectedSpotId))
  })
}

/* ------------------------------------------------------------------ */
/* 时钟（北京时间 → UTC → JulianDate）                                 */
/* ------------------------------------------------------------------ */
function applyClock() {
  const v = viewer.value
  if (!v) return
  const [y, m, d] = props.dateISO.split('-').map(Number)
  const hh = Math.floor(props.timeMinutes / 60)
  const mm = props.timeMinutes % 60
  const utc = new Date(Date.UTC(y, m - 1, d, hh - 8, mm))
  v.clock.currentTime = Cesium.JulianDate.fromDate(utc)
  v.clock.shouldAnimate = false
}

/* ------------------------------------------------------------------ */
/* 初始视角 & 飞行定位                                                 */
/* ------------------------------------------------------------------ */
function setInitialView(v: Cesium.Viewer) {
  const b = props.site.building
  v.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(b.center.lng - 0.0022, b.center.lat - 0.0028, (groundH.get('center') ?? 0) + 420),
    orientation: {
      heading: 35 * RAD,
      pitch: -32 * RAD,
      roll: 0,
    },
  })
}

function enuToWorld(e: number, n: number, u: number): Cesium.Cartesian3 {
  return Cesium.Matrix4.multiplyByPoint(enuMatrix!, new Cesium.Cartesian3(e, n, u), new Cesium.Cartesian3())
}

function worldToEnu(p: Cesium.Cartesian3): Cesium.Cartesian3 {
  return Cesium.Matrix4.multiplyByPoint(Cesium.Matrix4.inverse(enuMatrix!, new Cesium.Matrix4()), p, new Cesium.Cartesian3())
}

function flyToSpot(v: Cesium.Viewer, spot: PhotoSpot) {
  const eyeGround = groundH.get(spot.id) ?? 0
  const bearing = (spot.bearingDeg ?? 0) * RAD
  // 相机放在机位点略后撤 6m，人眼高 1.6m
  const de = -6 * Math.sin(bearing)
  const dn = -6 * Math.cos(bearing)
  const mLon = 111320 * Math.cos(spot.lat * Math.PI / 180)
  v.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(spot.lng + de / mLon, spot.lat + dn / 111320, eyeGround + 1.7),
    orientation: { heading: bearing, pitch: -4 * RAD, roll: 0 },
    duration: 1.4,
  })
}

/* ------------------------------------------------------------------ */
/* 视线通廊分析                                                        */
/* ------------------------------------------------------------------ */
interface Blocker {
  name: string
  radius: number
  z0: number
  z1: number
}

/** 线段与垂直圆柱（轴在 ENU 原点）是否相交于 z 范围内 */
function segmentHitsCylinder(
  a: Cesium.Cartesian3,
  d: Cesium.Cartesian3,
  radius: number,
  z0: number,
  z1: number,
): boolean {
  const A = d.x * d.x + d.y * d.y
  if (A < 1e-9) return false
  const B = 2 * (a.x * d.x + a.y * d.y)
  const C = a.x * a.x + a.y * a.y - radius * radius
  const disc = B * B - 4 * A * C
  if (disc < 0) return false
  const sq = Math.sqrt(disc)
  for (const t of [(-B - sq) / (2 * A), (-B + sq) / (2 * A)]) {
    if (t > 0.02 && t < 0.98) {
      const z = a.z + t * d.z
      if (z >= z0 && z <= z1) return true
    }
  }
  return false
}

interface SightResult {
  label: string
  targetHeight: number
  visible: boolean
  blocker: string | null
  end: Cesium.Cartesian3
}

function analyzeSight(v: Cesium.Viewer, spot: PhotoSpot): SightResult[] {
  const b = props.site.building
  const eye = worldToEnu(Cesium.Cartesian3.fromDegrees(spot.lng, spot.lat, (groundH.get(spot.id) ?? 0) + 1.6))

  // 遮挡物：台基 + 各层（含檐部外挑）
  const ground = groundH.get('center') ?? 0
  const blockers: Blocker[] = [
    { name: '台基', radius: b.platform.diameterM / 2, z0: ground, z1: ground + b.platform.heightM },
  ]
  let z = ground + b.platform.heightM
  b.tiers.forEach((tier, i) => {
    blockers.push({ name: `${tier.name}檐部`, radius: tier.diameterM / 2 + tier.eaveOverhangM, z0: z, z1: z + tier.heightM })
    z += tier.heightM
  })
  // 转成相对眼点的 ENU 高度（世界 ENU 与眼点 ENU 仅垂直平移：减去眼点 z 基准）
  blockers.forEach(bl => { bl.z0 -= ground; bl.z1 -= ground })

  // 目标：木塔被摄面 3 个高度（该层半径表面、朝向机位方向）
  const targets = [
    { label: '一层檐口', targetHeight: ground + b.platform.heightM + b.tiers[0].heightM - 1 },
    { label: '三层塔身', targetHeight: ground + b.platform.heightM + b.tiers[0].heightM + b.tiers[1].heightM + b.tiers[2].heightM * 0.5 },
    { label: '五层/塔刹下', targetHeight: ground + b.platform.heightM + b.tiers.reduce((s, t) => s + t.heightM, 0) - 2 },
  ]
  const tierRadiusAt = (h: number) => {
    let base = ground + b.platform.heightM
    for (const t of b.tiers) {
      if (h <= base + t.heightM) return t.diameterM / 2 + t.eaveOverhangM
      base += t.heightM
    }
    return b.tiers[b.tiers.length - 1].diameterM / 2
  }

  const distHoriz = Math.hypot(eye.x, eye.y)
  const results: SightResult[] = targets.map(tg => {
    const r = tierRadiusAt(tg.targetHeight)
    const tx = (eye.x / distHoriz) * r
    const ty = (eye.y / distHoriz) * r
    const end = new Cesium.Cartesian3(tx, ty, tg.targetHeight - ground)
    const dir = Cesium.Cartesian3.subtract(end, eye, new Cesium.Cartesian3())

    // 体量遮挡（不含目标自身所在层：目标点位于该层表面，允许 t→1）
    let blocker: string | null = null
    for (const bl of blockers) {
      if (tg.targetHeight - ground >= bl.z0 - 0.5 && tg.targetHeight - ground <= bl.z1 + 0.5) continue
      if (segmentHitsCylinder(eye, dir, bl.radius, bl.z0, bl.z1)) { blocker = bl.name; break }
    }

    // 地形遮挡：从眼点向目标发射射线，地形交点更近则遮挡
    if (!blocker) {
      const eyeWorld = enuToWorld(eye.x, eye.y, eye.z)
      const endWorld = enuToWorld(end.x, end.y, end.z)
      const rayDir = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(endWorld, eyeWorld, new Cesium.Cartesian3()), new Cesium.Cartesian3())
      const hit = v.scene.globe.pick(new Cesium.Ray(eyeWorld, rayDir), v.scene)
      if (hit) {
        const hitDist = Cesium.Cartesian3.distance(eyeWorld, hit)
        const targetDist = Cesium.Cartesian3.distance(eyeWorld, endWorld)
        if (hitDist < targetDist - 2) blocker = '地形起伏'
      }
    }

    return { label: tg.label, targetHeight: tg.targetHeight, visible: !blocker, blocker, end: enuToWorld(end.x, end.y, end.z) }
  })

  return results
}

function clearSightlines(v: Cesium.Viewer) {
  sightlineIds.forEach(id => v.entities.removeById(id))
  sightlineIds = []
}

function refreshSightlines(v: Cesium.Viewer) {
  refreshMarkerStyle(v)
  clearSightlines(v)
  const spot = props.site.spots.find(s => s.id === props.selectedSpotId)
  if (spot) flyToSpot(v, spot)
  if (!spot || !props.showSightline) return

  const eyeWorld = Cesium.Cartesian3.fromDegrees(spot.lng, spot.lat, (groundH.get(spot.id) ?? 0) + 1.6)
  const results = analyzeSight(v, spot)
  results.forEach((r, i) => {
    const id = `sight-${spot.id}-${i}`
    v.entities.add({
      id,
      polyline: {
        positions: [eyeWorld, r.end],
        width: 3,
        material: r.visible ? Cesium.Color.fromCssColorString('#3ddc75') : Cesium.Color.fromCssColorString('#ff5a4e'),
        arcType: Cesium.ArcType.NONE,
      },
    })
    sightlineIds.push(id)
    const eid = `sight-end-${spot.id}-${i}`
    v.entities.add({
      id: eid,
      position: r.end,
      point: {
        pixelSize: 9,
        color: r.visible ? Cesium.Color.fromCssColorString('#3ddc75') : Cesium.Color.fromCssColorString('#ff5a4e'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
      },
      label: {
        text: `${r.label}：${r.visible ? '可见' : `被${r.blocker}遮挡`}`,
        font: '13px sans-serif',
        fillColor: r.visible ? Cesium.Color.fromCssColorString('#1f7a3d') : Cesium.Color.fromCssColorString('#b33024'),
        showBackground: true,
        backgroundColor: Cesium.Color.WHITE.withAlpha(0.85),
        pixelOffset: new Cesium.Cartesian2(12, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    })
    sightlineIds.push(eid)
  })
}
</script>

<template>
  <div ref="container" class="photo-spot-3d"></div>
</template>

<style scoped>
.photo-spot-3d {
  width: 100%;
  height: 100%;
}
.photo-spot-3d :deep(.cesium-viewer-bottom) {
  display: none;
}
</style>
