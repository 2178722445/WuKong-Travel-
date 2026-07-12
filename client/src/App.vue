<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'
import Toast from './components/Toast.vue'
import { setToast } from './utils/toast'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toastComponent = ref<any>(null)

onMounted(() => {
  setToast(toastComponent.value)
})

onErrorCaptured((err: any) => {
  console.error('[Global Error]', err)
  toastComponent.value?.show('页面发生异常，请刷新重试', 'error')
  return false
})

function logout() {
  auth.logout()
  router.push('/login')
}

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-inner">
        <router-link to="/" class="brand">
          <div class="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 22h20L12 2z" fill="currentColor" opacity="0.9"/>
              <circle cx="12" cy="20" r="1.5" fill="#fff"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-title">WuKong Travel</span>
            <span class="brand-subtitle">山西古建取景地</span>
          </div>
        </router-link>

        <nav class="nav-links">
          <router-link to="/map" class="nav-item" :class="{ active: isActive('/map') || isActive('/location') }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>取景地图</span>
          </router-link>
          <router-link to="/itinerary" class="nav-item" :class="{ active: isActive('/itinerary') }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>行程规划</span>
          </router-link>
          <router-link v-if="auth.isLoggedIn" to="/favorites" class="nav-item" :class="{ active: isActive('/favorites') }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>我的收藏</span>
          </router-link>
          <router-link v-if="auth.isAdmin" to="/admin" class="nav-item" :class="{ active: isActive('/admin') }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            <span>管理后台</span>
          </router-link>
        </nav>

        <div class="header-actions">
          <template v-if="auth.isLoggedIn">
            <div class="user-dropdown">
              <div class="user-avatar">{{ auth.user?.username?.charAt(0)?.toUpperCase() }}</div>
              <span class="user-name">{{ auth.user?.username }}</span>
              <svg class="chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              <div class="dropdown-menu">
                <div class="dropdown-item" @click="logout">退出登录</div>
              </div>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="btn-ghost">登录</router-link>
            <router-link to="/register" class="btn-primary-sm">注册</router-link>
          </template>
        </div>
      </div>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <Toast ref="toastComponent" />
  </div>
</template>

<style scoped>
.app-shell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}

.app-header {
  height: var(--header-height);
  min-height: var(--header-height);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 100;
  position: relative;
}

.header-inner {
  height: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  text-decoration: none;
  flex-shrink: 0;
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-primary), #3b82f6);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.brand-title {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.brand-subtitle {
  font-size: 10px;
  color: var(--text-tertiary);
  font-weight: 400;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

.nav-item.active {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}

.btn-ghost {
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.btn-ghost:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.btn-primary-sm {
  padding: 6px 16px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  background: var(--color-primary);
  color: #fff;
  text-decoration: none;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.btn-primary-sm:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 2px 8px rgba(22, 119, 255, 0.3);
}

.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: 4px 12px 4px 4px;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.user-dropdown:hover {
  background: var(--bg-hover);
}

.user-dropdown:hover .dropdown-menu {
  display: block;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), #3b82f6);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.chevron {
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
}

.user-dropdown:hover .chevron {
  transform: rotate(180deg);
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  min-width: 120px;
  overflow: hidden;
  z-index: 200;
}

.dropdown-item {
  padding: 10px 16px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.dropdown-item:hover {
  background: var(--bg-hover);
  color: var(--color-error);
}

.app-main {
  flex: 1;
  overflow: hidden;
}
</style>