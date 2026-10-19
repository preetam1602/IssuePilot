import axios from 'axios'

const TOKEN_KEY = 'issuepilot_token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 on an authenticated request means the token expired or was revoked:
// drop it and send the user back to sign in.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/landing') {
        window.location.href = '/landing'
      }
    }
    return Promise.reject(error)
  },
)

export const signInWithGitHub = () => {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`
}

export function captureAuthTokenFromUrl() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const token = params.get('token')
  if (!token) return false

  localStorage.setItem(TOKEN_KEY, token)
  window.history.replaceState({}, '', window.location.pathname + window.location.search)
  return true
}

export function isSignedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY)
  window.location.href = '/landing'
}
