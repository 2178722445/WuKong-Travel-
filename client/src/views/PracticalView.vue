<script setup lang="ts">
import { practicalItems, yingxianAssets } from '../data/yingxian'
import ImageLightbox from '../components/ImageLightbox.vue'
</script>

<template>
  <div class="practical-page">
    <header><ImageLightbox class="header-image" :src="yingxianAssets.cover" alt="应县木塔西北角远景" /><div><p>应县木塔 · 出发前看</p><h1>把容易变的信息，留到出发前核对</h1><span>本页提供准备清单，不替代景区当日公告。</span></div></header>
    <main>
      <section class="info-list"><article v-for="item in practicalItems" :key="item.label"><small>{{ item.label }}</small><p>{{ item.value }}</p></article></section>
      <aside><h2>出发前 24 小时</h2><label><input type="checkbox"> 核对官方开放时间</label><label><input type="checkbox"> 核对预约与购票入口</label><label><input type="checkbox"> 查看天气和当地交通</label><label><input type="checkbox"> 准备适合步行的鞋与备用电量</label><div><b>信息来源</b><p>优先采用景区及当地文旅官方公告。当前演示内容尚未完成逐项联网核验，出现冲突时请以最新官方信息为准。</p><span>更新日期：2026-09-18</span></div></aside>
    </main>
  </div>
</template>

<style scoped>
.practical-page{height:100%;overflow-y:auto;background:#f5f0e7;color:#2c221c}.practical-page header{height:320px;position:relative;display:flex;align-items:end;padding:44px max(7vw,30px);overflow:hidden;color:#fff}.practical-page header :deep(.header-image){position:absolute;inset:0;width:100%;height:100%;filter:brightness(.38);pointer-events:none}.practical-page header div{position:relative;z-index:1}.practical-page header p{color:#df7667}.practical-page h1{max-width:720px;font:38px Georgia,'Songti SC',serif;margin:8px 0}.practical-page header span{color:#ddd0c1}.practical-page main{display:grid;grid-template-columns:1.25fr .75fr;gap:38px;padding:38px max(7vw,30px)}.info-list article{padding:22px 0;border-bottom:1px solid #d6c9b8}.info-list small{color:#a0392e}.info-list p{font-size:17px;line-height:1.7;margin:8px 0}.practical-page aside{background:#2d251f;color:#f1e7da;padding:26px;height:max-content}.practical-page aside h2{margin-top:0}.practical-page aside label{display:block;padding:13px 0;border-bottom:1px solid #51463c}.practical-page aside input{margin-right:8px}.practical-page aside div{margin-top:24px;color:#cbbdac;line-height:1.6}.practical-page aside span{font-size:12px;color:#a99a89}@media(max-width:760px){.practical-page main{grid-template-columns:1fr}.practical-page header{height:260px}.practical-page h1{font-size:30px}}
</style>
