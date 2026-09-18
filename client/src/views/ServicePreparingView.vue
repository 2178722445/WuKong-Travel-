<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { demoLocations } from '../data/demo'
import { useVisitStore } from '../stores/visit'

const route = useRoute()
const visit = useVisitStore()
const location = computed(() => demoLocations.find(item => item.id === Number(route.params.id)))
const names: Record<string, string> = { tour: '怎么逛', 'photo-spots': '从哪拍', practical: '出发前看', 'game-compare': '游戏对照' }
</script>

<template>
  <div class="preparing"><div><span>{{ location?.city }} · {{ location?.district }}</span><h1>{{ location?.name }}</h1><p>“{{ names[String(route.params.service)] ?? '深度服务' }}”正在筹备。地点仍保留在全省地图中，完整内容会按资料核验进度逐站开放。</p><button @click="visit.selectLocation(location?.id ?? null); $router.push('/')">返回地点详情</button></div></div>
</template>

<style scoped>
.preparing{height:100%;display:grid;place-items:center;padding:24px;background:#ede4d7;color:#2e241d}.preparing>div{width:min(620px,100%);border-top:4px solid #a33b30;background:#fffdf8;padding:42px}.preparing span{color:#9d392f;font-size:12px}.preparing h1{font:38px Georgia,'Songti SC',serif;margin:8px 0 16px}.preparing p{line-height:1.8;color:#67584d}.preparing button{margin-top:22px;border:0;background:#35302a;color:#fff;padding:11px 18px;cursor:pointer}
</style>
