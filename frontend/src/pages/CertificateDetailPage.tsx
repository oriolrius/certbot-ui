import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Trash2, AlertTriangle, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCertificate, useRenewCertificate, useDeleteCertificate } from '@/hooks/useCertificates'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { useState } from 'react'
import CertificateDownloadDialog from '@/components/CertificateDownloadDialog'

export default function CertificateDetailPage() {
  const { name } = useParams<{ name: string }>()
  const navigate = useNavigate()
  const { data: certificate, isLoading } = useCertificate(name!)
  const renewMutation = useRenewCertificate()
  const deleteMutation = useDeleteCertificate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDownloadDialog, setShowDownloadDialog] = useState(false)

  const handleRenew = async () => {
    try {
      await renewMutation.mutateAsync({ cert_name: name })
      alert('Certificate renewal initiated successfully')
    } catch (error: any) {
      alert(`Failed to renew certificate: ${error.message}`)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(name!)
      navigate('/certificates')
    } catch (error: any) {
      alert(`Failed to delete certificate: ${error.message}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading certificate...</p>
      </div>
    )
  }

  if (!certificate) {
    return (
      <div className="space-y-4">
        <Link to="/certificates">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Button>
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Certificate not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/certificates">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Certificates
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowDownloadDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handleRenew} disabled={renewMutation.isPending}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {renewMutation.isPending ? 'Renewing...' : 'Renew'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{certificate.name}</CardTitle>
              <Badge
                variant={
                  certificate.status === 'valid'
                    ? 'success'
                    : certificate.status === 'expiring_soon'
                    ? 'warning'
                    : 'destructive'
                }
              >
                {certificate.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                <p>{formatRelativeTime(certificate.expiry)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Expiry Date</h4>
                <p>{formatDate(certificate.expiry)}</p>
              </div>
              {certificate.serial_number && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Serial Number
                  </h4>
                  <p className="font-mono text-sm">{certificate.serial_number}</p>
                </div>
              )}
              {certificate.path && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Path</h4>
                  <p className="font-mono text-sm">{certificate.path}</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Domains</h4>
              <div className="flex flex-wrap gap-2">
                {certificate.domains.map((domain) => (
                  <Badge key={domain} variant="default">
                    {domain}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {(certificate.status === 'expired' || certificate.status === 'expiring_soon') && (
          <Card className="border-yellow-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <CardTitle>Action Required</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {certificate.status === 'expired'
                  ? 'This certificate has expired. Renew it immediately to avoid service disruption.'
                  : 'This certificate will expire soon. Consider renewing it to avoid service disruption.'}
              </p>
              <Button onClick={handleRenew} disabled={renewMutation.isPending}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Renew Now
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Download dialog */}
      {showDownloadDialog && (
        <CertificateDownloadDialog
          certificateName={certificate.name}
          onClose={() => setShowDownloadDialog(false)}
        />
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete Certificate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Are you sure you want to delete the certificate for <strong>{certificate.name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
