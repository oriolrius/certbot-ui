import { useState } from 'react'
import { Download, AlertCircle, Info, Key, FileText, Lock } from 'lucide-react'
import { Button } from './ui/Button'

interface CertificateDownloadDialogProps {
  certificateName: string
  onClose: () => void
}

type CertificateFormat = 'pem' | 'der' | 'p7b' | 'pkcs12' | 'jks' | 'crt' | 'cer'
type CertificateComponent = 'cert' | 'fullchain' | 'chain' | 'privkey' | 'bundle'

interface FormatOption {
  value: CertificateFormat
  label: string
  description: string
  requiresPassword: boolean
  commonUses: string[]
}

interface ComponentOption {
  value: CertificateComponent
  label: string
  description: string
  icon: typeof FileText
  recommended: string[]
}

const FORMATS: FormatOption[] = [
  {
    value: 'pem',
    label: 'PEM',
    description: 'Most common format, ASCII text with BEGIN/END markers',
    requiresPassword: false,
    commonUses: ['Apache', 'Nginx', 'Most Linux servers', 'OpenSSL'],
  },
  {
    value: 'crt',
    label: 'CRT',
    description: 'Same as PEM but with .crt extension',
    requiresPassword: false,
    commonUses: ['Apache', 'Nginx', 'General use'],
  },
  {
    value: 'der',
    label: 'DER',
    description: 'Binary format of certificate',
    requiresPassword: false,
    commonUses: ['Java applications', 'Windows servers', 'Binary processing'],
  },
  {
    value: 'cer',
    label: 'CER (DER)',
    description: 'DER format with .cer extension for Windows',
    requiresPassword: false,
    commonUses: ['Windows servers', 'IIS', 'Active Directory'],
  },
  {
    value: 'p7b',
    label: 'PKCS#7 / P7B',
    description: 'Contains certificate and chain, no private key',
    requiresPassword: false,
    commonUses: ['Windows', 'Tomcat', 'Chain distribution'],
  },
  {
    value: 'pkcs12',
    label: 'PKCS#12 / PFX / P12',
    description: 'Archive format with cert, chain, and private key (password protected)',
    requiresPassword: true,
    commonUses: ['Windows IIS', 'Exchange', 'Email clients', 'Import/Export'],
  },
  {
    value: 'jks',
    label: 'Java KeyStore (JKS)',
    description: 'Java-specific keystore format (password protected)',
    requiresPassword: true,
    commonUses: ['Java applications', 'Tomcat', 'JBoss', 'WebSphere'],
  },
]

const COMPONENTS: ComponentOption[] = [
  {
    value: 'cert',
    label: 'Certificate Only',
    description: 'Just your domain certificate (no chain)',
    icon: FileText,
    recommended: ['Apache with separate chain', 'Testing'],
  },
  {
    value: 'fullchain',
    label: 'Full Chain',
    description: 'Certificate + intermediate certificates',
    icon: FileText,
    recommended: ['Nginx', 'Apache', 'Most web servers', 'Recommended for production'],
  },
  {
    value: 'chain',
    label: 'Chain Only',
    description: 'Intermediate certificates only',
    icon: FileText,
    recommended: ['Apache SSLCertificateChainFile', 'Manual chain configuration'],
  },
  {
    value: 'privkey',
    label: 'Private Key',
    description: 'Your certificate private key',
    icon: Key,
    recommended: ['Separate key file needed', 'Apache', 'Nginx'],
  },
  {
    value: 'bundle',
    label: 'Bundle (Cert + Key)',
    description: 'Full chain certificate and private key together',
    icon: Lock,
    recommended: ['HAProxy', 'Some load balancers', 'Single file deployment'],
  },
]

