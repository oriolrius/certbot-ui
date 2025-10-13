import { describe, it, expect } from 'vitest'
import { formatDate, formatRelativeTime, getCertificateStatus } from '../lib/utils'

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-12-31T23:59:59Z')
      const result = formatDate(date)
      expect(result).toContain('December')
      expect(result).toContain('31')
      expect(result).toContain('2024')
    })

    it('should handle string dates', () => {
      const result = formatDate('2024-12-31T23:59:59Z')
      expect(result).toContain('December')
    })
  })

  describe('formatRelativeTime', () => {
    it('should show expired for past dates', () => {
      const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
      const result = formatRelativeTime(pastDate)
      expect(result).toContain('Expired')
      expect(result).toContain('ago')
    })

    it('should show days remaining for near future', () => {
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
      const result = formatRelativeTime(futureDate)
      expect(result).toContain('Expires in')
      expect(result).toContain('days')
    })

    it('should show months for far future', () => {
      const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      const result = formatRelativeTime(futureDate)
      expect(result).toContain('month')
    })
  })

  describe('getCertificateStatus', () => {
    it('should return expired for past dates', () => {
      const pastDate = new Date(Date.now() - 1000)
      expect(getCertificateStatus(pastDate)).toBe('expired')
    })

    it('should return expiring_soon for dates within 30 days', () => {
      const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      expect(getCertificateStatus(soonDate)).toBe('expiring_soon')
    })

    it('should return valid for dates beyond 30 days', () => {
      const validDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      expect(getCertificateStatus(validDate)).toBe('valid')
    })
  })
})
