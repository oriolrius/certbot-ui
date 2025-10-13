import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { CertificateRequest, RenewalOptions, RevocationOptions } from '../types'
import { useState, useEffect } from 'react'

export function useCertificates() {
  return useQuery({
    queryKey: ['certificates'],
    queryFn: () => api.certificates.list(),
  })
}

export function useCertificate(name: string) {
  return useQuery({
    queryKey: ['certificates', name],
    queryFn: () => api.certificates.get(name),
    enabled: !!name,
  })
}

export function useObtainCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CertificateRequest) => api.certificates.obtain(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}

export function useRenewCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: RenewalOptions) => api.certificates.renew(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}

export function useRevokeCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: RevocationOptions) => api.certificates.revoke(options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => api.certificates.delete(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] })
    },
  })
}

export function useCertificateLogs(limit?: number) {
  return useQuery({
    queryKey: ['certificates', 'logs', limit],
    queryFn: () => api.certificates.getLogs(limit),
  })
}

// Job-related hooks

export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: () => api.jobs.get(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if job is pending or in progress
      const job = query.state.data
      if (job && (job.status === 'pending' || job.status === 'in_progress')) {
        return 2000
      }
      return false
    },
  })
}

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.jobs.list(),
  })
}

// Hook to track job completion and automatically refresh certificates
export function useJobCompletion(jobId: string | null) {
  const queryClient = useQueryClient()
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: job } = useJob(jobId)

  useEffect(() => {
    if (job) {
      if (job.status === 'completed') {
        setIsComplete(true)
        // Refresh certificates list
        queryClient.invalidateQueries({ queryKey: ['certificates'] })
      } else if (job.status === 'failed') {
        setError(job.error || 'Operation failed')
      }
    }
  }, [job, queryClient])

  return {
    job,
    isComplete,
    error,
    isInProgress: job?.status === 'in_progress' || job?.status === 'pending',
  }
}
