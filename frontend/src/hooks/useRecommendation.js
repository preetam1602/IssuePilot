import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export function useRecommendations(limit = 20) {
  return useQuery({
    queryKey: ['recommendations', limit],
    queryFn: () => apiClient.get('/recommend', { params: { limit } }).then(res => res.data),
    staleTime: 1000 * 60 * 5,
  })
}
