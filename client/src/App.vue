<script setup lang="ts">
import { computed, onErrorCaptured, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import Toast from './components/Toast.vue'
import { setToast } from './utils/toast'
import { useVisitStore } from './stores/visit'
import { YINGXIAN_ID } from './data/yingxian'
import { demoLocations } from './data/demo'

const route = useRoute()
const visit = useVisitStore()
const toastComponent = ref<any>(null)
const isAdmin = computed(() => route.path.startsWith('/admin'))
const selectedLocationName = computed(() => demoLocations.find(item => item.id === visit.selectedLocationId)?.name)
const serviceTarget = (service: string) => {
  const id = visit.selectedLocationId
  if (!id) return '/'
  return id === YINGXIAN_ID ? `/${service}/${id}` : `/service/${service}/${id}`
}
const activeService = (service: string) => route.path.startsWith(`/${service}`) || route.path.startsWith(`/service/${service}`)

watch(() => [route.path, route.params.id] as const, ([path, id]) => {
  if (!/^\/(tour|photo-spots|practical|game-compare|service)\//.test(path)) return
  const locationId = Number(id)
  if (locationId) visit.selectLocation(locationId)
}, { immediate: true })

onMounted(() => setToast(toastComponent.value))
onErrorCaptured((error) => {
  console.error('[Global Error]', error)
  toastComponent.value?.show('页面发生异常，请刷新重试', 'error')
  return false
})
</script>

<template>
  <div class="app-shell">
    <header v-if="!isAdmin" class="app-header">
      <router-link to="/" class="brand" aria-label="黑神话山西行摄地图首页">
        <img src="/images/brand-avatar.jpg" alt="项目头像">
        <span><b>黑神话山西行摄地图</b><small>BLACK MYTH · SHANXI</small></span>
      </router-link>
      <nav>
        <router-link to="/" :class="{ active: route.path === '/' }">首页</router-link>
        <router-link :to="serviceTarget('tour')" :class="{ active: activeService('tour') }">怎么逛</router-link>
        <router-link :to="serviceTarget('photo-spots')" :class="{ active: activeService('photo-spots') }">从哪拍</router-link>
        <router-link :to="serviceTarget('practical')" :class="{ active: activeService('practical') }">出发前看</router-link>
        <router-link :to="serviceTarget('game-compare')" :class="{ active: activeService('game-compare') }">游戏对照</router-link>
      </nav>
      <span class="current-place">{{ selectedLocationName ?? '尚未选点' }}</span>
    </header>
    <main class="app-main"><router-view /></main>
    <Toast ref="toastComponent" />
  </div>
</template>

<style scoped>
.app-shell{height:100vh;display:flex;flex-direction:column;background:#f5f0e7}.app-header{height:64px;min-height:64px;display:flex;align-items:center;gap:34px;padding:0 24px;background:#28211c;color:#f4eadc;border-bottom:1px solid #4e4036;z-index:100}.brand{display:flex;align-items:center;gap:10px;min-width:270px;color:#f4eadc}.brand:hover{color:#fff}.brand img{width:40px;height:40px;object-fit:cover;border:1px solid #8f6a4f}.brand span,.brand b,.brand small{display:block}.brand b{font:16px 'Songti SC',serif}.brand small{margin-top:2px;color:#a99583;font-size:9px}.app-header nav{height:100%;display:flex;align-items:stretch;gap:4px;flex:1}.app-header nav a{display:flex;align-items:center;padding:0 15px;color:#cdbfb1;font-size:13px;border-bottom:2px solid transparent}.app-header nav a:hover{color:#fff}.app-header nav a.active{color:#fff;border-bottom-color:#b84536}.current-place{color:#9f8d7d;font-size:11px;white-space:nowrap}.app-main{min-height:0;flex:1;overflow:hidden}@media(max-width:900px){.app-header{height:96px;min-height:96px;display:grid;grid-template-columns:1fr;padding:8px 14px;gap:4px}.brand{min-width:0}.brand img{width:34px;height:34px}.app-header nav{overflow-x:auto;height:38px}.app-header nav a{padding:0 12px;white-space:nowrap}.current-place{display:none}}
</style>
