import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsPage from '../SettingsPage'
import { api } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

// Regression tests for issue #2: clicking "Change Password" did nothing
vi.mock('@/services/api', () => ({
  api: { auth: { changePassword: vi.fn() } },
}))

const changePassword = vi.mocked(api.auth.changePassword)

const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('SettingsPage - change password', () => {
  beforeEach(() => {
    changePassword.mockReset()
    useAuthStore.setState({ user: { id: '1', username: 'admin' }, token: 't', isAuthenticated: true })
  })

  it('opens a change password form when the button is clicked', () => {
    render(<SettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument()
  })

  it('submits the current and new password to the API', async () => {
    changePassword.mockResolvedValue(undefined)
    render(<SettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))
    fill(/current password/i, 'admin123')
    fill(/^new password/i, 'n3w-secret-pass')
    fill(/confirm new password/i, 'n3w-secret-pass')
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    await waitFor(() => expect(changePassword).toHaveBeenCalledWith('admin123', 'n3w-secret-pass'))
    expect(await screen.findByText(/password changed successfully/i)).toBeInTheDocument()
  })

  it('does not call the API when the confirmation does not match', () => {
    render(<SettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))
    fill(/current password/i, 'admin123')
    fill(/^new password/i, 'n3w-secret-pass')
    fill(/confirm new password/i, 'something-else')
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    expect(changePassword).not.toHaveBeenCalled()
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('shows the API error message', async () => {
    changePassword.mockRejectedValue(new Error('Invalid current password'))
    render(<SettingsPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Change Password' }))
    fill(/current password/i, 'wrong-pass')
    fill(/^new password/i, 'n3w-secret-pass')
    fill(/confirm new password/i, 'n3w-secret-pass')
    fireEvent.click(screen.getByRole('button', { name: 'Update Password' }))

    expect(await screen.findByText('Invalid current password')).toBeInTheDocument()
  })
})
