# PrimeAlfaTrade Shared Hosting Deployment Guide

## Hosting Environment

**Frontend Domain**: https://primealfatrade.com
**Backend API Domain**: https://api.primealfatrade.com
**Hosting Type**: Shared Hosting (cPanel)
**Hosting Provider**: Hahu Cloud

## Prerequisites

### Frontend Requirements
- cPanel access with file manager
- Domain: primealfatrade.com pointed to hosting
- Ability to upload files via File Manager or FTP
- SSL certificate (usually provided by hosting)

### Backend Requirements
- cPanel with Node.js support (Select Node.js version in cPanel)
- Subdomain: api.primealfatrade.com
- PostgreSQL database access (via cPanel)
- Environment variable support (via .htaccess or cPanel interface)
- SSL certificate for subdomain

## FRONTEND DEPLOYMENT (Static Files)

### Step 1: Build Production Files

On your local machine:

```bash
cd Frontend
npm install
npm run build
```

This creates a `dist` folder with production-ready static files.

### Step 2: Upload to cPanel

**Via File Manager:**
1. Login to cPanel
2. Open File Manager
3. Navigate to `public_html` folder
4. Delete existing files (if any)
5. Upload all contents from `Frontend/dist` folder
6. Ensure `index.html` is in the root of `public_html`

**Via FTP:**
1. Connect to your hosting via FTP
2. Navigate to `public_html`
3. Upload all contents from `Frontend/dist` folder

### Step 3: Configure Environment

Create or edit `.env` file in `public_html`:

```bash
VITE_API_BASE_URL=https://api.primealfatrade.com
```

**Note:** For static builds, you may need to hardcode the API URL in the build process or use a configuration file that's loaded at runtime.

### Step 4: Configure SPA Routing

Create `.htaccess` file in `public_html` to handle SPA routing:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Step 5: Verify Deployment

1. Visit https://primealfatrade.com
2. Check that the page loads correctly
3. Verify all assets (CSS, JS, images) load
4. Test API connectivity
5. Check browser console for errors

## BACKEND DEPLOYMENT (Node.js Application)

### Step 1: Check Node.js Hosting Support

**In cPanel:**
1. Look for "Setup Node.js App" or "Select Node.js Version"
2. If not available, backend must be hosted on a separate Node.js hosting service

### Step 2: Prepare Backend Files

On your local machine:

```bash
cd Backend
npm install --production
```

**Remove development files:**
- Delete `node_modules` (will be reinstalled on server)
- Keep `package.json` and `package-lock.json`
- Remove any development-only scripts

### Step 3: Upload Backend Files

**Via File Manager:**
1. Create a folder outside `public_html`, e.g., `api` or `backend`
2. Upload all Backend files to this folder
3. Ensure `index.js` is present

### Step 4: Configure Node.js Application in cPanel

**If using "Setup Node.js App":**
1. Open "Setup Node.js App" in cPanel
2. Click "Create Application"
3. Configure:
   - **Node.js version**: 20.x (or latest available)
   - **Application mode**: Production
   - **Application root**: `/api` (or your backend folder)
   - **Application URL**: `api.primealfatrade.com`
   - **Application startup file**: `index.js`
4. Click "Create"

### Step 5: Configure Environment Variables

**Via cPanel Node.js App interface:**
1. Open your Node.js application
2. Click "Environment Variables"
3. Add the following variables:

```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://primealfatrade.com
ALLOWED_ORIGINS=https://primealfatrade.com
CLIENT_URL=https://primealfatrade.com
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
REDIS_URL=redis://[host]:[port] or UPSTASH_REDIS_REST_URL
JWT_SECRET=[64-byte random hex]
REFRESH_SECRET=[64-byte random hex]
COOKIE_SECRET=[64-byte random hex]
CSRF_SECRET=[64-byte random hex]
SMTP_HOST=[SMTP host]
SMTP_PORT=[SMTP port]
SMTP_USER=[SMTP username]
SMTP_PASS=[SMTP password]
GOOGLE_CLIENT_ID=[Google OAuth client ID]
CLOUDINARY_CLOUD_NAME=[Cloudinary cloud name]
CLOUDINARY_API_KEY=[Cloudinary API key]
CLOUDINARY_API_SECRET=[Cloudinary API secret]
```

**Generate secrets using:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 6: Run Database Migrations

**Via cPanel Terminal (if available):**
```bash
cd api
npm run migrate
```

**Or via phpMyAdmin:**
1. Open phpMyAdmin in cPanel
2. Select your database
3. Import the SQL file from `Backend/src/models/schema.sql`

### Step 7: Start Application

**Via cPanel Node.js App interface:**
1. Click "Restart" button
2. Check application status
3. View logs for any errors

### Step 8: Verify Backend Deployment

