export interface User {
  id: number
  username: string
  email: string
  avatar: string
  role: string
  createdAt?: string
}

export interface Location {
  id: number
  name: string
  city: string
  district: string
  lng: number
  lat: number
  tags: string[]
  period: string
  description: string
  ticket: string
  hours: string
  bestSeason: string
  highlight: string
  images: string[]
  viewCount: number
  isFavorited?: boolean
  reviews?: Review[]
}

export interface Review {
  id: number
  userId: number
  locationId: number
  rating: number
  content: string
  images: string[]
  createdAt: string
  user: { id: number; username: string; avatar: string }
}

export interface Itinerary {
  id: number
  userId: number
  name: string
  startDate: string
  endDate: string
  createdAt: string
  days: ItineraryDay[]
}

export interface ItineraryDay {
  id: number
  itineraryId: number
  dayNumber: number
  locationIds: number[]
  note: string
}

export interface DashboardStats {
  userCount: number
  locationCount: number
  reviewCount: number
  itineraryCount: number
  topLocations: { id: number; name: string; city: string; viewCount: number }[]
  recentUsers: { id: number; username: string; createdAt: string }[]
}

export interface SpatialPathResult {
  path: { id: number; name: string; lng: number; lat: number }[]
  distance_m: number
  distance_km: number
  total_locations: number
}

/** 核实状态：verified 必须带来源与更新时间；unverified 一律按「待核实」展示 */
export type VerificationStatus = 'verified' | 'unverified'

export interface InfoSource {
  title: string
  url: string | null
}

/** 拍摄机位记录 */
export interface PhotoSpot {
  id: string
  /** 关联取景地总表 id（应县木塔 = 3） */
  locationId: number
  name: string
  lng: number
  lat: number
  /** 拍摄朝向：机位看向建筑的方位角（度，0=正北，顺时针）；无法确定时为 null */
  bearingDeg: number | null
  /** 机位离地高度（米），地面机位为 0 */
  heightM: number
  /** 构图建议 */
  framing: string
  /** 建议焦段 */
  focalLength: string
  /** 游记/摄影帖经验中的最佳时段；未核实时描述需自带「待核实」语义 */
  experienceBestTime: string | null
  /** 经验时段的信源；空数组 = 尚无信源 */
  experienceSources: InfoSource[]
  /** 可达性、拍摄限制等备注 */
  note: string
  status: VerificationStatus
  updatedAt: string | null
}

/** 体量盒单层参数（档位 1：轮廓拉伸，非精模） */
export interface BuildingTier {
  name: string
  /** 该层（含檐部）高度，米 */
  heightM: number
  /** 该层外接圆直径，米 */
  diameterM: number
  /** 屋檐外挑宽度，米 */
  eaveOverhangM: number
}

/** 建筑体量参数（参数化生成 Cesium 体量盒） */
export interface BuildingMassing {
  locationId: number
  name: string
  center: { lng: number; lat: number }
  /** 正多边形边数（木塔 = 8） */
  sides: number
  /** 形体旋转角（度，自正北顺时针），使檐面朝向正南 */
  rotationDeg: number
  /** 台基：直径与总高，米 */
  platform: { diameterM: number; heightM: number }
  /** 塔身各明层，自下而上 */
  tiers: BuildingTier[]
  /** 塔刹高度，米 */
  spireHeightM: number
  /** 含塔刹总高，米 */
  totalHeightM: number
  sources: InfoSource[]
  status: VerificationStatus
  updatedAt: string | null
  /** 保真度声明，避免体量盒被误认为实测模型 */
  note: string
}

/** 单个地点的机位光影数据包 */
export interface PhotoSpotSite {
  locationId: number
  building: BuildingMassing
  spots: PhotoSpot[]
}

export interface BufferResult {
  center: { lng: number; lat: number }
  radius_m: number
  radius_km: number
  geometry: any
  locations_in_buffer: { id: number; name: string; lng: number; lat: number; distance_m: number; distance_km: number }[]
}
