// src/stores/auth.js
import { defineStore } from 'pinia'
import http, { getCsrfCookie } from '@/services/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    checked: false, // the login was checked once after the page loaded
  }),

  getters: {
    role: (s) => s.user?.role ?? null,
    isOwner: (s) => s.user?.role === 'owner',
    canEdit: (s) => ['owner', 'staff'].includes(s.user?.role), // viewers only read
    isMember: (s) => s.user?.role === 'member',                // the self-service role
    home: (s) => (s.user?.role === 'member' ? '/portal' : '/'),
  },

  actions: {
    async fetchMe() {
      try {
        this.user = (await http.get('/me')).data.data
      } catch {
        this.user = null
      } finally {
        this.checked = true
      }
    },
    async login(phone, password) {
      await getCsrfCookie()
      const res = await http.post('/login', { phone, password })
      if (res.data.two_factor) return 'code'
      this.user = res.data.data
      this.checked = true
      return 'done'
    },
    async logout() {
      try { await http.post('/logout') } finally { this.user = null }
    },
  },
})

// main.js:
// app.config.globalProperties.$can = (level) => {
//   const auth = useAuthStore()
//   return level === 'owner' ? auth.isOwner : auth.canEdit
// }
