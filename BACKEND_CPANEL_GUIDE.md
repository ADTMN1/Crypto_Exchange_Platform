# Backend cPanel Deployment Guide

## Overview

This guide covers deploying the PrimeAlfaTrade backend Node.js application on cPanel shared hosting.

**Domain**: https://api.primealfatrade.com
**Hosting**: Hahu Cloud (cPanel)

## Prerequisites

- cPanel with Node.js support
- Subdomain: api.primealfatrade.com
- PostgreSQL database access
- Ability to upload files via File Manager or FTP

## Step 1: Check Node.js Support in cPanel

### Verify Node.js Availability

1. **Login to cPanel**
   - Navigate to your hosting control panel
   - Login with your credentials

2. **Look for Node.js Options**
   - Search for "Setup Node.js App" or "Select Node.js Version"
   - If found, your hosting supports Node.js applications
   - If not found, backend must be hosted separately

3. **Check Available Versions**
   - Note the available Node.js versions
   - Ensure version 20.x or later is available
   - This project requires Node.js 20.x

### Alternative: Separate Node.js Hosting

If cPanel doesn't support Node.js:
- Use a Node.js hosting service (e.g., Render, Heroku, Railway)
- Deploy backend there and use the provided URL
- Update frontend API URL accordingly

## Step 2: Prepare Backend Files Locally

### Install Production Dependencies

```bash
cd Backend
npm install --production
```

This installs only production dependencies, excluding development tools.

### Clean Development Files

Remove or exclude:
- `node_modules` folder (will be reinstalled on server)
- Development-only files
- Test files
- `.git` folder

### Verify Required Files

Ensure these files are present:
- `package.json` - Dependencies and scripts
- `package-lock.json` - Dependency lock file
- `index.js` - Application entry point
- `app.js` - Express application
- `src/` folder - Source code
- `.env.example` - Environment variables template

### Check package.json

Verify `package.json` has:
```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "migrate": "...",
    "seed:roles": "...",
    "seed:admin": "..."
  },
  "dependencies": {
    // production dependencies
  }
}
```

## Step 3: Create Subdomain

### Create API Subdomain

1. **In cPanel**
   - Open "Subdomains"
   - Click "Create Subdomain"

2. **Configure Subdomain**
   - Subdomain: `api`
   - Domain: `primealfatrade.com`
   - Document Root: `/api` (or choose a different path)

3. **Verify Creation**
   - Subdomain should appear in list
   - Document root folder should be created

## Step 4: Upload Backend Files

### Method A: File Manager

1. **Open File Manager**
   - Navigate to the subdomain folder (e.g., `/api`)
   - This is outside `public_html` for security

2. **Upload Files**
   - Upload all Backend files
   - Maintain folder structure
   - Exclude `node_modules` (will be installed on server)

3. **Set Permissions**
   - Files: 644
   - Folders: 755
   - `.env` file: 600 (if created)

### Method B: FTP Upload

1. **Connect via FTP**
   - Navigate to subdomain folder
   - Upload all Backend files
   - Maintain folder structure

## Step 5: Configure Node.js Application

### Setup Node.js App

1. **Open "Setup Node.js App"**
   - In cPanel, find and open this tool

2. **Create Application**
   - Click "Create Application"

3. **Configure Application Settings**

   **Basic Settings:**
   - **Node.js version**: Select 20.x or latest available
   - **Application mode**: Production
   - **Application root**: `/api` (or your subdomain path)
   - **Application URL**: `api.primealfatrade.com`
   - **Application startup file**: `index.js`

4. **Click Create**
   - This creates the application configuration
   - It will install dependencies automatically

## Step 6: Configure Environment Variables

### Add Environment Variables

1. **Open Application Settings**
   - In "Setup Node.js App", click on your application
   - Scroll to "Environment Variables" section

