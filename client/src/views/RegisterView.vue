<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

async function handleRegister() {
  try {
    error.value = ''
    await auth.register(username.value, email.value, password.value)
    router.push('/map')
  } catch (e: any) {
    error.value = e.response?.data?.error || '注册失败'
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 22h20L12 2z" fill="currentColor" opacity="0.9"/>
            <circle cx="12" cy="20" r="1.5" fill="#fff"/>
          </svg>
        </div>
        <h2>注册</h2>
        <p>创建账号开始规划你的山西古建之旅</p>
      </div>
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="field">
          <label>用户名</label>
          <input v-model="username" placeholder="2-20个字符" required minlength="2" autocomplete="username">
        </div>
        <div class="field">
          <label>邮箱</label>
          <input v-model="email" type="email" placeholder="your@email.com" required autocomplete="email">
        </div>
        <div class="field">
          <label>密码</label>
          <input v-model="password" type="password" placeholder="至少6位" required minlength="6" autocomplete="new-password">
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="submit-btn">注册</button>
      </form>
      <div class="auth-footer">
        <p>已有账号？<router-link to="/login">登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f0f5ff 0%, #f5f5f5 50%, #faf6ed 100%); }
.auth-card { background: #fff; border-radius: var(--radius-xl); padding: 40px; width: 400px; box-shadow: var(--shadow-lg); border: 1px solid var(--border-color); }
.auth-header { text-align: center; margin-bottom: 28px; }
.auth-icon { width: 48px; height: 48px; background: linear-gradient(135deg, var(--color-primary), #3b82f6); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: #fff; margin: 0 auto 16px; }
.auth-header h2 { font-size: var(--font-size-xxl); font-weight: 700; margin-bottom: 4px; }
.auth-header p { font-size: var(--font-size-sm); color: var(--text-tertiary); }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: var(--font-size-sm); font-weight: 500; color: var(--text-primary); }
.field input { padding: 10px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: var(--font-size-md); outline: none; transition: border-color var(--transition-fast); background: var(--bg-page); }
.field input:focus { border-color: var(--color-primary); background: #fff; box-shadow: 0 0 0 3px rgba(22,119,255,.1); }
.error-msg { font-size: var(--font-size-sm); color: var(--color-error); background: var(--color-error-bg); padding: 8px 12px; border-radius: var(--radius-sm); }
.submit-btn { width: 100%; padding: 12px; background: var(--color-primary); color: #fff; border: none; border-radius: var(--radius-sm); font-size: var(--font-size-lg); font-weight: 600; cursor: pointer; transition: all var(--transition-fast); }
.submit-btn:hover { background: var(--color-primary-hover); box-shadow: 0 4px 12px rgba(22,119,255,.3); }
.auth-footer { text-align: center; margin-top: 20px; }
.auth-footer p { font-size: var(--font-size-sm); color: var(--text-tertiary); }
.auth-footer a { color: var(--color-primary); font-weight: 500; }
</style>