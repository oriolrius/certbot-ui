import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCertificates } from '@/hooks/useCertificates'
import { formatRelativeTime } from '@/lib/utils'

export default function CertificatesPage() {
  const { data: certificates = [], isLoading } = useCertificates()
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'expiry'>('expiry')

  const filteredCertificates = useMemo(() => {
    let filtered = certificates

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter((cert) => cert.status === filter)
    }

    // Search
    if (search) {
      filtered = filtered.filter(
        (cert) =>
          cert.name.toLowerCase().includes(search.toLowerCase()) ||
          cert.domains.some((d) => d.toLowerCase().includes(search.toLowerCase()))
      )
    }

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
    })
  }, [certificates, filter, search, sortBy])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading certificates...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificates</h1>
          <p className="text-muted-foreground">Manage your SSL/TLS certificates</p>
        </div>
        <Link to="/certificates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Certificate
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Certificates ({filteredCertificates.length})</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                />
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="valid">Valid</option>
                <option value="expiring_soon">Expiring Soon</option>
                <option value="expired">Expired</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'expiry')}
                className="px-4 py-2 rounded-md border border-input bg-background text-sm"
              >
                <option value="expiry">Sort by Expiry</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCertificates.map((cert) => (
              <div
                key={cert.name}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{cert.name}</h3>
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{formatRelativeTime(cert.expiry)}</span>
                    <span>•</span>
                    <span>{cert.domains.join(', ')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/certificates/${cert.name}`}>
                    <Button size="sm">Details</Button>
                  </Link>
                </div>
              </div>
            ))}
            {filteredCertificates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {search || filter !== 'all'
                    ? 'No certificates match your filters'
                    : 'No certificates yet'}
                </p>
                {!search && filter === 'all' && (
                  <Link to="/certificates/new">
                    <Button>Create your first certificate</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