2. **Add Required Variables**

   Click "Add Variable" for each:

   ```bash
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://primealfatrade.com
   ALLOWED_ORIGINS=https://primealfatrade.com
   CLIENT_URL=https://primealfatrade.com
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
   REDIS_URL=redis://[host]:[port]
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

3. **Generate Secrets**

   Use Node.js to generate secure secrets:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Run this 4 times for:
   - JWT_SECRET
   - REFRESH_SECRET
   - COOKIE_SECRET
   - CSRF_SECRET

4. **Save Variables**
   - Click "Save" after adding all variables

## Step 7: Setup Database

### Create PostgreSQL Database

1. **Open "PostgreSQL Databases"**
   - In cPanel, find this tool

2. **Create Database**
   - Enter database name (e.g., `primealfa_db`)
   - Click "Create Database"

3. **Create Database User**
   - Enter username
   - Generate strong password
   - Click "Create User"

4. **Add User to Database**
   - Select user and database
   - Grant "ALL PRIVILEGES"
   - Click "Add User to Database"

5. **Note Connection Details**
   - Database name
   - Username
   - Password
   - Host (usually `localhost`)
   - Port (usually `5432`)

### Update DATABASE_URL

Update the DATABASE_URL environment variable with your database credentials:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## Step 8: Run Database Migrations

### Method A: cPanel Terminal (if available)

1. **Open Terminal**
   - In cPanel, open "Terminal"

2. **Navigate to Application**
   ```bash
   cd api
   ```

3. **Run Migrations**
   ```bash
   npm run migrate
   ```

4. **Seed Initial Data**
   ```bash
   npm run seed:roles
   npm run seed:admin
   ```

### Method B: phpMyAdmin

1. **Open phpMyAdmin**
   - In cPanel, open phpMyAdmin

2. **Select Database**
   - Choose your database from the left panel

3. **Import Schema**
   - Click "Import" tab
   - Choose file: `Backend/src/models/schema.sql`
   - Click "Go"

4. **Verify Tables**
   - Check that all tables were created
   - Verify table structure

## Step 9: Start Application

### Start Node.js Application

1. **In "Setup Node.js App"**
   - Find your application
   - Click "Restart" button

2. **Check Status**
   - Status should show "Running"
   - If not, check logs for errors

3. **View Logs**
   - Click "Application Logs" section
   - Review for any errors
   - Address any issues found

### Verify Application is Running

1. **Test Health Endpoint**
   - Visit: https://api.primealfatrade.com/health
   - Should return success response

2. **Test API Root**
   - Visit: https://api.primealfatrade.com/api
   - Should return API status message

## Step 10: Configure SSL

### Install SSL for Subdomain

1. **Open "SSL/TLS Status"**
   - In cPanel, find this tool

2. **Install SSL**
   - Find `api.primealfatrade.com`
   - Click "Run AutoSSL"
   - Or use "Let's Encrypt" if available

3. **Verify SSL**
   - Visit https://api.primealfatrade.com
   - Check for lock icon in browser
   - Verify certificate is valid

## Step 11: Security Configuration

### Enable Rate Limiting

Edit `Backend/app.js` and uncomment rate limiting:

```javascript
// 6. DDoS & API Abuse Protection - ENABLED for production
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

Edit `Backend/app.js` and uncomment CSRF protection:

```javascript
// 11. CSRF protection ENABLED for production
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/csrf-token') {
    return next();
  }
  doubleCsrfProtection(req, res, next);
});
```

### Restart Application

After making changes:
1. Go to "Setup Node.js App"
2. Click "Restart"
3. Verify application still runs

## Step 12: Test API Endpoints

### Test Authentication

```bash
# Test registration
curl -X POST https://api.primealfatrade.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test health
curl https://api.primealfatrade.com/health
```

### Test CORS

1. Open browser console on frontend
2. Make API call:
```javascript
fetch('https://api.primealfatrade.com/health')
  .then(r => r.json())
  .then(console.log)
```
3. Should not show CORS errors

