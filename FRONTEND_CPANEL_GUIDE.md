# Frontend cPanel Deployment Guide

## Overview

This guide covers deploying the PrimeAlfaTrade frontend as static files on cPanel shared hosting.

**Domain**: https://primealfatrade.com
**Hosting**: Hahu Cloud (cPanel)

## Prerequisites

- cPanel access
- Domain pointed to hosting account
- Node.js installed locally for building
- FTP client or cPanel File Manager access

## Step 1: Build Production Files Locally

### Install Dependencies
```bash
cd Frontend
npm install
```

### Build for Production
```bash
npm run build
```

This creates a `dist` folder containing:
- `index.html` - Main HTML file
- `assets/` - CSS, JS, images, fonts
- All optimized and minified files

### Verify Build
Check that the `dist` folder contains:
- `index.html`
- `assets/` folder with CSS and JS files
- No source maps (for production)

## Step 2: Prepare for Upload

### Check Environment Variables

Verify `.env` file has correct production API URL:

```bash
VITE_API_BASE_URL=https://api.primealfatrade.com
```

**Important**: For static builds, the API URL is baked into the JavaScript bundle during build time. Ensure this is set correctly before building.

### Test Locally
```bash
npm run preview
```

Visit `http://localhost:4173` to verify the build works locally.

## Step 3: Upload to cPanel

### Method A: File Manager

1. **Login to cPanel**
   - Navigate to your hosting control panel
   - Login with your credentials

2. **Open File Manager**
   - Find "File Manager" icon
   - Click to open

3. **Navigate to public_html**
   - Go to your home directory
   - Open `public_html` folder
   - This is the web root for primealfatrade.com

4. **Clean Existing Files**
   - Select all files in `public_html`
   - Delete them (backup if needed)

5. **Upload Build Files**
   - Click "Upload" button
   - Select all files from `Frontend/dist` folder
   - Or upload the entire `dist` folder and extract

6. **Verify Upload**
   - Ensure `index.html` is in root
   - Check `assets/` folder structure
   - Verify all files are present

### Method B: FTP Upload

1. **Configure FTP Client**
   - Host: Your hosting FTP address
   - Username: cPanel username
   - Password: cPanel password
   - Port: 21 (or as provided)

2. **Connect and Navigate**
   - Connect to server
   - Navigate to `public_html`

3. **Upload Files**
   - Upload all contents from `Frontend/dist`
   - Maintain folder structure

4. **Verify Upload**
   - Check file sizes match
   - Verify folder structure

## Step 4: Configure .htaccess for SPA Routing

Create `.htaccess` file in `public_html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Handle React Router
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Gzip Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

## Step 5: Configure HTTPS Redirect

Add to `.htaccess` (before other rules):

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## Step 6: Verify Deployment

### Basic Checks

1. **Visit Domain**
   - Open https://primealfatrade.com
   - Page should load without errors

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Test Navigation**
   - Navigate to different pages
   - Refresh the page (SPA routing should work)
   - Test back/forward browser buttons

4. **Verify Assets**
   - Check that CSS loads correctly
   - Check that JavaScript loads
   - Verify images display
   - Check fonts load

### API Connection Test

1. **Open Browser Console**
   - Navigate to https://primealfatrade.com
   - Open Developer Tools
   - Go to Console tab

2. **Test API Call**
   ```javascript
   fetch('https://api.primealfatrade.com/health')
     .then(r => r.json())
     .then(console.log)
   ```

3. **Verify Response**
   - Should receive successful response
   - No CORS errors
   - No network errors

## Step 7: SSL Configuration

### Check SSL Status

1. **In cPanel**
   - Open "SSL/TLS Status"
   - Check if SSL is active for primealfatrade.com

2. **If Not Active**
   - Use "Let's Encrypt" to install free SSL
   - Or purchase SSL from hosting provider

### Verify SSL

1. **Visit Domain with HTTPS**
   - https://primealfatrade.com
   - Should show lock icon in browser

2. **Check SSL Certificate**
   - Click lock icon
   - View certificate details
   - Verify it's valid

## Step 8: Performance Optimization

### Enable Compression

The `.htaccess` file already includes gzip compression rules. Verify they work:

1. **Test with Online Tool**
   - Use https://www.giftofspeed.com/gzip-test/
   - Enter your domain
   - Verify compression is enabled

### Leverage Browser Caching

The `.htaccess` file includes caching rules. Verify:

1. **Check Response Headers**
   - Open Developer Tools
   - Go to Network tab
   - Reload page
   - Check Cache-Control headers

### Optimize Images

Before uploading:
- Compress images using tools like TinyPNG
- Use WebP format where supported
- Ensure images are appropriately sized

## Step 9: Mobile Responsiveness Test

### Test on Different Devices

1. **Browser DevTools**
   - Open Developer Tools
   - Toggle device toolbar (Ctrl+Shift+M)
   - Test different screen sizes

2. **Real Devices**
   - Test on mobile phone
   - Test on tablet
   - Test on different browsers

### Check Touch Interactions

- Verify buttons work on touch
- Check scrolling behavior
- Test form inputs on mobile

## Step 10: Final Verification Checklist

- [ ] Domain loads correctly
- [ ] HTTPS works with valid SSL
- [ ] SPA routing works (refresh on any page)
- [ ] All assets load (CSS, JS, images, fonts)
- [ ] API connection works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] Security headers present
- [ ] Browser caching enabled
- [ ] Compression enabled

## Troubleshooting

### 404 Errors on Page Refresh

**Problem**: Refreshing a page shows 404 error

**Solution**: 
- Ensure `.htaccess` file exists in `public_html`
- Verify rewrite rules are correct
- Check that mod_rewrite is enabled on server

### Assets Not Loading

**Problem**: CSS, JS, or images not loading

**Solution**:
- Verify files were uploaded correctly
- Check file paths in browser console
- Ensure folder structure matches build output
- Check file permissions (should be 644 for files, 755 for folders)

### API Connection Errors

**Problem**: Frontend cannot connect to backend API

**Solution**:
- Verify `VITE_API_BASE_URL` is correct
- Rebuild frontend with correct API URL
- Check CORS configuration on backend
- Verify backend is running and accessible

### Mixed Content Errors

**Problem**: Browser blocks mixed HTTP/HTTPS content

**Solution**:
- Ensure all resources use HTTPS
- Check for hardcoded HTTP URLs in code
- Verify SSL is properly configured

### Slow Loading

**Problem**: Site loads slowly

**Solution**:
- Enable compression (check `.htaccess`)
- Optimize images
- Leverage browser caching
- Consider using CDN for static assets

## Maintenance

### Regular Updates

- Update frontend code when needed
- Rebuild and reupload after changes
- Test thoroughly after updates

### Monitor Performance

- Use tools like Google PageSpeed Insights
- Check loading times regularly
- Monitor for errors in browser console

### Security

- Keep dependencies updated
- Monitor for security vulnerabilities
- Regularly check SSL certificate expiry

## Support

If you encounter issues:

1. Check cPanel error logs
2. Review browser console errors
3. Contact Hahu Cloud support
4. Refer to hosting provider documentation
