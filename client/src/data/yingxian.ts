export const YINGXIAN_ID = 3

export const yingxianAssets = {
  cover: '/images/yingxian/northwest-view.jpg',
  routeBoard: '/images/yingxian/route-board.jpg',
  introBoard: '/images/yingxian/intro-board.jpg',
  gameScene: '/images/yingxian/game-scene.png',
  structureReference: '/images/yingxian/structure-reference.jpg',
}

export const photoViews = [
  { id: 'south', name: '正南近景', image: '/images/yingxian/south-close.jpg', area: '南门内中轴附近', direction: '向北', framing: '贴近中轴仰拍，突出塔身逐层收分。' },
  { id: 'south-leaves', name: '南侧树影', image: '/images/yingxian/south-leaves.jpg', area: '南侧树下步道', direction: '向北', framing: '用枝叶压住画面边缘，保留塔刹完整轮廓。' },
  { id: 'southeast', name: '东南牌坊', image: '/images/yingxian/southeast-gate.jpg', area: '南门木牌坊下', direction: '向西北', framing: '借牌坊形成前景框架，交代进入景区的空间层次。' },
  { id: 'southwest', name: '西南拱门', image: '/images/yingxian/southwest-arch.jpg', area: '西南侧拱门后', direction: '向东北', framing: '用门洞遮挡部分塔身，形成由暗到明的纵深。' },
  { id: 'north', name: '正北近景', image: '/images/yingxian/north-close.jpg', area: '塔北侧步道', direction: '向南', framing: '避开南侧主客流，从背面观察檐层和塔刹。' },
] as const

export const tourStops = [
  { index: '01', name: '南门与台基', detail: '从南门进入，先看台基与塔身的尺度关系。' },
  { index: '02', name: '外槽柱网', detail: '沿外圈缓行，观察首层立柱、门窗与八角平面。' },
  { index: '03', name: '五层六檐', detail: '退到开阔处，从下向上辨认五个明层与六重屋檐。' },
  { index: '04', name: '斗拱与匾额', detail: '在允许停留的位置观察铺作层次和历代题匾。' },
  { index: '05', name: '北侧回望', detail: '绕至北侧回望塔身，补看不同光线下的轮廓。' },
]

export const heritageHotspots = [
  { name: '塔刹', note: '位于塔顶，是完整轮廓最醒目的收束点。' },
  { name: '五层六檐', note: '五个明层之外还有暗层，外观呈现六重屋檐。' },
  { name: '斗拱', note: '各层檐下铺作形态丰富，是近距离观察重点。' },
  { name: '历代匾额', note: '不同年代题匾叠加在塔身立面上。' },
  { name: '外槽柱网', note: '首层外圈立柱帮助理解八角平面与结构节奏。' },
  { name: '入口与台基', note: '从入口到台基的高差最能建立建筑尺度感。' },
]

export const practicalItems = [
  { label: '开放时间', value: '以景区当日公告为准，节假日可能调整。' },
  { label: '门票与预约', value: '出发前通过官方渠道核对票价、预约与限流规则。' },
  { label: '到达方式', value: '可先到应县县城，再换乘当地交通前往佛宫寺景区。' },
  { label: '拍摄规定', value: '塔内及文物区域是否允许拍摄、闪光灯和三脚架，以现场标识为准。' },
]

export const assetRights = [
  { asset: '/images/brand-avatar.jpg', status: '待核权', usage: 'internal-demo' },
  ...Object.values(yingxianAssets).map(asset => ({ asset, status: '待核权', usage: 'internal-demo' })),
  ...photoViews.map(item => ({ asset: item.image, status: '待核权', usage: 'internal-demo' })),
]
