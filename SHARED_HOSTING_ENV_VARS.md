# Environment Variables for Shared Hosting

## Overview

This document lists all required environment variables for deploying PrimeAlfaTrade on shared hosting (cPanel).

## Frontend Environment Variables

### File Location
- For static builds: Set before building locally
- `.env` file in project root (Frontend/.env)

### Required Variables

```bash
# Backend API Base URL
# This is baked into the build during production build
VITE_API_BASE_URL=https://api.primealfatrade.com
```

### Important Notes

- **Build-Time Variable**: The API URL is compiled into the JavaScript bundle during build
- **Must Set Before Building**: Update this variable before running `npm run build`
- **No Runtime Configuration**: Cannot be changed after build without rebuilding
- **Production URL**: Must use the production backend domain

### Example .env File

```bash
# Frontend Environment Variables
VITE_API_BASE_URL=https://api.primealfatrade.com
```

## Backend Environment Variables

### Configuration Method

**Via cPanel Node.js App:**
1. Open "Setup Node.js App"
2. Click on your application
3. Scroll to "Environment Variables"
4. Add each variable with its value

### Required Variables

#### 1. Node Environment
```bash
NODE_ENV=production
```
- Sets Node.js to production mode
- Disables debug features
- Optimizes performance

#### 2. Server Configuration
```bash
PORT=5000
```
- Port for the backend server
- May be auto-assigned by hosting
- Check hosting documentation for port assignment

#### 3. Frontend URLs
```bash
FRONTEND_URL=https://primealfatrade.com
ALLOWED_ORIGINS=https://primealfatrade.com
CLIENT_URL=https://primealfatrade.com
```
- Frontend domain for CORS configuration
- Used for password reset links
- Used for OAuth redirects

#### 4. Database Configuration
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

**Components:**
- `username`: Database username from cPanel
- `password`: Database password from cPanel
- `localhost`: Database host (usually localhost)
- `5432`: PostgreSQL port (usually 5432)
- `database_name`: Database name from cPanel

**How to Get:**
1. In cPanel, open "PostgreSQL Databases"
2. Note database name, username, and password
3. Format as shown above

#### 5. Redis Configuration
```bash
REDIS_URL=redis://host:port
# OR for Upstash:
UPSTASH_REDIS_REST_URL=your_upstash_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token
```

**Options:**
- If hosting provides Redis: Use REDIS_URL
- If using Upstash: Use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
- If neither: Redis features will be disabled

#### 6. Security Secrets

**JWT Secrets:**
```bash
JWT_SECRET=your_64_byte_random_hex_string
REFRESH_SECRET=your_64_byte_random_hex_string
```

**How to Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run this command twice to generate both secrets.

**Cookie Secret:**
```bash
COOKIE_SECRET=your_64_byte_random_hex_string
```

**CSRF Secret:**
```bash
CSRF_SECRET=your_64_byte_random_hex_string
```

**Security Notes:**
- Must be 64-byte random hex strings
- Never use the same secret for different purposes
- Never share these secrets
- Never commit to version control
- Rotate periodically for security

#### 7. Email Configuration (SMTP)
```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password
```

**Common SMTP Providers:**
- Gmail: smtp.gmail.com:587
- SendGrid: smtp.sendgrid.net:587
- Mailgun: smtp.mailgun.org:587
- Hosting provider: Check hosting documentation

**Notes:**
- Use app-specific passwords for Gmail
- Enable "Less Secure Apps" or use app passwords
- Port 587 for TLS, 465 for SSL

#### 8. Google OAuth
```bash
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

**How to Get:**
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized origins: https://primealfatrade.com
4. Add authorized redirect URIs
5. Copy client ID

#### 9. Cloudinary Configuration
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to Get:**
1. Sign up at https://cloudinary.com
2. Create account
3. Get credentials from dashboard
4. Copy cloud name, API key, and API secret

#### 10. Development-Only Variables (Optional)
```bash
TEST_INITIAL_USDT=1000
```
- Only used when NODE_ENV=development
- Ignored in production
- Can be omitted for production

## Complete Backend Environment Variables List

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=5000

# Frontend URLs
FRONTEND_URL=https://primealfatrade.com
ALLOWED_ORIGINS=https://primealfatrade.com
CLIENT_URL=https://primealfatrade.com

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Redis (choose one)
REDIS_URL=redis://host:port
# OR
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Security Secrets
JWT_SECRET=your_64_byte_random_hex_string
REFRESH_SECRET=your_64_byte_random_hex_string
COOKIE_SECRET=your_64_byte_random_hex_string
CSRF_SECRET=your_64_byte_random_hex_string

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_email_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Development Only (optional)
TEST_INITIAL_USDT=1000
```

