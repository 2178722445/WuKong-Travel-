<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLocationStore } from '../stores/locations'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../utils/toast'
import type { Review } from '../types'

const route = useRoute()
const router = useRouter()
const locStore = useLocationStore()
const auth = useAuthStore()
const toast = useToast()

const location = ref<any>(null)
const reviews = ref<Review[]>([])
const rating = ref(5)
const content = ref('')
const submitting = ref(false)
const loading = ref(true)
const error = ref('')

const avgRating = computed(() => {
  if (reviews.value.length === 0) return 0
  return Math.round(reviews.value.reduce((s, r) => s + r.rating, 0) / reviews.value.length * 10) / 10
})

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    if (!id || isNaN(id)) { error.value = '无效的景点ID'; loading.value = false; return }
    const data = await locStore.fetchLocation(id)
    if (!data) { error.value = '取景地不存在'; loading.value = false; return }
    location.value = data
    reviews.value = Array.isArray(data.reviews) ? data.reviews : []
  } catch (e: any) {
    error.value = e?.response?.data?.error || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
})

async function submitReview() {
  if (!auth.isLoggedIn) { router.push('/login'); return }
  if (!content.value.trim()) { toast.info('请输入评价内容'); return }
  submitting.value = true
  try {
    await locStore.submitReview(location.value.id, rating.value, content.value)
    const data = await locStore.fetchLocation(location.value.id)
    location.value = data
    reviews.value = Array.isArray(data.reviews) ? data.reviews : []
    content.value = ''
    rating.value = 5
    toast.success('评价提交成功')
  } catch {
    toast.error('评价提交失败')
  } finally { submitting.value = false }
}

async function toggleFav() {
  if (!auth.isLoggedIn) { router.push('/login'); return }
  await locStore.toggleFavorite(location.value.id)
  location.value.isFavorited = locStore.favorites.includes(location.value.id)
}
</script>

