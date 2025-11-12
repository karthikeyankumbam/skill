# Frontend Deployment Quick Start

Quick guide to deploy SkillLink frontend on EC2.

## Prerequisites

- ✅ Backend deployed on EC2 (see `../backend/DEPLOYMENT_COMPLETE.md`)
- ✅ EC2 instance accessible via SSH
- ✅ Nginx installed (should be from backend setup)

## Quick Deployment Steps

### 1. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

### 2. Navigate to Frontend

```bash
cd /var/www/skilllink-backend/frontend
```

### 3. Create Environment File

```bash
nano .env.production
```

Add:
```env
VITE_API_URL=http://YOUR_EC2_IP:5000/api
```

Replace `YOUR_EC2_IP` with your actual EC2 IP.

Save: `Ctrl+O`, `Enter`, `Ctrl+X`

### 4. Install Dependencies & Build

```bash
npm install
npm run build
```

### 5. Setup Nginx

```bash
# Copy Nginx config
sudo cp nginx-frontend.conf /etc/nginx/sites-available/skilllink-frontend

# Edit and update server_name
sudo nano /etc/nginx/sites-available/skilllink-frontend
# Change "server_name _" to "server_name YOUR_EC2_IP;"

# Enable site
sudo ln -s /etc/nginx/sites-available/skilllink-frontend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Set Permissions

```bash
sudo chown -R www-data:www-data /var/www/skilllink-backend/frontend/dist
sudo chmod -R 755 /var/www/skilllink-backend/frontend/dist
```

### 7. Test

Open browser: `http://YOUR_EC2_IP`

## Using Deployment Script

```bash
cd /var/www/skilllink-backend/frontend
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

## Troubleshooting

- **Blank page:** Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- **API errors:** Check backend: `pm2 status` and `pm2 logs skilllink-backend`
- **403 Forbidden:** Fix permissions: `sudo chown -R www-data:www-data dist/`

## Full Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

