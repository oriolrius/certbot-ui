import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your Certbot UI preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              value="admin"
              disabled
              className="w-full px-3 py-2 rounded-md border border-input bg-muted mt-2"
            />
          </div>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certbot Configuration</CardTitle>
          <CardDescription>Default settings for certificate operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Default Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              className="w-full px-3 py-2 rounded-md border border-input bg-background mt-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default Plugin</label>
            <select className="w-full px-3 py-2 rounded-md border border-input bg-background mt-2">
              <option value="standalone">Standalone</option>
              <option value="webroot">Webroot</option>
              <option value="nginx">Nginx</option>
              <option value="apache">Apache</option>
            </select>
          </div>
          <div className="flex items-start gap-2 pt-2">
            <input type="checkbox" id="auto-renew" className="mt-1" />
            <label htmlFor="auto-renew" className="text-sm">
              Enable automatic renewal for new certificates
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure when you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2">
            <input type="checkbox" id="notify-expiring" className="mt-1" defaultChecked />
            <div className="flex-1">
              <label htmlFor="notify-expiring" className="text-sm font-medium">
                Expiring certificates
              </label>
              <p className="text-xs text-muted-foreground">
                Notify when certificates will expire in 30 days
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" id="notify-expired" className="mt-1" defaultChecked />
            <div className="flex-1">
              <label htmlFor="notify-expired" className="text-sm font-medium">
                Expired certificates
              </label>
              <p className="text-xs text-muted-foreground">
                Notify when certificates have expired
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" id="notify-renewed" className="mt-1" defaultChecked />
            <div className="flex-1">
              <label htmlFor="notify-renewed" className="text-sm font-medium">
                Successful renewals
              </label>
              <p className="text-xs text-muted-foreground">
                Notify when certificates are successfully renewed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  )
}
