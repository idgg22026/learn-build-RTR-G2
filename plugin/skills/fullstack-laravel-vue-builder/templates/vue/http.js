import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
  // Send the login cookie, and the XSRF token that protects it, with every request
  withCredentials: true,
  withXSRFToken: true,
})

// "http://localhost:8000/api" → "http://localhost:8000"
const apiRoot = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')

// Gives the browser a fresh XSRF-TOKEN cookie (needed before logging in)
export function getCsrfCookie() {
  return axios.get(`${apiRoot}/sanctum/csrf-cookie`, { withCredentials: true })
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const request = error.config

    // 419: the XSRF token expired. Get a new one and try once more.
    if (status === 419 && request && !request._retried) {
      request._retried = true
      await getCsrfCookie()
      return http(request)
    }

    // 401: the login has ended. Go to the login page, then come back.
    if (status === 401 && !request?.url?.endsWith('/me') && !request?.url?.endsWith('/login')) {
      const { default: router } = await import('@/router')
      const current = router.currentRoute.value
      if (current.name !== 'login') {
        router.replace({ name: 'login', query: { redirect: current.fullPath } })
      }
    }

    // 403: logged in, but this role cannot do it
    if (status === 403 && error.response.data) {
      error.response.data.message ??= 'You do not have permission to do this.'
    }

    return Promise.reject(error)
  },
)

export default http
