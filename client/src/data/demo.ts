import type { Location } from '../types'

const rawLocations = [
  [1, '云冈石窟', '大同市', '云冈区', 113.13, 40.11, '石窟造像'], [2, '悬空寺', '大同市', '浑源县', 113.714, 39.659, '木构建筑'],
  [3, '应县木塔', '朔州市', '应县', 113.182, 39.565, '辽代木构'], [4, '五台山', '忻州市', '五台县', 113.589, 39.008, '寺院群'],
  [5, '佛光寺', '忻州市', '五台县', 113.143, 38.878, '唐代木构'], [6, '南禅寺', '忻州市', '五台县', 113.11, 38.766, '唐代木构'],
  [7, '华严寺', '大同市', '平城区', 113.29, 40.091, '辽金建筑'], [8, '善化寺', '大同市', '平城区', 113.297, 40.086, '辽金建筑'],
  [9, '晋祠', '太原市', '晋源区', 112.437, 37.708, '祠堂园林'], [10, '平遥古城', '晋中市', '平遥县', 112.196, 37.201, '明清古城'],
  [11, '双林寺', '晋中市', '平遥县', 112.181, 37.176, '明代彩塑'], [12, '镇国寺', '晋中市', '平遥县', 112.244, 37.282, '五代木构'],
  [13, '广胜寺', '临汾市', '洪洞县', 111.788, 36.303, '元代壁画'], [14, '小西天', '临汾市', '隰县', 110.94, 36.69, '明代悬塑'],
  [15, '永乐宫', '运城市', '芮城县', 110.876, 34.724, '元代壁画'], [16, '观音堂', '长治市', '潞州区', 113.113, 36.195, '明代悬塑'],
  [17, '铁佛寺', '临汾市', '尧都区', 111.52, 36.08, '造像'], [18, '崇福寺', '朔州市', '朔城区', 112.43, 39.32, '金代木构'],
  [19, '资寿寺', '晋中市', '灵石县', 111.78, 36.84, '明代彩塑'], [20, '玉皇庙', '晋城市', '泽州县', 112.9, 35.56, '二十八宿彩塑'],
  [21, '青莲寺', '晋城市', '泽州县', 112.88, 35.49, '唐宋彩塑'], [22, '崇庆寺', '长治市', '长子县', 112.88, 36.12, '宋代彩塑'],
  [23, '法兴寺', '长治市', '长子县', 112.91, 36.18, '宋代彩塑'], [24, '开化寺', '晋城市', '高平市', 113.0, 35.75, '宋代壁画'],
  [25, '大云院', '长治市', '平顺县', 113.44, 36.24, '五代木构'], [26, '龙门寺', '长治市', '平顺县', 113.39, 36.31, '历代木构'],
  [27, '福胜寺', '临汾市', '新绛县', 111.22, 35.62, '元代彩塑'],
] as const

export const demoLocations: Location[] = rawLocations.map(([id, name, city, district, lng, lat, tag]) => ({
  id, name, city, district, lng, lat, tags: [tag, '山西古建'], period: tag.slice(0, 2),
  description: `${name}是山西古建与文物艺术的重要实例。`, ticket: '以现场公示为准', hours: '08:30-17:30', bestSeason: '4月-10月',
  highlight: tag, images: [], viewCount: 800 + id * 137,
}))

export type EntryStatus = '草稿' | '待核查' | '已核查' | '已发布'
export type SourceLevel = 'S' | 'A' | 'B' | 'C'
export type MatchLevel = '已确认' | '高度相似' | '参考元素'
export type Entry = {
  id: number; title: string; gameScene: string; gameCategory: string; targetName: string; targetType: string; dynasty: string; locationId: number
  summary: string; valuePoints: string[]; terms: string[]; status: EntryStatus; credibility: number; matchLevel: MatchLevel; saved: boolean
  images: { game: string; real: string; license: 'placeholder' | 'official' | 'cc-by' }
  sources: { level: SourceLevel; title: string; type: string }[]
}