1. Visit https://api.primealfatrade.com/health
2. Check that response is successful
3. Test API endpoints
4. Check application logs for errors

## DATABASE SETUP

### Step 1: Create PostgreSQL Database

**Via cPanel:**
1. Open "PostgreSQL Databases"
2. Create a new database
3. Create a database user
4. Add user to database with all privileges

### Step 2: Configure Database Connection

Update `DATABASE_URL` in your environment variables:

```bash
DATABASE_URL=postgresql://[username]:[password]@localhost:5432/[database_name]
```

### Step 3: Run Migrations

See Step 6 in Backend Deployment above.

### Step 4: Seed Initial Data

Run seed scripts to create initial roles and admin user:

```bash
npm run seed:roles
npm run seed:admin
```

## SSL CONFIGURATION

### Frontend SSL (primealfatrade.com)

**Via cPanel:**
1. Open "SSL/TLS Status"
2. Check if SSL is auto-enabled by hosting
3. If not, use "Let's Encrypt" to install free SSL
4. Force HTTPS redirect via `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Backend SSL (api.primealfatrade.com)

**Via cPanel:**
1. Create subdomain `api.primealfatrade.com`
2. Open "SSL/TLS Status"
3. Install SSL for the subdomain
4. Ensure Node.js app uses HTTPS

## SECURITY CONFIGURATION

### Enable Rate Limiting

In `Backend/app.js`, uncomment the rate limiting section:

```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this network. Please try again later.' },
  skip: (req) => req.path === '/csrf-token',
});
app.use('/api', apiLimiter);
```

### Enable CSRF Protection

In `Backend/app.js`, uncomment the CSRF protection section:

```javascript
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/csrf-token') {
    return next();
  }
  doubleCsrfProtection(req, res, next);
});
```

## TROUBLESHOOTING

### Frontend Issues

**404 Errors on Refresh:**
- Ensure `.htaccess` file is present in `public_html`
- Verify SPA routing rules are correct

**Assets Not Loading:**
- Check file paths in `dist` folder
- Verify files were uploaded correctly
- Check browser console for specific errors

**API Connection Errors:**
- Verify `VITE_API_BASE_URL` is correct
- Check backend is running
- Verify CORS configuration

### Backend Issues

**Application Won't Start:**
-检查 Node.js version compatibility
- Verify all dependencies installed
- Check environment variables
- Review application logs in cPanel

**Database Connection Errors:**
- Verify database credentials
- Check database exists
- Ensure user has proper privileges
- Test connection via phpMyAdmin

**Port Conflicts:**
- Use port provided by hosting (usually auto-assigned)
- Update PORT environment variable accordingly

## MONITORING (Shared Hosting)

### Application Logs

**Via cPanel:**
1. Open "Setup Node.js App"
2. Click on your application
3. View "Application Logs" section

### Error Logs

**Via cPanel:**
1. Open "Errors" section
2. Review error logs for both frontend and backend

### Database Monitoring

**Via phpMyAdmin:**
1. Monitor database size
2. Check for slow queries
3. Review table statistics

## BACKUP STRATEGY (Shared Hosting)

### Database Backup

**Via cPanel:**
1. Open "Backups" or "phpMyAdmin"
2. Export database regularly
3. Download backup files to local storage

### File Backup

**Via cPanel:**
1. Use "Backup Wizard" or "Backups"
2. Create full backup of home directory
3. Download backup files

### Automated Backups

**If available in cPanel:**
1. Configure automated backups
2. Set backup frequency (daily recommended)
3. Set retention period

## PERFORMANCE OPTIMIZATION

### Frontend Optimization

- Enable gzip compression via `.htaccess`
- Leverage browser caching
- Optimize images before upload
- Minify CSS and JS (already done by Vite build)

### Backend Optimization

- Enable database query caching
- Use Redis for session storage
- Optimize database queries
- Enable compression in Express

## MAINTENANCE

### Regular Tasks

- Review logs weekly
- Update dependencies monthly
- Check SSL certificate expiry
- Monitor disk space usage
- Review database size

### Security Updates

- Keep Node.js version updated
- Update npm packages regularly
- Review security advisories
- Monitor for vulnerabilities

## SUPPORT CONTACT

**Hosting Provider**: Hahu Cloud
**cPanel Support**: Available via hosting control panel
**Documentation**: Check hosting provider's knowledge base

## LIMITATIONS OF SHARED HOSTING

### Known Limitations

- Limited control over server configuration
- Resource sharing with other users
- Potential performance limitations
- Limited monitoring tools
- Restricted access to system logs

### When to Consider VPS

Consider upgrading to VPS if:
- High traffic volume (>10,000 daily users)
- Need custom server configuration
- Require advanced monitoring
- Need dedicated resources
- Performance issues on shared hosting
