# 🚀 AWS Quick Deployment Guide

## Prerequisites

### 1. Setup MongoDB Atlas (Free Forever)
**This must be done first!**

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create **M0 Free Tier** cluster (512MB, free forever)
3. Create database user (save username/password!)
4. Configure Network Access: Allow from anywhere (0.0.0.0/0) for development
5. Get connection string: Database → Connect → Connect your application
6. Copy connection string and replace `<password>` and `<dbname>` with your values
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/skilllink?retryWrites=true&w=majority`

### 2. AWS Setup
1. AWS Account: https://aws.amazon.com (Free tier available)
2. Install AWS CLI: `brew install awscli` (Mac) or `pip install awscli`
3. Install EB CLI: `pip install awsebcli`

---

## Fastest: AWS Elastic Beanstalk

### Step 1: Configure AWS
```bash
aws configure
# Enter your AWS credentials
# Region: us-east-1 (or your preferred)
```

### Step 2: Initialize & Deploy
```bash
cd backend
eb init -p node.js -r us-east-1 skilllink-backend
eb create skilllink-backend-prod
```

### Step 3: Set Environment Variables
```bash
# Use your MongoDB Atlas connection string from Prerequisites step 1
eb setenv \
  NODE_ENV=production \
  MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/skilllink?retryWrites=true&w=majority" \
  JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  JWT_EXPIRE=7d \
  OTP_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  OTP_EXPIRE_MINUTES=10 \
  FRONTEND_URL="https://your-frontend-url.com"
```

### Step 4: Get Your URL
```bash
eb status
# Copy the CNAME URL
```

**Done!** Your backend is live at the CNAME URL.

---

## Cheapest: AWS EC2 (Free for 12 months)

### Step 1: Launch EC2 Instance
1. AWS Console → EC2 → Launch Instance
2. Choose: Ubuntu 22.04, t2.micro (free tier)
3. Security Group: Allow ports 22, 80, 443
4. Launch and download key pair

### Step 2: Connect & Setup
```bash
# Connect
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip

# On EC2, run:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2
```

### Step 2: Setup MongoDB Atlas
**If not done already, complete Prerequisites step 1 above.**

### Step 3: Deploy Code
```bash
# On EC2
cd /var/www
sudo git clone YOUR_REPO_URL skilllink-backend
cd skilllink-backend/backend
npm install --production

# Create .env with MongoDB Atlas connection string
sudo nano .env
# Add all environment variables (use MongoDB Atlas connection string from Prerequisites)

# Start
pm2 start server.js --name skilllink-backend
pm2 save
pm2 startup  # Follow instructions
```

### Step 4: Setup Nginx & SSL
```bash
# Configure Nginx (see nginx.conf)
sudo cp nginx.conf /etc/nginx/sites-available/skilllink-backend
sudo ln -s /etc/nginx/sites-available/skilllink-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| EC2 t2.micro (Free Tier) | **$0/month** (12 months) |
| EC2 t2.micro (After free tier) | **~$8.50/month** |
| MongoDB Atlas (Free) | **$0/month** |
| Route 53 (Optional) | **~$0.50/month** |
| **TOTAL (First Year)** | **~$0.50/month** |
| **TOTAL (After)** | **~$9/month** |

---

## ✅ Post-Deployment Checklist

- [ ] Backend URL accessible (`/api/health` works)
- [ ] MongoDB connection working
- [ ] Environment variables set
- [ ] Frontend updated with backend URL
- [ ] CORS configured correctly
- [ ] SSL certificate installed (HTTPS)
- [ ] PM2 auto-start configured (EC2)
- [ ] Security group restricted

---

## 🔧 Quick Commands

### Elastic Beanstalk
```bash
eb deploy          # Deploy updates
eb logs            # View logs
eb open            # Open in browser
eb health          # Check health
```

### EC2
```bash
pm2 logs           # View logs
pm2 restart all    # Restart
pm2 status         # Check status
sudo nginx -t      # Test Nginx config
```

---

## 📞 Need Help?

See full guide: `DEPLOYMENT.md`
