/**
 * 太阳位置与拍摄光质计算（确定性算法，无外部依赖）
 *
 * 采用 NOAA Solar Position Algorithm 近似式（精度约 ±0.1°，对摄影时段判断足够）：
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 *
 * 口径约定：
 * - 方位角 azimuth：自正北顺时针，0~360
 * - 高度角 elevation：地平为 0，天顶为 90；夜间为负
 * - 时间统一使用北京时间（UTC+8），与拍摄地实际行政时间一致
 */

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

export interface SunPosition {
  /** 方位角，自正北顺时针 0~360 */
  azimuth: number
  /** 高度角，度 */
  elevation: number
}

/** 儒略世纪数（TDT） */
function julianCentury(date: Date): number {
  return (julianDay(date) - 2451545.0) / 36525.0
}

function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5
}

/**
 * 计算给定时刻（北京时钟时间）、给定经纬度的太阳位置
 */
export function sunPosition(date: Date, lng: number, lat: number): SunPosition {
  const T = julianCentury(date)

  // 平黄经、平近点角
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T)
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T)

  // 中心方程
  const Mr = M * RAD
  const C =
    Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mr) * 0.000289

  const trueLon = L0 + C
  const omega = 125.04 - 1934.136 * T
  const appLon = trueLon - 0.00569 - 0.00478 * Math.sin(omega * RAD)

  // 黄赤交角
  const meanObliq =
    23 +
    (26 + ((21.448 - T * (46.815 + T * (0.00059 - T * 0.001813)))) / 60) / 60
  const obliq = meanObliq + 0.00256 * Math.cos(omega * RAD)

  // 太阳赤纬
  const decl =
    DEG *
    Math.asin(
      Math.sin(obliq * RAD) * Math.sin(appLon * RAD),
    )

  // 均时差（分钟）
  const y = Math.tan((obliq / 2) * RAD) ** 2
  const eqTime =
    4 *
    DEG *
    (y * Math.sin(2 * L0 * RAD) -
      2 * e * Math.sin(M * RAD) +
      4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) -
      0.5 * y * y * Math.sin(4 * L0 * RAD) -
      1.25 * e * e * Math.sin(2 * M * RAD))

  // 真太阳时（分钟）：NOAA 公式 tst = 本地钟面分钟 + 均时差 + 4*经度 - 60*时区；
  // 本地钟面分钟 = UTC分钟 + 时区*60，两项时区抵消，故直接用 UTC 分钟，不依赖运行机器时区
  const minutesOfDay =
    date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60
  const trueSolarTime = minutesOfDay + eqTime + 4 * lng

  // 时角，正午为 0，下午为正
  let hourAngle = trueSolarTime / 4 - 180
  if (hourAngle < -180) hourAngle += 360

  const cosZenith =
    Math.sin(lat * RAD) * Math.sin(decl * RAD) +
    Math.cos(lat * RAD) * Math.cos(decl * RAD) * Math.cos(hourAngle * RAD)
  const zenith = DEG * Math.acos(Math.min(1, Math.max(-1, cosZenith)))
  const elevation = 90 - zenith

  let az =
    DEG *
    Math.atan2(
      Math.sin(hourAngle * RAD),
      Math.cos(hourAngle * RAD) * Math.sin(lat * RAD) -
        Math.tan(decl * RAD) * Math.cos(lat * RAD),
    )
  // NOAA 原始 atan2 结果需加 180° 才是「自正北顺时针」的摄影常用方位角
  az = (az + 180 + 360) % 360

  return { azimuth: az, elevation }
}

export type LightQuality = '顺光' | '侧光' | '逆光' | '夜间'

/**
 * 评估某时刻对指定拍摄方向的光质
 * @param viewBearing 机位看向目标的方位角（正北顺时针）
 */
export function evaluateLight(
  sun: SunPosition,
  viewBearing: number,
): { quality: LightQuality; score: number } {
  if (sun.elevation < -0.833) return { quality: '夜间', score: 0 }

  // 太阳与「镜头背后方向」的夹角（-180~180）。0 = 太阳在拍摄者正背后、直射建筑被摄面
  const backBearing = (viewBearing + 180) % 360
  const diff = ((sun.azimuth - backBearing + 540) % 360) - 180
  const absDiff = Math.abs(diff)

  // 方位评分：顺光为 1，90°侧光为 0.5，180°逆光为 0
  const azScore = (1 + Math.cos(absDiff * RAD)) / 2

  // 高度评分：摄影黄金光约 10~45°，用梯形函数
  let elScore: number
  if (sun.elevation < 0) elScore = 0
  else if (sun.elevation < 10) elScore = sun.elevation / 10
  else if (sun.elevation <= 45) elScore = 1
  else elScore = Math.max(0, 1 - (sun.elevation - 45) / 45)

  const score = Math.round(azScore * elScore * 100) / 100

  let quality: LightQuality
  if (sun.elevation < 0) quality = '夜间'
  else if (absDiff <= 35) quality = '顺光'
  else if (absDiff <= 110) quality = '侧光'
  else quality = '逆光'

  return { quality, score }
}

export interface TimeSlot {
  time: string
  hour: number
  sun: SunPosition
  quality: LightQuality
  score: number
}

/**
 * 枚举指定日期 05:00-19:30 每半小时的光质（北京时间）
 */
export function daySlots(
  dateISO: string,
  lng: number,
  lat: number,
  viewBearing: number,
): TimeSlot[] {
  const slots: TimeSlot[] = []
  const [y, m, d] = dateISO.split('-').map(Number)
  for (let total = 5 * 60; total <= 19 * 60 + 30; total += 30) {
    const hh = Math.floor(total / 60)
    const mm = total % 60
    // 槽位时间为北京时间（UTC+8），直接构造等价 UTC 时刻，避免依赖运行机器时区
    const local = new Date(Date.UTC(y, m - 1, d, hh - 8, mm))
    const sun = sunPosition(local, lng, lat)
    const ev = evaluateLight(sun, viewBearing)
    slots.push({
      time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      hour: hh + mm / 60,
      sun,
      quality: ev.quality,
      score: ev.score,
    })
  }
  return slots
}

/**
 * 从半小时槽位中合并出推荐拍摄窗口（score >= 0.55 的连续槽位）
 */
export function bestWindows(slots: TimeSlot[]): { start: string; end: string; quality: LightQuality; avgScore: number }[] {
  const good = slots.map(s => ({ ...s, ok: s.score >= 0.55 && s.quality !== '夜间' }))
  const windows: { start: string; end: string; quality: LightQuality; avgScore: number }[] = []
  let run: typeof slots = []
  const flush = () => {
    if (run.length === 0) return
    const avg = run.reduce((a, s) => a + s.score, 0) / run.length
    // 以窗口内最高分槽位的光质命名
    const peak = run.reduce((a, s) => (s.score > a.score ? s : a), run[0])
    windows.push({
      start: run[0].time,
      end: run[run.length - 1].time,
      quality: peak.quality,
      avgScore: Math.round(avg * 100) / 100,
    })
    run = []
  }
  for (const s of good) {
    if (s.ok) run.push(s)
    else flush()
  }
  flush()
  return windows
}
