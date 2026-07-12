import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/map' },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/MapView.vue'),
    meta: { title: '取景地图' }
  },
  {
    path: '/location/:id',
    name: 'LocationDetail',
    component: () => import('../views/LocationDetail.vue'),
    meta: { title: '取景地详情' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('../views/FavoritesView.vue'),
    meta: { title: '我的收藏' }
  },
  {
    path: '/itinerary',
    name: 'Itinerary',
    component: () => import('../views/ItineraryView.vue'),
    meta: { title: '行程规划' }
  },
  {
    path: '/itinerary/:id',
    name: 'ItineraryDetail',
    component: () => import('../views/ItineraryDetail.vue'),
    meta: { title: '行程详情' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminView.vue'),
    meta: { title: '管理后台', admin: true }
  },
  {
    path: '/location/:id/seo',
    name: 'LocationSEO',
    component: () => import('../views/LocationSEO.vue'),
    meta: { title: '取景地' }
  },
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to, _, next) => {
  document.title = `${to.meta.title} - 黑神话·悟空 山西取景地`
  if (to.meta.admin) {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user || user.role !== 'admin') {
      next('/login')
      return
    }
  }
  next()
})

export default router