const scenes = [
  ['小西天主殿群像', '大雄宝殿悬塑群', '悬塑', '明', '悬塑不是贴在墙上的平面装饰，而是由骨架、泥胎与彩绘共同构成的立体叙事空间。', ['满壁悬塑的层次关系', '主尊与胁侍的空间秩序', '俯视视角下的群像节奏'], ['悬塑', '背光', '金柱']],
  ['极乐谷金色佛国', '极乐世界悬塑', '悬塑', '明', '游戏以更强烈的金色光影重组现实悬塑的密集层次，保留了由中心向四周展开的视觉秩序。', ['中心构图', '云气纹塑造', '金碧设色'], ['悬塑', '藻井', '彩塑']],
  ['黄眉法相', '主尊造像', '彩塑', '明', '造型语言借用了明代寺观造像的量感与衣纹组织，但角色身份和叙事属于游戏再创作。', ['体量比例', '衣纹转折', '面部神态'], ['彩塑', '衣纹', '佛座']],
  ['殿内斗法空间', '大雄宝殿梁架', '木构', '明', '游戏镜头放大了梁架的压迫感，现实中梁、檩、柱共同承担屋顶荷载，形成清晰的受力层级。', ['梁架层次', '柱网节奏', '殿内尺度'], ['梁架', '金柱', '斗拱']],
  ['莲台与背光', '主尊背光装饰', '构件', '明', '背光既强调主尊身份，也把火焰、云气等纹样组织为视觉焦点。', ['火焰纹', '透雕层次', '中心轴线'], ['背光', '莲座', '透雕']],
  ['云海群像', '悬塑云气纹', '悬塑', '明', '连续的云气纹把独立塑像连接成整体，是现实悬塑营造天界空间的重要方法。', ['云气连接', '前后遮挡', '色彩过渡'], ['悬塑', '云气纹', '彩绘']],
  ['金刚护法形象', '护法彩塑', '彩塑', '明', '夸张动态、肌肉转折与怒目神态共同形成护法形象的力量感。', ['动态重心', '甲胄细节', '面部表情'], ['彩塑', '护法', '甲胄']],
  ['殿顶繁饰', '藻井与天花', '构件', '明', '顶部装饰把视线向中心聚拢，游戏进一步强化了旋转与纵深效果。', ['中心收束', '层级递进', '仰视观看'], ['藻井', '天花', '斗八']],
  ['佛国色彩', '悬塑彩绘', '彩塑', '明', '红、蓝、绿与金色在暗环境中形成强烈对比，修复和现场光线会影响今天看到的综合色调。', ['综合色调', '矿物色感', '光线影响'], ['彩绘', '贴金', '矿物颜料']],
  ['门殿过渡', '山门与院落轴线', '木构', '明', '从狭窄入口进入高密度主殿，是空间叙事由收束到展开的重要转换。', ['轴线关系', '入口尺度', '院落转折'], ['山门', '中轴线', '院落']],
  ['壁间千佛', '千佛悬塑单元', '悬塑', '明', '重复的小型造像形成宏大的数量感，个体差异又避免了机械复制。', ['重复与变化', '单元组合', '观看距离'], ['千佛', '悬塑', '模印']],
  ['金色空间照明', '殿内自然采光', '空间', '明', '现实殿内主要依赖门窗自然光，游戏为叙事加入戏剧化光源，两者的明暗逻辑并不相同。', ['侧向采光', '明暗适应', '禁止闪光'], ['采光', '门窗', '保护']],
] as const

export const entries: Entry[] = scenes.map((item, index) => ({
  id: index + 1, title: `${item[0]} × ${item[1]}`, gameScene: item[0], gameCategory: index % 3 === 0 ? '场景' : index % 3 === 1 ? '视觉元素' : '角色',
  targetName: item[1], targetType: item[2], dynasty: item[3], locationId: 14, summary: item[4], valuePoints: [...item[5]], terms: [...item[6]],
  status: index < 10 ? '已发布' : index === 10 ? '已核查' : '草稿', credibility: index < 11 ? 92 - index : 0,
  matchLevel: index < 2 ? '高度相似' : '参考元素', saved: index === 1,
  images: { game: '/screenshots/buffer.png', real: '/screenshots/home.png', license: 'placeholder' },
  sources: index < 11 ? [{ level: 'S', title: '全国重点文物保护单位公开资料（演示条目）', type: '官方文保资料' }, { level: 'A', title: '山西寺观悬塑研究资料（演示条目）', type: '学术出版物' }] : [],
}))

