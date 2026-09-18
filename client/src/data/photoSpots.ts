import type { PhotoSpotSite } from '../types'

/**
 * 机位光影模块数据（C 模块：机位推荐 + 日照/视线分析）
 *
 * 核实口径（2026-09-17）：
 * - 塔中心、八角轮廓、总高 67.31m 来自 OpenStreetMap way/362906644（© OpenStreetMap
 *   contributors, ODbL），8 节点外接直径约 33.7m，并已与天地图 z18 卫星影像目视核对一致；
 * - 机位坐标为在天地图卫星影像上按"开阔可站立、视线不被配殿/院墙遮挡"原则判读，
 *   未经现场踏勘，仍标 unverified；
 * - 各明层直径/层高为公开常识级估算（明五暗四），仅用于体量盒光影分析，
 *   需以陈明达《应县木塔》测绘资料逐层核对后才可改 verified；
 * - 经验拍摄时段为通用摄影常识，尚无游记/机位帖信源。
 */
const OSM_SOURCE = {
  title: 'OpenStreetMap way/362906644（© OpenStreetMap contributors, ODbL）',
  url: 'https://www.openstreetmap.org/way/362906644',
}
const TDT_IMAGERY_SOURCE = {
  title: '天地图卫星影像判读（2026-09-17，未现场踏勘）',
  url: null,
}

export const photoSpotSites: PhotoSpotSite[] = [
  {
    locationId: 3, // 应县木塔（佛宫寺释迦塔）
    building: {
      locationId: 3,
      name: '应县木塔',
      center: { lng: 113.181998, lat: 39.565265 },
      sides: 8,
      rotationDeg: 22.5,
      platform: { diameterM: 34, heightM: 2 },
      tiers: [
        { name: '一层（含檐部）', heightM: 12.5, diameterM: 33.7, eaveOverhangM: 1.7 },
        { name: '二层（含檐部）', heightM: 11.8, diameterM: 30.0, eaveOverhangM: 1.5 },
        { name: '三层（含檐部）', heightM: 11.2, diameterM: 26.5, eaveOverhangM: 1.4 },
        { name: '四层（含檐部）', heightM: 11.0, diameterM: 23.0, eaveOverhangM: 1.3 },
        { name: '五层（含檐部）', heightM: 10.8, diameterM: 20.0, eaveOverhangM: 1.2 },
      ],
      spireHeightM: 10.01,
      totalHeightM: 67.31,
      sources: [OSM_SOURCE, { title: '陈明达《应县木塔》测绘资料（各层数值待核对）', url: null }],
      status: 'unverified',
      updatedAt: '2026-09-17',
      note: '体量示意，非实测模型：塔中心/八角外接直径约33.7m/总高67.31m 源自 OSM 并经天地图影像核对；五个明层按正八边形轮廓拉伸，层高水平已包含平座/檐部估算，实际为明五暗四结构，仅用于日照阴影与视线通廊分析，不可作为建筑测绘依据。',
    },
    spots: [
      {
        id: 'yxmt-s1',
        locationId: 3,
        name: '正南山门中轴',
        lng: 113.181998,
        lat: 39.564277,
        bearingDeg: 0,
        heightM: 0,
        framing: '中轴甬道拍全塔正面，塔身在画面居中，两侧配殿形成对称框景',
        focalLength: '广角（约 24-35mm 全画幅等效）',
        experienceBestTime: '上午至中午正面顺光（通用摄影经验，具体时段待核实）',
        experienceSources: [],
        note: '影像判读位于南院中轴甬道，距塔约110m；甬道两侧为花坛树木，夏季枝叶可能入镜，冬季视野更开；未经现场确认。',
        status: 'unverified',
        updatedAt: '2026-09-17',
      },
      {
        id: 'yxmt-s2',
        locationId: 3,
        name: '西南环塔步道',
        lng: 113.181672,
        lat: 39.564996,
        bearingDeg: 45,
        heightM: 0,
        framing: '取西南-东北向，表现层层飞檐与斗拱出挑，避免正面过于平',
        focalLength: '标准变焦（约 35-70mm）',
        experienceBestTime: '下午侧光凸显飞檐层次（通用摄影经验，具体时段待核实）',
        experienceSources: [],
        note: '影像判读位于塔西南侧开阔铺装上，距塔约41m；未经现场确认。',
        status: 'unverified',
        updatedAt: '2026-09-17',
      },
      {
        id: 'yxmt-s3',
        locationId: 3,
        name: '北侧近距仰拍',
        lng: 113.181998,
        lat: 39.565642,
        bearingDeg: 180,
        heightM: 0,
        framing: '近距仰拍斗拱出挑与檐角，利用蓝天做背景',
        focalLength: '广角仰拍（约 16-24mm），注意透视变形',
        experienceBestTime: '白天蓝天仰拍；清晨人少（通用摄影经验，具体时段待核实）',
        experienceSources: [],
        note: '影像判读位于塔北侧铺装空地，距塔约42m，再北约40m有一层附属建筑；塔体目前禁止登塔，地面可达性需现场确认。',
        status: 'unverified',
        updatedAt: '2026-09-17',
      },
      {
        id: 'yxmt-s4',
        locationId: 3,
        name: '西侧环塔步道',
        lng: 113.181474,
        lat: 39.565265,
        bearingDeg: 90,
        heightM: 0,
        framing: '正西方向拍塔身侧面，檐柱与斗拱排列形成强韵律',
        focalLength: '标准（约 35-50mm）',
        experienceBestTime: '上午侧光（通用摄影经验，具体时段待核实）',
        experienceSources: [],
        note: '影像判读位于塔西侧铺装环道，距塔约45m，再西为院墙；未经现场确认。',
        status: 'unverified',
        updatedAt: '2026-09-17',
      },
      {
        id: 'yxmt-s5',
        locationId: 3,
        name: '东南环塔步道',
        lng: 113.182289,
        lat: 39.565041,
        bearingDeg: 315,
        heightM: 0,
        framing: '晨光中拍塔身东南面，侧顺光表现木构暖色与飞檐层次',
        focalLength: '标准变焦（约 35-70mm）',
        experienceBestTime: '日出后清晨顺光（通用摄影经验，具体日期方位待算法验证）',
        experienceSources: [],
        note: '影像判读位于塔东南侧铺装、东侧配殿以西，距塔约35m；位置贴近配殿角，现场需确认无围栏阻隔。',
        status: 'unverified',
        updatedAt: '2026-09-17',
      },
    ],
  },
]

export function getPhotoSpotSite(locationId: number): PhotoSpotSite | undefined {
  return photoSpotSites.find(site => site.locationId === locationId)
}

/** 数据信源（供页面统一展示署名） */
export const photoSpotDataSources = [OSM_SOURCE, TDT_IMAGERY_SOURCE]
