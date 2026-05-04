import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '首页 - 教学管理辅助系统' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { title: '关于 - 教学管理辅助系统' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: '登录 - 教学管理辅助系统' },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('../views/ChangePasswordView.vue'),
      meta: { title: '修改密码 - 教学管理辅助系统' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { title: '注册 - 教学管理辅助系统' },
    },
    {
      path: '/double-selection',
      name: 'double-selection',
      component: () => import('../views/DoubleSelectionView.vue'),
      meta: { title: '导师双选 - 教学管理辅助系统' },
    },
    {
      path: '/internship',
      name: 'internship',
      component: () => import('../views/InternshipView.vue'),
      meta: { title: '实习管理 - 教学管理辅助系统' },
    },
    {
      path: '/internship/detail/:id',
      name: 'internship-detail',
      component: () => import('../views/InternshipDetailView.vue'),
      meta: { title: '实习详情 - 教学管理辅助系统' },
    },
    {
      path: '/task-assignment',
      name: 'task-assignment',
      component: () => import('../views/TaskAssignmentView.vue'),
      meta: { title: '任务分配 - 教学管理辅助系统' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { title: '个人信息 - 教学管理辅助系统' },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminPanelView.vue'),
      meta: { title: '管理员面板 - 教学管理辅助系统' },
    },
    {
      path: '/train',
      name: 'train',
      component: () => import('../views/TrainView.vue'),
      meta: { title: '科研训练 - 教学管理辅助系统' },
    },
    {
      path: '/announcement/:id',
      name: 'announcement-detail',
      component: () => import('../views/AnnouncementDetailView.vue'),
      meta: { title: '公告详情 - 教学管理辅助系统' },
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('../views/TeamView.vue'),
      meta: { title: '教学团队 - 教学管理辅助系统' },
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('../views/DatabaseView.vue'),
      meta: { title: '数据库面板 - 教学管理辅助系统' },
    },
    {
      path: '/company',
      name: 'company',
      component: () => import('../views/CompanyView.vue'),
      meta: { title: '企业管理 - 教学管理辅助系统' },
    },
    {
      path: '/company/students',
      name: 'company-students',
      component: () => import('../views/CompanyStudentView.vue'),
      meta: { title: '学生管理 - 企业管理系统' },
    },
    {
      path: '/company/internship',
      name: 'company-internship',
      component: () => import('../views/InternshipView.vue'),
      meta: { title: '实习管理 - 企业管理系统' },
    },
  ],
})

// 设置页面标题和登录检查
router.beforeEach((to, from, next) => {


  document.title = (to.meta.title as string) || '教学管理辅助系统'

  // 需要登录的页面
  const publicPages = ['/login', '/register', '/change-password']
  const authRequired = !publicPages.includes(to.path)

  // 从 sessionStorage 检查登录状态（每个标签页独立）
  const token = sessionStorage.getItem('token')
  const user = sessionStorage.getItem('user')
  const isLoggedIn = !!(token && user)

  console.log('路由守卫 - 需要登录:', authRequired, '已登录:', isLoggedIn)

  if (authRequired && !isLoggedIn) {
    // 需要登录但未登录，跳转到登录页

    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    // 已登录但访问登录页，跳转到首页

    next('/')
  } else {

    next()
  }
})

export default router
