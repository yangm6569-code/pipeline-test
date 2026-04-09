import { createRouter, createWebHistory } from 'vue-router'
import { getToken, getUserInfo, removeToken, removeUserInfo } from '@/utils/auth'
import { canAccessModule, getDefaultRouteByRole } from '@/utils/permission'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { hidden: true }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue'),
    meta: { title: '首页', requiresAuth: true, module: 'dashboard' }
  },
  {
    path: '/ai/chat',
    name: 'AiChat',
    component: () => import('@/views/ai/AiChat.vue'),
    meta: { title: 'AI聊天', requiresAuth: true }
  },
  {
    path: '/project',
    redirect: '/project/list'
  },
  {
    path: '/project/list',
    name: 'ProjectList',
    component: () => import('@/views/project/ProjectList.vue'),
    meta: { title: '项目列表', requiresAuth: true, module: 'project' }
  },
  {
    path: '/project/process-approval',
    name: 'ProcessApproval',
    component: () => import('@/views/project/ProcessApproval.vue'),
    meta: { title: '项目流程审批', requiresAuth: true, module: 'approval' }
  },
  {
    path: '/application/approval',
    name: 'ApplicationApproval',
    component: () => import('@/views/application/ApplicationList.vue'),
    meta: { title: '申请审批', requiresAuth: true, module: 'approval' }
  },
  {
    path: '/achievement',
    name: 'Achievement',
    component: () => import('@/views/achievement/AchievementList.vue'),
    meta: { title: '成果管理', requiresAuth: true, module: 'achievement' }
  },
  {
    path: '/reimbursement',
    name: 'Reimbursement',
    component: () => import('@/views/reimbursement/ReimbursementList.vue'),
    meta: { title: '报销管理', requiresAuth: true, module: 'reimbursement' }
  },
  {
    path: '/user',
    name: 'User',
    component: () => import('@/views/user/UserList.vue'),
    meta: { title: '用户管理', requiresAuth: true, module: 'user' }
  },
  {
    path: '/role',
    name: 'Role',
    component: () => import('@/views/role/RoleList.vue'),
    meta: { title: '角色管理', requiresAuth: true, module: 'role' }
  },
  {
    path: '/project/detail/:id',
    name: 'ProjectDetail',
    component: () => import('@/views/project/ProjectDetail.vue'),
    meta: { title: '项目详情', requiresAuth: true, module: 'project' }
  },
  {
    path: '/project/process/:id',
    name: 'ProjectProcessDetail',
    component: () => import('@/views/project/ProjectProcessDetail.vue'),
    meta: { title: '项目流程', requiresAuth: true, module: 'project' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = getToken()
  const localUserInfo = getUserInfo()
  const roleKey = localUserInfo?.roleKey || ''

  if (to.path === '/login') {
    if (token && roleKey) {
      const defaultRoute = getDefaultRouteByRole(roleKey)
      if (defaultRoute !== '/login') {
        next(defaultRoute)
        return
      }
    }
    next()
    return
  }

  if (to.meta?.requiresAuth) {
    if (!token) {
      next('/login')
      return
    }

    if (!roleKey) {
      removeToken()
      removeUserInfo()
      next('/login')
      return
    }

    const moduleKey = to.meta?.module
    if (moduleKey && !canAccessModule(roleKey, moduleKey)) {
      next(getDefaultRouteByRole(roleKey))
      return
    }
  }

  next()
})

router.onError((error) => {
  console.error('路由导航错误:', error)
})

export default router
