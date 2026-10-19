import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export function useIssues(params = {}) {
  return useQuery({
    queryKey: ['issues', params],
    queryFn: () => apiClient.get('/issues', { params }).then(res => res.data),
    placeholderData: keepPreviousData,
  })
}
