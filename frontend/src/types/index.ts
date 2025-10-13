export interface Certificate {
  name: string
  domains: string[]
  expiry: Date
  status: 'valid' | 'expired' | 'expiring_soon'
  serial_number?: string
  path?: string
}

export interface CertificateRequest {
  domains: string[]
  email: string
  plugin: 'standalone' | 'webroot' | 'nginx' | 'apache' | 'dns'
  webroot_path?: string
  dns_provider?: 'manual' | 'cloudflare' | 'route53' | 'digitalocean' | 'google'
  dns_credentials?: string
  agree_tos: boolean
  staging?: boolean
}

export interface RenewalOptions {
  cert_name?: string
  dry_run?: boolean
  force_renewal?: boolean
}

export interface RevocationOptions {
  cert_name: string
  reason?: 'unspecified' | 'keycompromise' | 'affiliationchanged' | 'superseded' | 'cessationofoperation'
  delete_after_revoke?: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    statusCode: number
    details?: unknown
  }
  message?: string
}

export interface User {
  id: string
  username: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface WebSocketMessage {
  type: string
  payload: unknown
}

export interface OperationProgress {
  operation: string
  progress: number
  message: string
}

export type JobType = 'obtain' | 'renew' | 'revoke' | 'delete'
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  userId: string
  request: CertificateRequest | RenewalOptions | RevocationOptions | { certName: string }
  result?: {
    success: boolean
    stdout: string
    stderr: string
    exitCode: number
  }
  error?: string
  progress?: number
  progressMessage?: string
  dnsChallenge?: {
    domain: string
    validation: string
    record_name: string
    timestamp: string
  } | null
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface JobResponse {
  jobId: string
  status: string
}
