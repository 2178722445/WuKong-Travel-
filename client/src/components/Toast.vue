<script setup lang="ts">
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

const toasts = ref<Toast[]>([])
let nextId = 0

function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

defineExpose({ show })

const icons: Record<string, string> = {
  success: '✓', error: '✕', warning: '!', info: 'i'
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <transition-group name="toast">
        <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">
          <span class="toast-icon">{{ icons[t.type] }}</span>
          <span>{{ t.message }}</span>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 72px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  background: #fff;
  box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 12px 48px 16px rgba(0, 0, 0, 0.03);
  pointer-events: auto;
  min-width: 200px;
  border: 1px solid #f0f0f0;
}
.toast-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.toast.success { border-left: 3px solid #52c41a; }
.toast.success .toast-icon { background: #52c41a; }
.toast.error   { border-left: 3px solid #ff4d4f; }
.toast.error   .toast-icon { background: #ff4d4f; }
.toast.warning { border-left: 3px solid #faad14; }
.toast.warning .toast-icon { background: #faad14; }
.toast.info    { border-left: 3px solid #1677ff; }
.toast.info    .toast-icon { background: #1677ff; }

.toast-enter-active { transition: all .3s ease-out; }
.toast-leave-active { transition: all .2s ease-in; }
.toast-enter-from { transform: translateX(100%); opacity: 0; }
.toast-leave-to   { transform: translateX(100%); opacity: 0; }
</style>