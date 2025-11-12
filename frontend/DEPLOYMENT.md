# Frontend Deployment Guide - SkillLink

This guide covers deploying the SkillLink frontend to AWS EC2 using Nginx.

> **📘 Prerequisites:** Backend should be deployed first. See [../backend/DEPLOYMENT_COMPLETE.md](../backend/DEPLOYMENT_COMPLETE.md)

## 📋 Overview

The frontend will be:
- Built using Vite
- Served as static files via Nginx
- Proxying API requests to the backend (port 5000)
- Accessible on port 80 (HTTP) and 443 (HTTPS)

---

## Part 1: Prerequisites

- ✅ Backend deployed on EC2 (port 5000)
- ✅ EC2 instance with Node.js installed
- ✅ Nginx installed (should be installed with backend setup)
- ✅ Git access to repository

---

## Part 2: Connect to EC2 Instance

```bash
# On your local machine
cd ~/Downloads  # or wherever your .pem file is
chmod 400 skilllink-backend-key.pem
ssh -i skilllink-backend-key.pem ubuntu@YOUR_EC2_IP
```

Replace `YOUR_EC2_IP` with your actual EC2 public IP address.

---

## Part 3: Install Frontend Dependencies

```bash
# Navigate to the cloned repository
cd /var/www/skilllink-backend

# Install Node.js dependencies for frontend (if not already installed)
# Node.js should already be installed from backend setup
node --version  # Should show v18.x or higher
npm --version

# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

---

## Part 4: Configure Environment Variables

Create a `.env.production` file for production build:

```bash
# Create .env.production file
nano .env.production
```

Add the following content (replace with your actual backend URL):

```env
VITE_API_URL=http://YOUR_EC2_IP:5000/api
```

**Important:** Replace `YOUR_EC2_IP` with your actual EC2 public IP address.

**Save in nano:**
- Press `Ctrl+O` (Write Out)
- Press `Enter` (confirm filename)
- Press `Ctrl+X` (Exit)

---

## Part 5: Build Frontend

```bash
# Make sure you're in the frontend directory
cd /var/www/skilllink-backend/frontend

# Build for production
npm run build
```

This will create a `dist` directory with optimized production files.

**Verify build:**
```bash
ls -la dist/
# Should show: index.html, assets/, etc.
```

---

## Part 6: Configure Nginx

### Step 1: Create Nginx Configuration

```bash
# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/skilllink-frontend
```

Paste the following configuration (replace `YOUR_EC2_IP` with your actual IP):

```nginx
server {
    listen 80;
    server_name YOUR_EC2_IP;  # Replace with your EC2 IP or domain

    # Root directory for frontend files
    root /var/www/skilllink-backend/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support for chat
        proxy_set_header Connection "upgrade";
    }

    # Error pages
    error_page 404 /index.html;
}
```

**Save and exit:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 2: Enable Site

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/skilllink-frontend /etc/nginx/sites-enabled/

# Remove default Nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 3: Reload Nginx

```bash
# Reload Nginx to apply changes
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## Part 7: Update Security Group

Make sure your EC2 Security Group allows:
- **Port 80 (HTTP):** Source: `0.0.0.0/0`
- **Port 443 (HTTPS):** Source: `0.0.0.0/0` (if using SSL)

**Steps:**
1. Go to **AWS Console** → **EC2** → **Instances**
2. Select your instance
3. Click **"Security"** tab
4. Click the **security group** link
5. Click **"Edit inbound rules"**
6. Ensure port 80 and 443 are open
7. Click **"Save rules"**

---

## Part 8: Test Deployment

### From Browser

Open your browser and navigate to:
```
http://YOUR_EC2_IP
```

You should see the SkillLink frontend!

### Test API Connection

1. Open browser developer tools (F12)
2. Go to **Network** tab
3. Try to login or fetch data
4. Check that API requests go to `/api/...` and return data

### Test Health Endpoint

```bash
# From EC2 instance
curl http://localhost/api/health
```

Should return:
```json
{"status":"OK","message":"SkillLink API is running"}
```

---

## Part 9: Setup SSL (Optional but Recommended)

### Using Let's Encrypt (Free SSL)

**Prerequisites:** You need a domain name pointing to your EC2 IP.

