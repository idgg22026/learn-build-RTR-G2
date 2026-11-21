// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import { useAuthStore } from '@/stores/auth'

const STAFF = ['owner', 'staff', 'viewer']
const OWNER = ['owner']
const MEMBER = ['member']

const routes = [
  { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { title: 'Log in', public: true } },
  { path: '/portal', name: 'portal', component: () => import('@/pages/portal/PortalHomePage.vue'), meta: { title: 'My account', roles: MEMBER } },
  {
    path: '/',
    component: AdminLayout,
    meta: { roles: STAFF },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue'), meta: { title: 'Dashboard' } },
      { path: '{things}', name: '{things}', component: () => import('@/pages/{things}/{Thing}ListPage.vue'), meta: { title: '{THING_LABEL}s' } },
      { path: 'users', name: 'users', component: () => import('@/pages/users/UserListPage.vue'), meta: { title: 'Logins', roles: OWNER } },
    ],
  },
  // Print pages live OUTSIDE the layout so window.print() gives a clean page
  // { path: '/invoices/:id/print', component: () => import('@/pages/invoices/InvoicePrintPage.vue'), meta: { roles: STAFF } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.checked) await auth.fetchMe()

  if (to.meta.public) return auth.user ? auth.home : true
  if (!auth.user) return { name: 'login', query: to.fullPath === '/' ? {} : { redirect: to.fullPath } }

  // meta.roles of the page AND its parents must all allow this role
  const allowed = to.matched.every((r) => !r.meta.roles || r.meta.roles.includes(auth.role))
  return allowed ? true : auth.home
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? 'Home'} | APP_NAME`
})

export default router
