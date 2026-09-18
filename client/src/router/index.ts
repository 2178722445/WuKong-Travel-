import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'PortalHome',
    component: () => import('../views/PortalHomeView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/map',
    name: 'Map',
    component: () => import('../views/MapView.vue'),
    meta: { title: '取景地图' }
  },
  {
    path: '/entry/:id',
    name: 'EntryDetail',
    component: () => import('../views/EntryDetailView.vue'),
    meta: { title: '对照条目' }
  },
  {
    path: '/tour/:id',
    name: 'Tour',
    component: () => import('../views/TourView.vue'),
    meta: { title: '怎么逛' }
  },
  {
    path: '/photo-spots/:id',
    name: 'PhotoGuide',
    component: () => import('../views/PhotoGuideView.vue'),
    meta: { title: '从哪拍' }
  },
  {
    path: '/photo-spots',
    redirect: '/photo-spots/3'
  },
  {
    path: '/practical/:id',
    name: 'Practical',
    component: () => import('../views/PracticalView.vue'),
    meta: { title: '出发前看' }
  },
  {
    path: '/game-compare/:id',
    name: 'GameCompare',
    component: () => import('../views/GameCompareView.vue'),
    meta: { title: '游戏对照' }
  },
  {
    path: '/service/:service/:id',
    name: 'ServicePreparing',
    component: () => import('../views/ServicePreparingView.vue'),
    meta: { title: '服务筹备中' }
  },
  {
    path: '/dictionary',
    name: 'Dictionary',
    component: () => import('../views/DictionaryView.vue'),
    meta: { title: '古建知识字典' }
  },
  {
    path: '/routes',
    name: 'ThemeRoutes',
    component: () => import('../views/RoutesView.vue'),
    meta: { title: '主题路线' }
  },
  {
    path: '/location-guide',
    name: 'LocationGuide',
    component: () => import('../views/LocationGuideView.vue'),
    meta: { title: '取景地信息卡' }
  },
  {
    path: '/onsite/:id',
    name: 'OnSite',
    component: () => import('../views/OnSiteView.vue'),
    meta: { title: '现场模式' }
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
    component: () => import('../views/AdminDemoView.vue'),
    meta: { title: '采编工作台' }
  },
  {
    path: '/location/:id/seo',
    name: 'LocationSEO',
    component: () => import('../views/LocationSEO.vue'),
    meta: { title: '取景地' }
  },
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to) => {
  document.title = `${to.meta.title} - 黑神话山西行摄地图`
})

export default router