## Security Best Practices

### Secret Generation

1. **Use Cryptographically Secure Random Generator**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Generate Unique Secrets**
   - Never reuse secrets
   - Generate new secrets for each deployment
   - Use different secrets for different purposes

3. **Secret Storage**
   - Store in cPanel environment variables
   - Never commit to git
   - Never share via email/chat
   - Use password manager for storage

### Secret Rotation

**Rotate Secrets Periodically:**
- JWT secrets: Every 90 days
- Refresh secrets: Every 90 days
- Cookie secrets: Every 180 days
- CSRF secrets: Every 180 days

**Rotation Process:**
1. Generate new secrets
2. Update environment variables
3. Restart application
4. Monitor for issues
5. Keep old secrets for rollback (short term)

## Testing Environment Variables

### Frontend

1. **Set Variable Locally**
   ```bash
   VITE_API_BASE_URL=https://api.primealfatrade.com
   ```

2. **Build Production**
   ```bash
   npm run build
   ```

3. **Test Build**
   ```bash
   npm run preview
   ```

4. **Verify API URL**
   - Open browser console
   - Check network requests
   - Verify API URL is correct

### Backend

1. **Add Variables to cPanel**
   - Use "Setup Node.js App"
   - Add all required variables
   - Save configuration

2. **Restart Application**
   - Click "Restart" in cPanel
   - Wait for restart to complete

3. **Check Logs**
   - Review application logs
   - Look for missing variable errors
   - Verify all variables loaded

4. **Test Application**
   - Visit health endpoint
   - Test API endpoints
   - Verify database connection

## Troubleshooting Environment Variables

### Frontend API URL Not Working

**Problem**: Frontend connects to wrong API

**Solution**:
- Verify VITE_API_BASE_URL is set correctly
- Rebuild frontend with correct URL
- Clear browser cache
- Check browser console for API requests

### Backend Variables Not Loading

**Problem**: Application fails to start due to missing variables

**Solution**:
- Check all variables are added in cPanel
- Verify variable names match exactly
- Check for typos in variable names
- Review application logs for specific errors

### Database Connection Errors

**Problem**: Cannot connect to database

**Solution**:
- Verify DATABASE_URL format
- Check database credentials
- Ensure database exists
- Verify user has privileges
- Test connection via phpMyAdmin

### SMTP Not Working

**Problem**: Emails not sending

**Solution**:
- Verify SMTP credentials
- Check SMTP host and port
- Ensure SMTP is enabled for email provider
- Check hosting firewall settings
- Review application logs for SMTP errors

## Environment Variable Checklist

### Frontend
- [ ] VITE_API_BASE_URL set to https://api.primealfatrade.com
- [ ] Frontend built with correct API URL
- [ ] Build tested locally
- [ ] API connection verified

### Backend
- [ ] NODE_ENV set to production
- [ ] PORT configured
- [ ] FRONTEND_URL set correctly
- [ ] ALLOWED_ORIGINS set correctly
- [ ] CLIENT_URL set correctly
- [ ] DATABASE_URL configured with correct credentials
- [ ] REDIS_URL or UPSTASH_REDIS configured
- [ ] JWT_SECRET generated and set
- [ ] REFRESH_SECRET generated and set
- [ ] COOKIE_SECRET generated and set
- [ ] CSRF_SECRET generated and set
- [ ] SMTP credentials configured
- [ ] GOOGLE_CLIENT_ID configured
- [ ] Cloudinary credentials configured
- [ ] All secrets are unique and secure
- [ ] Application restarted after changes
- [ ] Application logs show no errors