export default function CertificateDownloadDialog({
  certificateName,
  onClose,
}: CertificateDownloadDialogProps) {
  const [format, setFormat] = useState<CertificateFormat>('pem')
  const [component, setComponent] = useState<CertificateComponent>('fullchain')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedFormat = FORMATS.find((f) => f.value === format)
  const selectedComponent = COMPONENTS.find((c) => c.value === component)

  const handleDownload = async () => {
    setError(null)

    // Validate password if required
    if (selectedFormat?.requiresPassword && !password) {
      setError('Password is required for this format')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        format,
        component,
      })

      if (password) {
        params.append('password', password)
      }

      const response = await fetch(
        `/api/certificates/${encodeURIComponent(certificateName)}/download?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Download failed')
      }

      // Get filename from Content-Disposition header or construct it
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `${certificateName}-${component}.${format}`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/)
        if (match) {
          filename = match[1]
        }
      }

      // Create blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to download certificate')
    }
  }

  const handleDownloadRoot = async (root: 'x1' | 'x2') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/certificates/root/${root}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download root certificate')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `isrg-root-${root}.pem`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.message || 'Failed to download root certificate')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Download Certificate</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Certificate: <span className="font-mono font-semibold">{certificateName}</span>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-md bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="text-sm font-semibold mb-3 block">1. Select Format</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setFormat(fmt.value)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    format === fmt.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{fmt.label}</span>
                    {fmt.requiresPassword && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{fmt.description}</p>
                  <div className="text-xs text-muted-foreground">
                    <strong>Use with:</strong> {fmt.commonUses.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Component Selection */}
          <div>
            <label className="text-sm font-semibold mb-3 block">2. Select Component</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPONENTS.map((comp) => {
                const Icon = comp.icon
                return (
                  <button
                    key={comp.value}
                    onClick={() => setComponent(comp.value)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      component === comp.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold text-sm">{comp.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{comp.description}</p>
                    <div className="text-xs text-muted-foreground">
                      <strong>Best for:</strong> {comp.recommended.join(', ')}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Password Input */}
          {selectedFormat?.requiresPassword && (
            <div>
              <label className="text-sm font-semibold mb-2 block">
                3. Set Archive Password
              </label>
              <div className="flex gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password for archive"
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Required for {selectedFormat.label} format. Keep this password safe!
              </p>
            </div>
          )}

          {/* Info Box */}
          {selectedFormat && selectedComponent && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    You're downloading:
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    <strong>{selectedComponent.label}</strong> in <strong>{selectedFormat.label}</strong> format
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                    {selectedFormat.requiresPassword
                      ? '⚠️ This will create a password-protected archive'
                      : '✓ No password required'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Root CA Download Section */}
        <div className="px-6 pb-4">
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-2">Let's Encrypt Root CA Certificates</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Some servers or applications require the root CA certificate to establish the full trust chain.
            </p>

            <div className="space-y-3">
              {/* Root X1 */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-1">ISRG Root X1 (RSA 4096-bit)</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      The primary root certificate. Valid until 2035. Use this if:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Your certificate uses <strong>RSA</strong> keys (most common)</li>
                      <li>• You need maximum compatibility with older systems</li>
                      <li>• Your certificate chain includes intermediate signed by X1</li>
                      <li>• You're not sure which one to use (safest choice)</li>
                    </ul>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadRoot('x1')}
                    className="flex-shrink-0"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download X1
                  </Button>
                </div>
              </div>

              {/* Root X2 */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-1">ISRG Root X2 (ECDSA P-384)</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      The modern ECDSA root certificate. Valid until 2040. Use this if:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Your certificate uses <strong>ECDSA</strong> keys (elliptic curve)</li>
                      <li>• You want smaller certificate sizes and faster TLS handshakes</li>
                      <li>• Your certificate chain includes ECDSA intermediates (E1, E2, etc.)</li>
                      <li>• You're serving modern clients and want optimal performance</li>
                    </ul>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadRoot('x2')}
                    className="flex-shrink-0"
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download X2
                  </Button>
                </div>
              </div>

              {/* Help Text */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-medium text-blue-900 dark:text-blue-300">
                      When do you need the root CA certificate?
                    </p>
                    <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• <strong>Java KeyStores:</strong> Must include the root CA in the trust chain</li>
                      <li>• <strong>Custom Trust Stores:</strong> Applications with their own certificate validation</li>
                      <li>• <strong>Offline Verification:</strong> Systems that can't access online root stores</li>
                      <li>• <strong>Old Systems:</strong> Devices that don't have ISRG roots pre-installed</li>
                    </ul>
                    <p className="text-blue-700 dark:text-blue-300 mt-2 pt-2 border-t border-blue-500/20">
                      💡 <strong>Tip:</strong> Most modern systems (browsers, OS) already have these roots installed.
                      You typically only need to download them for specialized applications or older systems.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        </div>
      </div>
    </div>
  )
}
