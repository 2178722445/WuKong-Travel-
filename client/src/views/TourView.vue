<script setup lang="ts">
import OLViewer from '../components/openlayers/OLViewer.vue'
import { demoLocations } from '../data/demo'
import { heritageHotspots, tourStops, yingxianAssets, YINGXIAN_ID } from '../data/yingxian'
import ImageLightbox from '../components/ImageLightbox.vue'

const location = demoLocations.find(item => item.id === YINGXIAN_ID)!
const routePath = [
  { lng: 113.18175, lat: 39.56475 }, { lng: 113.18192, lat: 39.56502 },
  { lng: 113.18205, lat: 39.56526 }, { lng: 113.1819, lat: 39.56548 },
]
</script>

<template>
  <div class="content-page">
    <header><p>应县木塔 · 怎么逛</p><h1>先认轮廓，再近看结构</h1><span>按南门进入后的自然顺序，把一座高塔拆成几段容易辨认的观察。</span></header>
    <section class="arrival">
      <div><h2>到达与入园</h2><p>地图标注景区位置和一条简化参观顺序。路线仅作现场阅读参考，以开放区域和工作人员引导为准。</p><div class="ol-wrap"><OLViewer :locations="[location]" :selected-location-id="YINGXIAN_ID" :route-path="routePath" /></div></div>
      <ImageLightbox class="board-image" :src="yingxianAssets.routeBoard" alt="应县木塔景区路线图" />
    </section>
    <section class="sequence"><h2>参观顺序</h2><div><article v-for="stop in tourStops" :key="stop.index"><b>{{ stop.index }}</b><h3>{{ stop.name }}</h3><p>{{ stop.detail }}</p></article></div></section>
    <section class="hotspots"><div class="section-copy"><p>到场重点</p><h2>七分钟看懂木塔外观</h2></div><div class="hotspot-grid"><article v-for="item in heritageHotspots" :key="item.name"><h3>{{ item.name }}</h3><p>{{ item.note }}</p></article></div></section>
    <section class="references"><ImageLightbox :src="yingxianAssets.introBoard" alt="应县木塔介绍牌" /><div><p>现场参考</p><h2>先读介绍牌，再抬头找对应位置</h2><span>介绍牌和景区路线照片用于内部梳理参观信息，实际开放安排以现场公告为准。</span></div></section>
  </div>
</template>

<style scoped>
.content-page{height:100%;overflow-y:auto;background:#f6f1e8;color:#2b211b}.content-page>header{padding:42px max(6vw,28px) 32px;background:#2c241e;color:#f5eadc}.content-page>header p,.section-copy p,.references p{color:#c65342;font-size:12px}.content-page h1{font:38px Georgia,'Songti SC',serif;margin:8px 0 10px}.content-page>header span{color:#cdbfb0}.arrival{display:grid;grid-template-columns:1.15fr .85fr;gap:24px;padding:34px max(6vw,28px)}.arrival h2,.sequence h2,.hotspots h2,.references h2{font:26px Georgia,'Songti SC',serif;margin:0 0 10px}.arrival p,.sequence p,.hotspots p,.references span{color:#67584d;line-height:1.75}.ol-wrap{height:330px;margin-top:18px;border:1px solid #cdbfae}.arrival :deep(.board-image){width:100%;height:410px}.sequence,.hotspots,.references{padding:34px max(6vw,28px);border-top:1px solid #d9cdbc}.sequence>div{display:grid;grid-template-columns:repeat(5,1fr);gap:1px;background:#d3c5b4}.sequence article,.hotspot-grid article{background:#fffdf8;padding:20px}.sequence article>b{color:#ad3b2d;font:20px Georgia,serif}.sequence h3,.hotspot-grid h3{margin:14px 0 7px}.hotspots{display:grid;grid-template-columns:260px 1fr;gap:28px;background:#ece2d4}.hotspot-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#d2c4b2}.references{display:grid;grid-template-columns:340px 1fr;align-items:center;gap:34px}.references :deep(.image-trigger){width:100%;height:300px}@media(max-width:850px){.arrival,.references{grid-template-columns:1fr}.sequence>div{grid-template-columns:1fr}.hotspots{grid-template-columns:1fr}.hotspot-grid{grid-template-columns:1fr 1fr}.arrival :deep(.board-image){height:280px}}
</style>
