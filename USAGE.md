# Usage Guide

## Getting Started

### First Login

1. Navigate to `http://localhost:3000`
2. Log in with credentials:
   - Username: `admin`
   - Password: `admin123`
3. **Important**: Change the default password immediately in Settings

## Dashboard

The dashboard provides an at-a-glance view of your certificates:

- **Total Certificates**: Total number of managed certificates
- **Valid**: Certificates that are currently valid
- **Expiring Soon**: Certificates expiring within 30 days
- **Expired**: Certificates that have already expired

### Quick Actions

- Click **"New Certificate"** to start the wizard
- View certificate details by clicking on any certificate card

## Obtaining a New Certificate

### Step 1: Domain Names

1. Click **"New Certificate"** from the dashboard or certificates page
2. Enter the domain name(s) you want to secure
3. Click **"Add Domain"** to add multiple domains to a single certificate
4. Click **"Next"**

**Tips:**
- You can include multiple domains in one certificate
- Wildcard domains are supported (e.g., `*.example.com`)
- Don't include `http://` or `https://` - just the domain name

### Step 2: Validation Method

Choose how Certbot will verify you own the domain:

#### Standalone
- Uses Certbot's built-in web server
- **Requires**: Ports 80 and/or 443 to be available
- **Best for**: Servers not running a web server

#### Webroot
- Places verification files in your webroot directory
- **Requires**: Specify the webroot path (e.g., `/var/www/html`)
- **Best for**: Servers with an existing web server

#### Nginx
- Automatically configures Nginx
- **Best for**: Servers running Nginx

#### Apache
- Automatically configures Apache
- **Best for**: Servers running Apache

### Step 3: Configuration

1. **Email Address**: Used for renewal reminders and security notices
2. **Terms of Service**: Must be accepted to proceed
3. **Staging Environment** (optional): Use for testing without hitting rate limits

### Step 4: Review & Confirm

Review your configuration and click **"Obtain Certificate"**

The process typically takes 30-60 seconds.

## Managing Certificates

### Viewing Certificates

1. Go to the **Certificates** page
2. Use filters to find specific certificates:
   - **Search**: Filter by name or domain
   - **Status Filter**: Show only valid, expiring, or expired certificates
   - **Sort**: Order by name or expiry date

### Certificate Details

Click on any certificate to view:
- Status and expiry information
- All associated domains
- Serial number
- Certificate file paths

### Renewing Certificates

#### Manual Renewal

1. Open the certificate details page
2. Click **"Renew"**
3. Wait for the renewal process to complete

#### Automatic Renewal

Certbot includes a built-in renewal mechanism. The UI displays when certificates will be automatically renewed.

### Revoking Certificates

⚠️ **Warning**: This action cannot be undone

1. Open the certificate details page
2. Click **"Revoke"** (if needed)
3. Follow the wizard to complete revocation

### Deleting Certificates

⚠️ **Warning**: This permanently removes the certificate

1. Open the certificate details page
2. Click **"Delete"**
3. Confirm the deletion

## Viewing Logs

Access Certbot operation logs:

1. Go to the **Logs** page
2. Select the number of log lines to display
3. Click **"Refresh"** to update

Logs are useful for:
- Troubleshooting failed operations
- Verifying successful renewals
- Debugging configuration issues

## Settings

### Account Settings

- Change your password
- View your username

### Certbot Configuration

- **Default Email**: Pre-fill email for new certificates
- **Default Plugin**: Pre-select validation method
- **Auto-renewal**: Enable/disable automatic renewal

### Notifications

Configure when to receive notifications:
- Expiring certificates (30 days)
- Expired certificates
- Successful renewals

## Best Practices

### Security

1. **Change Default Password**: Immediately after first login
2. **Use Strong Passwords**: At least 8 characters with mixed case
3. **Limit Access**: Run behind a firewall or VPN
4. **Review Logs**: Regularly check for suspicious activity

### Certificate Management

1. **Monitor Expiry**: Check dashboard regularly
2. **Test First**: Use staging environment for testing
3. **Backup Certificates**: Regularly backup `/etc/letsencrypt`
4. **Document Changes**: Note any configuration changes

### Renewal

1. **Automatic Renewal**: Let Certbot handle renewals automatically
2. **Monitor Failures**: Check logs if renewal fails
3. **Test Renewal**: Use dry-run option to test without executing

## Troubleshooting

### Certificate Acquisition Fails

- Check domain DNS is correctly configured
- Verify ports 80/443 are accessible
- Review logs for specific error messages
- Try staging environment first

### Renewal Fails

- Check certificate hasn't been revoked
- Verify domain is still pointing to your server
- Ensure web server configuration is correct

### Permission Errors

- Backend must run with sufficient privileges
- Check Certbot can access its directories
- Verify log directories are writable

## Getting Help

- Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review Certbot logs
- Consult [Certbot documentation](https://eff-certbot.readthedocs.io/)
