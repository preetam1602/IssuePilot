import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, isSignedIn } from '../lib/api'

export function useSavedIssues() {
  return useQuery({
    queryKey: ['saved'],
    queryFn: () => apiClient.get('/saved').then(res => res.data),
    enabled: isSignedIn(),
  })
}

export function useToggleSave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ issueId, saved }) =>
      saved
        ? apiClient.delete(`/saved/${issueId}`)
        : apiClient.post('/saved', { issue_id: issueId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
