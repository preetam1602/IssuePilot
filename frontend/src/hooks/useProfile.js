import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/profile').then(res => res.data),
  })
}
