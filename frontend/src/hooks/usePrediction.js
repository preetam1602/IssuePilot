import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/api'

export function usePrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (issueId) =>
      apiClient.post('/predict', { issue_id: issueId }).then(res => res.data),
    onSuccess: (_data, issueId) => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] })
    },
  })
}
