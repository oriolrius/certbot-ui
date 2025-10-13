import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 0) {
    return `Expired ${Math.abs(days)} days ago`
  } else if (days === 0) {
    return 'Expires today'
  } else if (days === 1) {
    return 'Expires tomorrow'
  } else if (days < 30) {
    return `Expires in ${days} days`
  } else {
    const months = Math.floor(days / 30)
    return `Expires in ${months} month${months > 1 ? 's' : ''}`
  }
}

export function getCertificateStatus(expiryDate: Date | string): 'valid' | 'expiring_soon' | 'expired' {
  const d = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 0) {
    return 'expired'
  } else if (days < 30) {
    return 'expiring_soon'
  }
  return 'valid'
}