export const knowledgeTerms = [
  { term: '悬塑', category: '彩塑', definition: '依附墙体或构架向外挑出的立体彩塑组合，常以木骨、泥胎和彩绘构成。', related: ['彩塑', '背光'] },
  { term: '斗拱', category: '木构', definition: '位于柱与梁枋、屋檐之间的木构件组合，用于承托、传力与装饰。', related: ['梁架', '铺作'] },
  { term: '藻井', category: '构件', definition: '室内顶部向上凹进、层层收束的装饰性构造，常用于重要空间。', related: ['天花', '斗八'] },
  { term: '背光', category: '造像', definition: '设置在造像身后、强调神圣身份的装饰，常见火焰纹、云纹与透雕。', related: ['莲座', '透雕'] },
  { term: '金柱', category: '木构', definition: '位于建筑内部、处于檐柱以内的一圈柱子，与梁架和柱网组织密切相关。', related: ['檐柱', '梁架'] },
  { term: '彩塑', category: '造像', definition: '以泥等材料塑形并施彩的造像艺术，观看时需同时注意体量、衣纹、色彩与空间位置。', related: ['悬塑', '贴金'] },
]

export const practicalInfo = { locationId: 14, openTime: '08:00-18:00（以景区当日公示为准）', ticket: '35 元（演示数据）', reservation: '节假日建议提前预约', photoPolicy: '殿内禁闪光、禁用三脚架；具体以现场告示为准', transport: '临汾市区出发，经隰县县城前往', tips: '殿内光线较暗，先让眼睛适应；不要触碰塑像与建筑构件。', updatedAt: '2026-09-16' }

export const onsiteImages = {
  overview: {
    url: '/images/xiaoxitian/overview.jpg',
    title: '隰县小西天 上院下院',
    author: '三猎',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:%E9%9A%B0%E5%8E%BF%E5%B0%8F%E8%A5%BF%E5%A4%A9_%E4%B8%8A%E9%99%A2%E4%B8%8B%E9%99%A2.JPG',
  },
  approach: {
    url: '/images/xiaoxitian/approach.jpg',
    title: '隰县小西天 自下院仰望上院',
    author: '三猎',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:%E9%9A%B0%E5%8E%BF%E5%B0%8F%E8%A5%BF%E5%A4%A9_%E8%87%AA%E4%B8%8B%E9%99%A2%E4%BB%B0%E6%9C%9B%E4%B8%8A%E9%99%A2.JPG',
  },
  entrance: {
    url: '/images/xiaoxitian/entrance.jpg',
    title: '隰县小西天 道入西天',
    author: '三猎',
    license: 'CC BY-SA 4.0',
    source: 'https://commons.wikimedia.org/wiki/File:%E9%9A%B0%E5%8E%BF%E5%B0%8F%E8%A5%BF%E5%A4%A9_%E9%81%93%E5%85%A5%E8%A5%BF%E5%A4%A9.JPG',
  },
}

export const onsiteStops = entries.filter(item => item.status === '已发布').map((item, index) => ({
  order: index + 1,
  entryId: item.id,
  area: index < 2 ? '入口与下院' : index < 4 ? '上院入口' : '大雄宝殿',
  direction: index < 2
    ? '从入口沿参观通道进入下院，先用建筑轮廓确认方向。'
    : index < 4
      ? '由下院向上院行进，在进入殿区前对照屋顶与院落关系。'
      : '进入大雄宝殿后先适应暗光，再按现场开放区域寻找对应细节。',
  reference: index < 2 ? '入口题刻与上下院高差' : index < 4 ? '上院建筑轮廓与中轴关系' : '主尊、侧壁悬塑与梁柱位置',
  image: index % 3 === 0 ? onsiteImages.entrance.url : index % 3 === 1 ? onsiteImages.approach.url : onsiteImages.overview.url,
}))

export const themeRoutes = [
  { id: 1, name: '晋南彩塑朝圣线', theme: '彩塑 / 悬塑', days: 3, description: '从小西天的满堂悬塑，到观音堂与玉皇庙的群像叙事。', locationIds: [14, 16, 20] },
  { id: 2, name: '唐宋木构时间线', theme: '木构 / 营造', days: 4, description: '沿着现存早期木构，观察梁架、斗拱与空间尺度的变化。', locationIds: [6, 5, 25, 22] },
]