```bash
# Install Certbot (if not already installed)
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

Certbot will automatically:
- Get SSL certificate
- Update Nginx configuration
- Setup auto-renewal

**Test auto-renewal:**
```bash
sudo certbot renew --dry-run
```

---

## Part 10: Update Backend CORS (If Needed)

If you encounter CORS errors, update the backend `.env` file:

```bash
# On EC2
cd /var/www/skilllink-backend/backend
nano .env
```

Update `FRONTEND_URL`:
```env
FRONTEND_URL=http://YOUR_EC2_IP
# Or if using domain:
FRONTEND_URL=https://yourdomain.com
```

Restart backend:
```bash
pm2 restart skilllink-backend
```

---

## Part 11: Setup Auto-Deployment Script

Create a script to easily rebuild and deploy:

```bash
# Create deployment script
nano ~/deploy-frontend.sh
```

Paste:
```bash
#!/bin/bash

echo "🚀 Deploying SkillLink Frontend..."

# Navigate to frontend directory
cd /var/www/skilllink-backend/frontend

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies (if package.json changed)
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Frontend available at: http://YOUR_EC2_IP"
```

Make it executable:
```bash
chmod +x ~/deploy-frontend.sh
```

**Usage:**
```bash
~/deploy-frontend.sh
```

---

## Troubleshooting

### Frontend Not Loading

**Issue:** Blank page or 404 error

**Solutions:**
1. Check Nginx is running: `sudo systemctl status nginx`
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify dist directory exists: `ls -la /var/www/skilllink-backend/frontend/dist`
4. Check file permissions: `sudo chown -R www-data:www-data /var/www/skilllink-backend/frontend/dist`

### API Requests Failing

**Issue:** API calls return 502 or connection refused

**Solutions:**
1. Check backend is running: `pm2 status`
2. Test backend directly: `curl http://localhost:5000/api/health`
3. Check Nginx proxy configuration: `sudo nginx -t`
4. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### CORS Errors

**Issue:** Browser shows CORS errors in console

**Solutions:**
1. Update backend `FRONTEND_URL` in `.env`
2. Restart backend: `pm2 restart skilllink-backend`
3. Check backend CORS configuration in `server.js`

### Build Fails

**Issue:** `npm run build` fails

**Solutions:**
1. Check Node.js version: `node --version` (should be 18+)
2. Clear cache: `rm -rf node_modules package-lock.json && npm install`
3. Check for errors in build output
4. Verify `.env.production` file exists

### Nginx Configuration Errors

**Issue:** `nginx -t` fails

**Solutions:**
1. Check syntax: `sudo nginx -t`
2. Review configuration file for typos
3. Check file paths are correct
4. Ensure all semicolons and braces are correct

---

## Useful Commands

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload Nginx (no downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

### Frontend Commands

```bash
# Build frontend
cd /var/www/skilllink-backend/frontend
npm run build

# Check build output
ls -la dist/

# Clear build and rebuild
rm -rf dist/
npm run build
```

### File Permissions

```bash
# Fix permissions for Nginx
sudo chown -R www-data:www-data /var/www/skilllink-backend/frontend/dist
sudo chmod -R 755 /var/www/skilllink-backend/frontend/dist
```

---

## Deployment Checklist

- [ ] Connected to EC2 instance
- [ ] Node.js installed (v18+)
- [ ] Frontend dependencies installed
- [ ] `.env.production` file created with correct API URL
- [ ] Frontend built successfully (`dist/` directory exists)
- [ ] Nginx configuration file created
- [ ] Nginx site enabled
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded
- [ ] Security group allows port 80 (and 443 if using SSL)
- [ ] Frontend accessible in browser
- [ ] API requests working
- [ ] SSL certificate installed (optional)
- [ ] Auto-deployment script created (optional)

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| EC2 t2.micro (Free Tier) | **$0/month** (12 months) |
| EC2 t2.micro (After free tier) | **~$8.50/month** |
| Nginx | **FREE** |
| Let's Encrypt SSL | **FREE** |
| **TOTAL** | **Same as backend** |

---

## Next Steps

1. **Setup Domain (Optional):**
   - Purchase domain
   - Point DNS A record to EC2 IP
   - Update Nginx configuration with domain name
   - Get SSL certificate with Let's Encrypt

2. **Setup Monitoring:**
   - Monitor Nginx logs
   - Setup CloudWatch for EC2
   - Monitor frontend errors

3. **Optimize Performance:**
   - Enable Nginx caching
   - Setup CDN (CloudFront)
   - Optimize images and assets

4. **Backup:**
   - Backup Nginx configuration
   - Backup build files (optional)

---

## Support

If you encounter issues:
1. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
2. Check backend logs: `pm2 logs skilllink-backend`
3. Verify file permissions
4. Test backend directly: `curl http://localhost:5000/api/health`
5. Check EC2 Security Group rules

---

**Last Updated:** November 2025  
**Deployed By:** Karthikeyan Kumbam  
**Repository:** https://github.com/karthikeyankumbam/skill