<template>
  <div class="page">
    <div v-if="loading" class="loading-state">
      <div class="spinner-ring"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <p class="error-text">{{ error }}</p>
      <button @click="router.push('/map')" class="btn-primary">返回地图</button>
    </div>

    <div v-else-if="location" class="container">
      <button @click="router.push('/map')" class="back-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        返回地图
      </button>

      <div class="hero">
        <div class="hero-content">
          <h1 class="hero-title">{{ location.name }}</h1>
          <p class="hero-subtitle">{{ location.city }} {{ location.district }}</p>
          <div class="hero-tags">
            <span v-for="t in location.tags" :key="t" class="hero-tag">{{ t }}</span>
          </div>
        </div>
        <div v-if="avgRating > 0" class="rating-badge">
          <span class="rating-num">{{ avgRating }}</span>
          <span class="rating-unit">/5</span>
          <span class="rating-count">{{ reviews.length }} 条评价</span>
        </div>
      </div>

      <div class="actions-bar">
        <button @click="toggleFav" class="action-btn" :class="{ active: location.isFavorited }">
          <svg width="16" height="16" viewBox="0 0 24 24" :fill="location.isFavorited ? '#ff4d4f' : 'none'" :stroke="location.isFavorited ? '#ff4d4f' : 'currentColor'" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          {{ location.isFavorited ? '已收藏' : '收藏' }}
        </button>
        <button @click="router.push('/itinerary')" class="action-btn primary">加入行程</button>
      </div>

      <div class="card info-card">
        <h3 class="card-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item"><label>年代</label><span>{{ location.period || '暂无' }}</span></div>
          <div class="info-item"><label>门票</label><span>{{ location.ticket || '暂无' }}</span></div>
          <div class="info-item"><label>开放时间</label><span>{{ location.hours || '暂无' }}</span></div>
          <div class="info-item"><label>最佳季节</label><span>{{ location.bestSeason || '暂无' }}</span></div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">简介</h3>
        <p class="card-text">{{ location.description || '暂无简介' }}</p>
      </div>

      <div class="card">
        <h3 class="card-title">核心看点</h3>
        <p class="card-text">{{ location.highlight || '暂无看点信息' }}</p>
      </div>

      <div class="card">
        <h3 class="card-title">评价 ({{ reviews.length }})</h3>
        <div v-if="auth.isLoggedIn" class="review-form">
          <div class="star-row">
            <button v-for="s in 5" :key="s" @click="rating = s" class="star" :class="{ active: s <= rating }">★</button>
          </div>
          <textarea v-model="content" placeholder="分享你的游览体验..." class="review-textarea"></textarea>
          <button @click="submitReview" :disabled="submitting" class="submit-btn">{{ submitting ? '提交中...' : '提交评价' }}</button>
        </div>
        <div v-else class="login-hint">
          <router-link to="/login">登录</router-link>后可以评价
        </div>
        <div v-if="reviews.length === 0" class="empty-hint">暂无评价，来写第一条吧</div>
        <div v-for="r in reviews" :key="r.id" class="review-item">
          <div class="review-header">
            <div class="review-user">
              <div class="review-avatar">{{ r.user?.username?.charAt(0)?.toUpperCase() || '?' }}</div>
              <strong>{{ r.user?.username || '匿名用户' }}</strong>
            </div>
            <div class="review-meta">
              <span class="review-stars">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
              <span class="review-date">{{ new Date(r.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>
          <p v-if="r.content" class="review-content">{{ r.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page { height: 100%; overflow-y: auto; padding: var(--space-lg); }
.container { max-width: 800px; margin: 0 auto; }

.back-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px;
  border: 1px solid var(--border-color); border-radius: var(--radius-sm);
  background: #fff; font-size: var(--font-size-sm); cursor: pointer;
  color: var(--text-secondary); margin-bottom: var(--space-md); transition: all var(--transition-fast);
}
.back-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

.hero {
  background: linear-gradient(135deg, var(--color-primary-bg), #f0f5ff);
  border-radius: var(--radius-lg); padding: var(--space-xl); margin-bottom: var(--space-md);
  display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;
}
.hero-content { min-width: 0; }
.hero-title { font-size: var(--font-size-title); font-weight: 700; margin-bottom: 4px; word-break: break-all; }
.hero-subtitle { font-size: var(--font-size-md); color: var(--text-tertiary); margin-bottom: 12px; }
.hero-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.hero-tag { font-size: 11px; padding: 3px 12px; border-radius: var(--radius-xs); background: var(--color-gold-light); color: var(--color-gold); font-weight: 500; }
.rating-badge { text-align: center; flex-shrink: 0; }
.rating-num { font-size: 36px; font-weight: 700; color: var(--color-primary); }
.rating-unit { font-size: var(--font-size-md); color: var(--text-tertiary); }
.rating-count { display: block; font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 4px; }

.actions-bar { display: flex; gap: 8px; margin-bottom: var(--space-md); }
.action-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 20px;
  border: 1px solid var(--border-color); border-radius: var(--radius-sm);
  background: #fff; font-size: var(--font-size-sm); font-weight: 500;
  cursor: pointer; color: var(--text-secondary); transition: all var(--transition-fast);
}
.action-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.action-btn.active { color: var(--color-error); border-color: var(--color-error-border); }
.action-btn.primary { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.action-btn.primary:hover { background: var(--color-primary-hover); }

.card { background: #fff; border-radius: var(--radius-md); padding: var(--space-lg); margin-bottom: var(--space-md); border: 1px solid var(--border-color); }
.card-title { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: 12px; }
.card-text { font-size: var(--font-size-md); line-height: 1.8; color: var(--text-secondary); }

.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-item { background: var(--bg-page); border-radius: var(--radius-sm); padding: 12px 16px; border: 1px solid var(--border-color); }
.info-item label { display: block; font-size: 11px; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 4px; }
.info-item span { font-size: var(--font-size-md); font-weight: 600; }

.review-form { margin-bottom: 16px; padding: 16px; background: var(--bg-page); border-radius: var(--radius-sm); }
.star-row { display: flex; gap: 4px; margin-bottom: 10px; }
.star { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--border-color-strong); padding: 0; transition: color var(--transition-fast); }
.star.active { color: var(--color-gold); }
.review-textarea { width: 100%; min-height: 70px; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: var(--font-size-sm); resize: vertical; outline: none; font-family: inherit; transition: border-color var(--transition-fast); box-sizing: border-box; }
.review-textarea:focus { border-color: var(--color-primary); }
.submit-btn { padding: 8px 20px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; margin-top: 8px; transition: background var(--transition-fast); }
.submit-btn:hover { background: var(--color-primary-hover); }
.submit-btn:disabled { opacity: .6; cursor: not-allowed; }
.login-hint { font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: 12px; }
.login-hint a { color: var(--color-primary); }
.empty-hint { font-size: var(--font-size-sm); color: var(--text-quaternary); text-align: center; padding: 20px; }

.review-item { padding: 14px 0; border-bottom: 1px solid var(--border-color); }
.review-item:last-child { border-bottom: none; }
.review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 8px; }
.review-user { display: flex; align-items: center; gap: 8px; }
.review-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--color-primary-bg); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
.review-meta { display: flex; align-items: center; gap: 8px; }
.review-stars { font-size: 12px; color: var(--color-gold); }
.review-date { font-size: 11px; color: var(--text-quaternary); }
.review-content { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; }

.loading-state { text-align: center; padding: 60px; color: var(--text-tertiary); }
.spinner-ring {
  width: 36px; height: 36px; border: 3px solid var(--border-color);
  border-top-color: var(--color-primary); border-radius: 50%;
  animation: spin .6s linear infinite; margin: 0 auto 12px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-state { text-align: center; padding: 80px 20px; }
.error-icon { color: var(--color-warning); margin-bottom: 12px; }
.error-text { font-size: var(--font-size-md); color: var(--text-secondary); margin-bottom: 20px; }
.btn-primary {
  padding: 8px 20px; border: none; border-radius: var(--radius-sm);
  background: var(--color-primary); color: #fff; font-size: var(--font-size-sm);
  font-weight: 500; cursor: pointer; transition: all var(--transition-fast); display: inline-flex; align-items: center; gap: 6px;
}
.btn-primary:hover { background: var(--color-primary-hover); box-shadow: 0 2px 8px rgba(22,119,255,.3); }
</style>