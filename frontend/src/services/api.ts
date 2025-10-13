import {
  Certificate,
  CertificateRequest,
  RenewalOptions,
  RevocationOptions,
  ApiResponse,
  AuthResponse,
  Job,
  JobResponse
} from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api'

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data: ApiResponse<T> = await response.json()

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error?.message || 'An error occurred',
      data.error?.statusCode || response.status,
      data.error?.code
    )
  }

  return data.data as T
}

export const api = {
  // Auth
  auth: {
    login: (username: string, password: string) =>
      fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    register: (username: string, password: string) =>
      fetchApi<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    changePassword: (username: string, oldPassword: string, newPassword: string) =>
      fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ username, oldPassword, newPassword }),
      }),
  },

  // Certificates
  certificates: {
    list: () => fetchApi<Certificate[]>('/certificates'),

    get: (name: string) => fetchApi<Certificate>(`/certificates/${name}`),

    obtain: (request: CertificateRequest) =>
      fetchApi<JobResponse>('/certificates', {
        method: 'POST',
        body: JSON.stringify(request),
      }),

    renew: (options: RenewalOptions) =>
      fetchApi<JobResponse>('/certificates/renew', {
        method: 'POST',
        body: JSON.stringify(options),
      }),

    revoke: (options: RevocationOptions) =>
      fetchApi<JobResponse>('/certificates/revoke', {
        method: 'POST',
        body: JSON.stringify(options),
      }),

    delete: (name: string) =>
      fetchApi<JobResponse>(`/certificates/${name}`, {
        method: 'DELETE',
      }),

    getLogs: (limit?: number) => {
      const query = limit ? `?limit=${limit}` : ''
      return fetchApi<string[]>(`/certificates/logs${query}`)
    },
  },

  // Jobs
  jobs: {
    get: (jobId: string) => fetchApi<Job>(`/certificates/jobs/${jobId}`),

    list: () => fetchApi<Job[]>('/certificates/jobs'),
  },

  // Health
  health: {
    check: () => fetchApi('/health'),
    certbot: () => fetchApi('/health/certbot'),
  },
}

export { ApiError }
