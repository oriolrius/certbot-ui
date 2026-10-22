import { useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle, KeyRound } from 'lucide-react'
import { Button } from './ui/Button'
import { api } from '@/services/api'
import { getErrorMessage } from '@/lib/utils'

interface ChangePasswordDialogProps {
  onClose: () => void
}

const MIN_PASSWORD_LENGTH = 8

const inputClassName = 'w-full px-3 py-2 rounded-md border border-input bg-background mt-2'

export default function ChangePasswordDialog({ onClose }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await api.auth.changePassword(currentPassword, newPassword)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to change password'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="bg-background rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-6 w-6 text-primary" />
              <h2 id="change-password-title" className="text-2xl font-bold">
                Change Password
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-muted-foreground hover:text-foreground text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {success ? (
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-md bg-green-500/10 border border-green-500/30 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Password changed successfully.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-4 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="current-password" className="text-sm font-medium">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="new-password" className="text-sm font-medium">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
                className={inputClassName}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClassName}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
