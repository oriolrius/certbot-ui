import { Link } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCertificates } from '@/hooks/useCertificates'
import { formatRelativeTime } from '@/lib/utils'

export default function DashboardPage() {
  const { data: certificates = [], isLoading } = useCertificates()

  const totalCerts = certificates.length
  const validCerts = certificates.filter((c) => c.status === 'valid').length
  const expiringSoon = certificates.filter((c) => c.status === 'expiring_soon').length
  const expired = certificates.filter((c) => c.status === 'expired').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your SSL certificates</p>
        </div>
        <Link to="/certificates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Certificate
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCerts}</div>
            <p className="text-xs text-muted-foreground">Active certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{validCerts}</div>
            <p className="text-xs text-muted-foreground">Healthy certificates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expired}</div>
            <p className="text-xs text-muted-foreground">Action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Certificates needing attention */}
      {(expiringSoon > 0 || expired > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Certificates Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certificates
                .filter((c) => c.status !== 'valid')
                .map((cert) => (
                  <div
                    key={cert.name}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{cert.name}</p>
                        <Badge variant={cert.status === 'expired' ? 'destructive' : 'warning'}>
                          {cert.status === 'expired' ? 'Expired' : 'Expiring Soon'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeTime(cert.expiry)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cert.domains.join(', ')}
                      </p>
                    </div>
                    <Link to={`/certificates/${cert.name}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent certificates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Certificates</CardTitle>
            <Link to="/certificates">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certificates.slice(0, 5).map((cert) => (
              <div
                key={cert.name}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{cert.name}</p>
                    <Badge
                      variant={
                        cert.status === 'valid'
                          ? 'success'
                          : cert.status === 'expiring_soon'
                          ? 'warning'
                          : 'destructive'
                      }
                    >
                      {cert.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(cert.expiry)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cert.domains.join(', ')}
                  </p>
                </div>
                <Link to={`/certificates/${cert.name}`}>
                  <Button size="sm" variant="outline">
                    Details
                  </Button>
                </Link>
              </div>
            ))}
            {certificates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No certificates yet</p>
                <Link to="/certificates/new">
                  <Button className="mt-4">Create your first certificate</Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
