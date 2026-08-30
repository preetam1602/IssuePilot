import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export function useIssue(issueId) {
  return useQuery({
    queryKey: ['issue', issueId],
    queryFn: () => apiClient.get(`/issues/${issueId}`).then(res => res.data),
    enabled: Boolean(issueId),
  })
}
