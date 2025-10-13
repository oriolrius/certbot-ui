import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useObtainCertificate, useJobCompletion } from '@/hooks/useCertificates'
import { CertificateRequest } from '@/types'

const PLUGINS = [
  { value: 'standalone', label: 'Standalone', description: 'Use built-in web server (port 80/443 required)' },
  { value: 'webroot', label: 'Webroot', description: 'Place files in webroot directory' },
  { value: 'nginx', label: 'Nginx', description: 'Automatically configure Nginx' },
  { value: 'apache', label: 'Apache', description: 'Automatically configure Apache' },
  { value: 'dns', label: 'DNS', description: 'Add DNS TXT records (supports wildcards, manual validation)' },
]

const DNS_PROVIDERS = [
  { value: 'manual', label: 'Manual', description: 'Manually add DNS TXT records' },
  { value: 'cloudflare', label: 'Cloudflare', description: 'Automatic via Cloudflare API' },
  { value: 'route53', label: 'AWS Route53', description: 'Automatic via AWS Route53 API' },
  { value: 'digitalocean', label: 'DigitalOcean', description: 'Automatic via DigitalOcean API' },
  { value: 'google', label: 'Google Cloud DNS', description: 'Automatic via Google Cloud DNS API' },
]

export default function NewCertificatePage() {
  const navigate = useNavigate()
  const obtainMutation = useObtainCertificate()

  const [step, setStep] = useState(1)
  const [jobId, setJobId] = useState<string | null>(null)
  const [domains, setDomains] = useState<string[]>([''])
  const [email, setEmail] = useState('')
  const [plugin, setPlugin] = useState<'standalone' | 'webroot' | 'nginx' | 'apache' | 'dns'>('standalone')
  const [webrootPath, setWebrootPath] = useState('/var/www/html')
  const [dnsProvider, setDnsProvider] = useState<'manual' | 'cloudflare' | 'route53' | 'digitalocean' | 'google'>('manual')
  const [dnsCredentials, setDnsCredentials] = useState('')
  const [agreeTos, setAgreeTos] = useState(false)
  const [staging, setStaging] = useState(true) // Default to staging for safety

  const { job, isComplete, error: jobError, isInProgress } = useJobCompletion(jobId)

  const addDomain = () => setDomains([...domains, ''])
  const removeDomain = (index: number) => setDomains(domains.filter((_, i) => i !== index))
  const updateDomain = (index: number, value: string) => {
    const newDomains = [...domains]
    newDomains[index] = value
    setDomains(newDomains)
  }

  const canProceed = () => {
    if (step === 1) return domains.some((d) => d.trim())
    if (step === 2) return plugin
    if (step === 3) return email && agreeTos
    return true
  }

  const handleSubmit = async () => {
    const request: CertificateRequest = {
      domains: domains.filter((d) => d.trim()),
      email,
      plugin,
      webroot_path: plugin === 'webroot' ? webrootPath : undefined,
      dns_provider: plugin === 'dns' ? dnsProvider : undefined,
      dns_credentials: plugin === 'dns' && dnsProvider !== 'manual' ? dnsCredentials : undefined,
      agree_tos: agreeTos,
      staging,
    }

    try {
      const response = await obtainMutation.mutateAsync(request)
      setJobId(response.jobId)
      setStep(5) // Progress/Status step
    } catch (error: any) {
      alert(`Failed to obtain certificate: ${error.message}`)
    }
  }

  // Check for job completion and move to success step
  useEffect(() => {
    if (isComplete && step === 5) {
      setStep(6)
    }
  }, [isComplete, step])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/certificates">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New SSL/TLS Certificate</CardTitle>
          <CardDescription>
            Step {step} of 4 - Follow the wizard to obtain a new certificate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Domains */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Domain Names</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the domain names you want to secure with this certificate
                </p>
              </div>
              <div className="space-y-3">
                {domains.map((domain, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => updateDomain(index, e.target.value)}
                      placeholder="example.com"
                      className="flex-1 px-3 py-2 rounded-md border border-input bg-background"
                    />
                    {domains.length > 1 && (
                      <Button variant="outline" onClick={() => removeDomain(index)}>
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" onClick={addDomain}>
                  Add Domain
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Plugin */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Validation Method</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose how Certbot should validate domain ownership
                </p>
              </div>
              <div className="grid gap-3">
                {PLUGINS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlugin(p.value as any)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      plugin === p.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold">{p.label}</div>
                    <div className="text-sm text-muted-foreground">{p.description}</div>
                  </button>
                ))}
              </div>
              {plugin === 'webroot' && (
                <div className="mt-4">
                  <label className="text-sm font-medium">Webroot Path</label>
                  <input
                    type="text"
                    value={webrootPath}
                    onChange={(e) => setWebrootPath(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background mt-2"
                  />
                </div>
              )}
              {plugin === 'dns' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">DNS Provider</label>
                    <div className="grid gap-2">
                      {DNS_PROVIDERS.map((provider) => (
                        <button
                          key={provider.value}
                          onClick={() => setDnsProvider(provider.value as any)}
                          className={`p-3 rounded-md border text-left transition-colors ${
                            dnsProvider === provider.value
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="font-medium text-sm">{provider.label}</div>
                          <div className="text-xs text-muted-foreground">{provider.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {dnsProvider !== 'manual' && (
                    <div>
                      <label className="text-sm font-medium">API Credentials</label>
                      <textarea
                        value={dnsCredentials}
                        onChange={(e) => setDnsCredentials(e.target.value)}
                        placeholder={`Enter ${dnsProvider} API credentials (e.g., API token, access key)`}
                        className="w-full px-3 py-2 rounded-md border border-input bg-background mt-2 min-h-[80px]"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Credentials will be securely stored and used for automatic DNS record management
                      </p>
                    </div>
                  )}
                  {dnsProvider === 'manual' && (
                    <div className="p-4 rounded-md bg-blue-500/10 border border-blue-500/30 space-y-2">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        <strong>Manual DNS Validation Process:</strong>
                      </p>
                      <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                        <li>Click "Obtain Certificate" to start the process</li>
                        <li>Go to the <strong>Logs</strong> page to see the DNS TXT record details</li>
                        <li>Add the TXT record to your DNS provider as instructed</li>
                        <li>Wait for DNS propagation (~5-10 minutes)</li>
                        <li>The system will automatically verify and complete the process</li>
                      </ol>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                        💡 Tip: Keep the Logs page open in another tab to monitor the process in real-time.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Configuration */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Configuration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Provide your email and agree to the terms of service
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for urgent renewal and security notices
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="agree-tos"
                    checked={agreeTos}
                    onChange={(e) => setAgreeTos(e.target.checked)}
                    className="mt-1"
                  />
                  <label htmlFor="agree-tos" className="text-sm">
                    I agree to the Let's Encrypt Terms of Service
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="staging"
                      checked={staging}
                      onChange={(e) => setStaging(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="staging" className="text-sm">
                      Use staging environment (recommended for testing)
                    </label>
                  </div>
                  {!staging && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>⚠️ Production Mode Warning:</strong>
                      </p>
                      <ul className="text-xs text-red-600 dark:text-red-400 mt-2 space-y-1 list-disc list-inside">
                        <li>Rate limits: 300 orders per 3 hours</li>
                        <li>Only 5 authorization failures per hour allowed</li>
                        <li>50 certificates per domain per week</li>
                        <li>Use staging first to avoid hitting limits!</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Review & Confirm</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please review your configuration before proceeding
                </p>
              </div>
              <div className="space-y-4 p-4 rounded-lg bg-muted">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Domains</div>
                  <div className="mt-1">{domains.filter((d) => d.trim()).join(', ')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Plugin</div>
                  <div className="mt-1 capitalize">{plugin}</div>
                </div>
                {plugin === 'webroot' && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Webroot Path</div>
                    <div className="mt-1 font-mono text-sm">{webrootPath}</div>
                  </div>
                )}
                {plugin === 'dns' && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">DNS Provider</div>
                    <div className="mt-1 capitalize">{dnsProvider}</div>
                    {dnsProvider !== 'manual' && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        API credentials configured
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="mt-1">{email}</div>
                </div>
                {staging ? (
                  <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      ✓ <strong>Staging Mode:</strong> Certificate will not be trusted by browsers, but perfect for testing
                      {plugin === 'dns' && dnsProvider === 'manual' && (
                        <span> - especially important for manual DNS validation testing!</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      ⚠️ <strong>Production Mode:</strong> Real certificate - be careful with rate limits!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Progress/Status */}
          {step === 5 && (
            <div className="py-8 space-y-6">
              {jobError ? (
                <div className="text-center space-y-4">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-red-600">Operation Failed</h3>
                  <p className="text-muted-foreground">{jobError}</p>
                  <Button onClick={() => setStep(4)} variant="outline">
                    Go Back
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                    <h3 className="text-lg font-semibold">
                      {isInProgress ? 'Processing Certificate Request...' : 'Request Submitted'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {job?.progressMessage || 'Your request has been queued'}
                    </p>
                  </div>

                  {/* DNS Challenge Information */}
                  {job?.dnsChallenge && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300">
                          DNS Challenge Required
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-blue-800 dark:text-blue-200">
                          Please add the following DNS TXT record to your DNS provider:
                        </p>
                        <div className="bg-white/50 dark:bg-black/20 p-3 rounded-md font-mono text-xs space-y-1">
                          <div>
                            <span className="text-muted-foreground">Record Type:</span> TXT
                          </div>
                          <div>
                            <span className="text-muted-foreground">Name:</span>{' '}
                            {job.dnsChallenge.record_name}
                          </div>
                          <div className="break-all">
                            <span className="text-muted-foreground">Value:</span>{' '}
                            {job.dnsChallenge.validation}
                          </div>
                          <div>
                            <span className="text-muted-foreground">TTL:</span> 300 (or lowest available)
                          </div>
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          💡 The system will wait for up to 90 seconds for DNS propagation before verifying.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Progress Information */}
                  {job && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="font-medium capitalize">{job.status.replace('_', ' ')}</span>
                      </div>
                      {job.progress !== undefined && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress:</span>
                            <span className="font-medium">{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary rounded-full h-2 transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      This page will automatically update when the operation completes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h3 className="text-lg font-semibold">Certificate Obtained!</h3>
              <p className="text-muted-foreground">
                Your certificate has been successfully obtained and is ready to use.
              </p>
              <Button onClick={() => navigate('/certificates')}>
                View Certificates
              </Button>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && step !== 0 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={obtainMutation.isPending}
                >
                  {obtainMutation.isPending ? 'Obtaining...' : 'Obtain Certificate'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
