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

export const signInWithGitHub = () => {
  window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/github`
}

export function captureAuthTokenFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (!token) return false

  localStorage.setItem(TOKEN_KEY, token)
  params.delete('token')
  const newSearch = params.toString()
  window.history.replaceState({}, '', window.location.pathname + (newSearch ? `?${newSearch}` : ''))
  return true
}

export function isSignedIn() {
  return Boolean(localStorage.getItem(TOKEN_KEY))
}

export function signOut() {
  localStorage.removeItem(TOKEN_KEY)
  window.location.href = '/landing'
}
