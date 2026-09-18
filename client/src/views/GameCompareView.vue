<script setup lang="ts">
import { ref } from 'vue'
import { yingxianAssets } from '../data/yingxian'
import ImageLightbox from '../components/ImageLightbox.vue'

const points = [
  { name: '整体轮廓', top: '28%', left: '50%', note: '游戏画面保留了逐层收分的高塔剪影，但环境和尺度经过艺术化处理。' },
  { name: '檐层节奏', top: '50%', left: '35%', note: '密集出檐形成横向层次，是两幅画面最直观的视觉联系。' },
  { name: '塔刹', top: '13%', left: '51%', note: '顶部塔刹强化了垂直方向的收束，细部不能据截图作同一认定。' },
  { name: '比例关系', top: '68%', left: '62%', note: '现实木塔的柱网和台基建立真实尺度，游戏构图会重新调整比例。' },
]
const active = ref(0)
</script>

<template>
  <div class="compare-page">
    <header><p>应县木塔 · 游戏对照</p><h1>从轮廓开始看相似</h1><span>仅作视觉比较，不构成游戏官方取景确认。</span></header>
    <main>
      <section class="images"><figure><ImageLightbox :src="yingxianAssets.gameScene" alt="游戏画面中的塔" /><figcaption>游戏画面</figcaption></figure><figure><ImageLightbox :src="yingxianAssets.cover" alt="应县木塔实景" /><figcaption>现实建筑</figcaption></figure></section>
      <section class="analysis"><div class="structure"><ImageLightbox :src="yingxianAssets.structureReference" alt="应县木塔结构参考图" /><button v-for="(point,index) in points" :key="point.name" :style="{ top: point.top, left: point.left }" :class="{ active: active === index }" :title="point.name" @click="active = index">{{ index + 1 }}</button></div><div class="notes"><p>观察点 {{ active + 1 }}</p><h2>{{ points[active].name }}</h2><span>{{ points[active].note }}</span><ol><li v-for="(point,index) in points" :key="point.name" :class="{ active: active === index }" @click="active = index">{{ point.name }}</li></ol></div></section>
    </main>
  </div>
</template>

<style scoped>
.compare-page{height:100%;overflow-y:auto;background:#231d18;color:#f0e6d9}.compare-page>header{padding:36px max(6vw,28px) 28px;border-bottom:1px solid #4a3b31}.compare-page>header p,.notes>p{color:#d06151;font-size:12px}.compare-page h1{font:38px Georgia,'Songti SC',serif;margin:7px 0}.compare-page>header span{color:#baa99b}.compare-page main{padding:28px max(6vw,28px) 50px}.images{display:grid;grid-template-columns:1fr 1fr;gap:2px}.images figure{margin:0;position:relative;height:360px}.images figcaption{position:absolute;left:14px;bottom:14px;background:#221c18d9;padding:7px 10px}.analysis{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);margin-top:28px;background:#302720}.structure{position:relative;min-height:500px}.structure button{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:2px solid #fff;background:#a83d30;color:#fff;cursor:pointer}.structure button.active{box-shadow:0 0 0 7px rgba(212,166,92,.35);background:#d3a557}.notes{padding:38px}.notes h2{font:28px Georgia,'Songti SC',serif}.notes span{display:block;color:#cbbcaf;line-height:1.8}.notes ol{margin:34px 0 0;padding:0;list-style-position:inside}.notes li{padding:12px 0;border-top:1px solid #514239;color:#ad9c8f;cursor:pointer}.notes li.active{color:#e1b96f}@media(max-width:780px){.images,.analysis{grid-template-columns:1fr}.images figure{height:240px}.structure{min-height:360px}.compare-page h1{font-size:30px}}
<style scoped>
.images :deep(.image-trigger){width:100%;height:100%}.structure :deep(.image-trigger){width:100%;height:100%;opacity:.82}
</style>
