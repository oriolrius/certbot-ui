import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewCertificatePage from '../NewCertificatePage'

// Mock the useCertificates hook
vi.mock('@/hooks/useCertificates', () => ({
  useObtainCertificate: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('NewCertificatePage - Staging Mode', () => {
  it('should default staging checkbox to checked', () => {
    renderWithProviders(<NewCertificatePage />)

    // Navigate to step 3 (Configuration)
    const domainInput = screen.getByPlaceholderText('example.com')
    fireEvent.change(domainInput, { target: { value: 'test.com' } })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3

    const stagingCheckbox = screen.getByLabelText(/use staging environment/i) as HTMLInputElement
    expect(stagingCheckbox.checked).toBe(true)
  })

  it('should show production warning when staging is disabled', () => {
    renderWithProviders(<NewCertificatePage />)

    // Navigate to step 3
    const domainInput = screen.getByPlaceholderText('example.com')
    fireEvent.change(domainInput, { target: { value: 'test.com' } })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3

    const stagingCheckbox = screen.getByLabelText(/use staging environment/i)
    fireEvent.click(stagingCheckbox) // Uncheck staging

    expect(screen.getByText(/Production Mode Warning/i)).toBeInTheDocument()
    expect(screen.getByText(/Rate limits: 300 orders per 3 hours/i)).toBeInTheDocument()
  })

  it('should not show production warning when staging is enabled', () => {
    renderWithProviders(<NewCertificatePage />)

    // Navigate to step 3
    const domainInput = screen.getByPlaceholderText('example.com')
    fireEvent.change(domainInput, { target: { value: 'test.com' } })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3

    const stagingCheckbox = screen.getByLabelText(/use staging environment/i) as HTMLInputElement
    expect(stagingCheckbox.checked).toBe(true)
    expect(screen.queryByText(/Production Mode Warning/i)).not.toBeInTheDocument()
  })

  it('should show staging mode indicator in review step', () => {
    renderWithProviders(<NewCertificatePage />)

    // Navigate through all steps
    const domainInput = screen.getByPlaceholderText('example.com')
    fireEvent.change(domainInput, { target: { value: 'test.com' } })

    let nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3

    // Fill in configuration
    const emailInput = screen.getByPlaceholderText('admin@example.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const tosCheckbox = screen.getByLabelText(/I agree to the Let's Encrypt Terms of Service/i)
    fireEvent.click(tosCheckbox)

    nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 4 (Review)

    expect(screen.getByText(/Staging Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/perfect for testing/i)).toBeInTheDocument()
  })

  it('should show production mode indicator in review step when staging is disabled', () => {
    renderWithProviders(<NewCertificatePage />)

    // Navigate through steps
    const domainInput = screen.getByPlaceholderText('example.com')
    fireEvent.change(domainInput, { target: { value: 'test.com' } })

    let nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2
    fireEvent.click(nextButton) // Step 3

    // Disable staging
    const stagingCheckbox = screen.getByLabelText(/use staging environment/i)
    fireEvent.click(stagingCheckbox)

    // Fill in configuration
    const emailInput = screen.getByPlaceholderText('admin@example.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const tosCheckbox = screen.getByLabelText(/I agree to the Let's Encrypt Terms of Service/i)
    fireEvent.click(tosCheckbox)

    nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 4 (Review)

    expect(screen.getByText(/Production Mode/i)).toBeInTheDocument()
    expect(screen.getByText(/Real certificate - be careful with rate limits!/i)).toBeInTheDocument()
  })

  it('should show special message for DNS manual validation with staging', () => {
    renderWithProviders(<NewCertificatePage />)

    // Navigate to step 2 and select DNS
    const domainInput = screen.getByPlaceholderText('example.com')
    fireEvent.change(domainInput, { target: { value: 'test.com' } })

    let nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 2

    const dnsButton = screen.getByText('DNS')
    fireEvent.click(dnsButton)

    const manualButton = screen.getByText('Manual')
    fireEvent.click(manualButton)

    nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 3

    // Fill in configuration
    const emailInput = screen.getByPlaceholderText('admin@example.com')
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

    const tosCheckbox = screen.getByLabelText(/I agree to the Let's Encrypt Terms of Service/i)
    fireEvent.click(tosCheckbox)

    nextButton = screen.getByText('Next')
    fireEvent.click(nextButton) // Step 4 (Review)

    expect(screen.getByText(/especially important for manual DNS validation testing/i)).toBeInTheDocument()
  })
})