## Step 13: Configure Redis (Optional)

### If Using Upstash Redis

1. **Get Upstash Credentials**
   - Sign up at https://upstash.com
   - Create Redis database
   - Get REST URL and token

2. **Update Environment Variables**
   ```bash
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token
   ```

3. **Restart Application**
   - Apply changes
   - Restart application

### If Hosting Provides Redis

1. **Check Redis Availability**
   - Contact hosting support
   - Get Redis connection details

2. **Configure REDIS_URL**
   ```bash
   REDIS_URL=redis://host:port
   ```

## Step 14: Monitoring and Logs

### View Application Logs

1. **In "Setup Node.js App"**
   - Click on your application
   - Scroll to "Application Logs"

2. **Review Logs**
   - Check for errors
   - Monitor performance
   - Track issues

### View Error Logs

1. **In cPanel**
   - Open "Errors" section
   - Review error logs

### Database Monitoring

1. **Via phpMyAdmin**
   - Monitor database size
   - Check table statistics
   - Review slow queries

## Step 15: Backup Strategy

### Database Backup

1. **Via cPanel Backups**
   - Open "Backups" or "Backup Wizard"
   - Create database backup
   - Download to local storage

2. **Via phpMyAdmin**
   - Open phpMyAdmin
   - Select database
   - Click "Export"
   - Download backup file

### File Backup

1. **Via cPanel Backups**
   - Create full backup
   - Include home directory
   - Download backup file

### Automated Backups

If available:
1. Configure automated backups in cPanel
2. Set frequency (daily recommended)
3. Set retention period

## Troubleshooting

### Application Won't Start

**Problem**: Application fails to start

**Solutions**:
- Check Node.js version compatibility
- Verify all dependencies installed
- Review application logs for errors
- Check environment variables
- Verify port is not in use

### Database Connection Errors

**Problem**: Cannot connect to database

**Solutions**:
- Verify database credentials
- Check database exists
- Ensure user has privileges
- Test connection via phpMyAdmin
- Check DATABASE_URL format

### Port Already in Use

**Problem**: Port conflict error

**Solutions**:
- Use port assigned by hosting
- Update PORT environment variable
- Check hosting documentation for port assignment

### Dependencies Not Installing

**Problem**: npm install fails

**Solutions**:
- Check Node.js version
- Verify package.json is valid
- Check for network issues
- Try manual installation via Terminal

### SSL Issues

**Problem**: HTTPS not working

**Solutions**:
- Verify SSL is installed for subdomain
- Check SSL certificate validity
- Ensure application uses HTTPS
- Check cPanel SSL configuration

### CORS Errors

**Problem**: Frontend cannot connect to API

**Solutions**:
- Verify ALLOWED_ORIGINS includes frontend domain
- Check CORS configuration in app.js
- Ensure frontend uses HTTPS
- Verify both domains have SSL

## Maintenance

### Regular Tasks

- Review application logs weekly
- Update dependencies monthly
- Check SSL certificate expiry
- Monitor database size
- Review error logs

### Security Updates

- Keep Node.js version updated
- Update npm packages regularly
- Review security advisories
- Monitor for vulnerabilities
- Rotate secrets periodically

### Performance Monitoring

- Monitor application response times
- Check database query performance
- Review resource usage
- Optimize slow queries
- Monitor error rates

## Limitations of Shared Hosting

### Resource Limitations

- Shared resources with other users
- CPU and memory limits
- Potential performance impact
- Limited control over configuration

### When to Consider VPS

Consider upgrading if:
- High traffic volume
- Need custom server configuration
- Require dedicated resources
- Need advanced monitoring
- Performance issues on shared hosting

## Support

### Hosting Support

- Contact Hahu Cloud support
- Check cPanel documentation
- Review hosting provider knowledge base

### Application Support

- Review error logs
- Check application documentation
- Test in development environment first
