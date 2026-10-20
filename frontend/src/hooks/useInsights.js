import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: () => apiClient.get('/history').then(res => res.data),
  })
}

export function useTrending(days = 7) {
  return useQuery({
    queryKey: ['trending', days],
    queryFn: () => apiClient.get('/trending', { params: { days } }).then(res => res.data),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  })
}

export function useMatcher() {
  return useQuery({
    queryKey: ['matcher'],
    queryFn: () => apiClient.get('/settings/matcher').then(res => res.data),
  })
}

export function useMatcherPreview(prefs) {
  return useQuery({
    queryKey: ['matcher-preview', prefs],
    queryFn: () => apiClient.post('/settings/matcher/preview', prefs).then(res => res.data),
    enabled: Boolean(prefs),
    placeholderData: keepPreviousData,
  })
}

export function useSaveMatcher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (prefs) => apiClient.put('/settings/matcher', prefs).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matcher'] })
      queryClient.invalidateQueries({ queryKey: ['recommendations'] })
    },
  })
}
