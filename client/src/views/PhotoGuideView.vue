<script setup lang="ts">
import { ref } from 'vue'
import PhotoSpotsView from './PhotoSpotsView.vue'
import { photoViews } from '../data/yingxian'
import ImageLightbox from '../components/ImageLightbox.vue'

const tab = ref<'real' | 'light'>('real')
const active = ref(0)
</script>

<template>
  <div class="photo-guide">
    <header>
      <div><p>应县木塔 · 从哪拍</p><h1>先看真实视角，再推演光线</h1></div>
      <div class="tabs" role="tablist"><button :class="{ active: tab === 'real' }" @click="tab = 'real'">实景机位</button><button :class="{ active: tab === 'light' }" @click="tab = 'light'">3D 光影</button></div>
    </header>
    <section v-if="tab === 'real'" class="real-view">
      <div class="photo-stage"><ImageLightbox :src="photoViews[active].image" :alt="photoViews[active].name" /><div><b>0{{ active + 1 }} · {{ photoViews[active].name }}</b><span>{{ photoViews[active].framing }}</span></div></div>
      <aside><p>建议步行顺序</p><button v-for="(spot,index) in photoViews" :key="spot.id" :class="{ active: active === index }" @click="active = index"><i>0{{ index + 1 }}</i><span><b>{{ spot.name }}</b><small>{{ spot.area }} · {{ spot.direction }}</small></span></button></aside>
    </section>
    <section v-else class="light-view"><PhotoSpotsView /></section>
  </div>
</template>

<style scoped>
.photo-guide{height:100%;display:flex;flex-direction:column;background:#f5f0e7;color:#2c221c}.photo-guide>header{height:86px;min-height:86px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:#2c241e;color:#f2e8da}.photo-guide header p{margin:0;color:#d06151;font-size:11px}.photo-guide h1{font:24px Georgia,'Songti SC',serif;margin:4px 0 0}.tabs{display:flex;border:1px solid #6d594b;padding:3px}.tabs button{height:34px;border:0;background:transparent;color:#d2c4b6;padding:0 18px;cursor:pointer}.tabs button.active{background:#a83d30;color:#fff}.real-view{min-height:0;flex:1;display:grid;grid-template-columns:minmax(0,1fr) 340px}.photo-stage{position:relative;min-width:0;background:#171411}.photo-stage>img{width:100%;height:100%;object-fit:contain}.photo-stage>div{position:absolute;left:24px;right:24px;bottom:22px;padding:13px 15px;background:rgba(35,29,24,.88);color:#fff;border-left:3px solid #b64537}.photo-stage b,.photo-stage span{display:block}.photo-stage span{margin-top:5px;color:#cdbfb2;font-size:12px}.real-view aside{padding:22px 20px;overflow-y:auto;background:#eee5d8}.real-view aside>p{color:#91362d;font-size:12px}.real-view aside button{width:100%;display:flex;gap:12px;align-items:center;padding:14px 8px;border:0;border-top:1px solid #d2c5b5;background:transparent;text-align:left;cursor:pointer}.real-view aside button.active{background:#fffaf2}.real-view aside i{font-style:normal;color:#a23a2e}.real-view aside b,.real-view aside small{display:block}.real-view aside small{margin-top:5px;color:#806f61}.light-view{min-height:0;flex:1}.light-view :deep(.ps-page){height:100%}@media(max-width:780px){.photo-guide>header{height:auto;min-height:110px;align-items:flex-start;flex-direction:column;padding:14px 18px}.tabs{margin-top:10px}.real-view{grid-template-columns:1fr;grid-template-rows:58% 42%}.real-view aside{padding:10px 14px}}
</style>
