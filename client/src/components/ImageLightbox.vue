<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

defineProps<{ src: string; alt: string; class?: string }>()
const open = ref(false)
function close() { open.value = false; window.removeEventListener('keydown', onKeydown) }
function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape') close() }
function show() { open.value = true; window.addEventListener('keydown', onKeydown) }
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <button class="image-trigger" type="button" :class="$props.class" :aria-label="`放大查看：${alt}`" @click="show">
    <img :src="src" :alt="alt">
    <span class="zoom-hint">放大</span>
  </button>
  <Teleport to="body">
    <div v-if="open" class="lightbox" role="dialog" aria-modal="true" :aria-label="alt" @click.self="close">
      <button class="lightbox-close" type="button" aria-label="关闭图片预览" @click="close">×</button>
      <img :src="src" :alt="alt" @click="close">
    </div>
  </Teleport>
</template>

<style scoped>
.image-trigger{position:relative;display:block;width:100%;height:100%;padding:0;border:0;background:transparent;cursor:zoom-in;overflow:hidden}.image-trigger>img{display:block;width:100%;height:100%;object-fit:contain}.zoom-hint{position:absolute;right:10px;bottom:10px;padding:4px 8px;background:rgba(35,29,24,.78);color:#fff;font-size:11px;opacity:0;transition:opacity .15s}.image-trigger:hover .zoom-hint,.image-trigger:focus-visible .zoom-hint{opacity:1}.lightbox{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:32px;background:rgba(15,12,10,.9);cursor:zoom-out}.lightbox>img{max-width:94vw;max-height:92vh;width:auto;height:auto;object-fit:contain}.lightbox-close{position:absolute;top:18px;right:24px;width:42px;height:42px;border:1px solid rgba(255,255,255,.45);background:rgba(35,29,24,.85);color:#fff;font-size:28px;line-height:1;cursor:pointer}
</style>
