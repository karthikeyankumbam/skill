# Complete AWS EC2 Deployment Guide - SkillLink Backend

This document contains the complete step-by-step deployment process for SkillLink backend on AWS EC2.

## 📋 Prerequisites

- AWS Account
- GitHub account with repository access
- MongoDB Atlas account (free tier)
- SSH client (built into Mac/Linux)

---

## Part 1: AWS EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**

2. **Configure Instance:**
   - **Name:** `skilllink-backend`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type:** `t2.micro` (Free tier eligible)
   - **Key pair:** Create new key pair
     - Name: `skilllink-backend-key`
     - Key pair type: RSA
     - Private key file format: `.pem`
     - **Download the `.pem` file** (you can only download once!)

3. **Network Settings:**
   - Allow SSH traffic from: My IP (or Anywhere for testing)
   - Click "Add security group rule" for each:
     - **HTTP (port 80):** Source: Anywhere (0.0.0.0/0)
     - **HTTPS (port 443):** Source: Anywhere (0.0.0.0/0)
     - **Custom TCP (port 5000):** Source: Anywhere (0.0.0.0/0) - **This is critical for API access!**

4. **Launch Instance**

5. **Note your instance details:**
   - Public IP: (e.g., `13.60.242.242`)
   - Save the `.pem` key file securely

---

## Part 2: MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account

### Step 2: Create Free Cluster

1. Click **"Build a Database"**
2. Choose **M0 Free Tier** (512MB storage, free forever)
3. Select region (choose one close to your AWS region)
4. Click **"Create"**

### Step 3: Create Database User

1. Go to **"Database Access"** → **"Add New Database User"**
2. **Authentication Method:** Password
3. **Username:** `karthike` (or your preferred username)
4. **Password:** Create strong password (save it!)
5. **Database User Privileges:** "Atlas admin" or "Read and write to any database"
6. Click **"Add User"**

### Step 4: Configure Network Access

1. Go to **"Network Access"** → **"Add IP Address"**
2. For development: Click **"Allow Access from Anywhere"**
3. Enter: `0.0.0.0/0`
4. Click **"Confirm"**
5. Wait 1-2 minutes for changes to take effect

### Step 5: Get Connection String

1. Go to **"Database"** → Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Copy the connection string
4. It will look like:
   ```
   mongodb+srv://karthike:<password>@cluster0.pzedxxe.mongodb.net/?appName=Cluster0
   ```
5. Replace `<password>` with your actual password
6. Add database name: `/skilllink` before the `?`
7. Final format:
   ```
   mongodb+srv://karthike:your_password@cluster0.pzedxxe.mongodb.net/skilllink?retryWrites=true&w=majority
   ```

---

## Part 3: Connect to EC2 Instance

### Step 1: On Your Local Machine (Mac)

```bash
# Navigate to where your .pem file is (usually Downloads)
cd ~/Downloads

# Set correct permissions for the key
chmod 400 skilllink-backend-key.pem

# Connect to EC2 (replace with your actual IP)
ssh -i skilllink-backend-key.pem ubuntu@13.60.242.242
```

When you see `ubuntu@ip-...:~$`, you're connected!

---

## Part 4: Install Prerequisites on EC2

Run these commands on your EC2 instance:

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt-get install -y git

# Install Nginx (for reverse proxy - optional)
sudo apt-get install -y nginx

# Install Certbot (for SSL - optional)
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## Part 5: Clone Repository

```bash
# Create directory
sudo mkdir -p /var/www
cd /var/www

# Clone your repository
sudo git clone https://github.com/karthikeyankumbam/skill.git skilllink-backend

# Fix permissions so you can work with files
sudo chown -R $USER:$USER /var/www/skilllink-backend

# Navigate to backend
cd /var/www/skilllink-backend/backend
```

**Note:** When prompted for GitHub credentials:
- **Username:** `karthikeyankumbam`
- **Password:** Your Personal Access Token (create at https://github.com/settings/tokens if needed)

---

## Part 6: Install Dependencies

```bash
# Make sure you're in the backend directory
cd /var/www/skilllink-backend/backend

# Install production dependencies
npm install --production
```

---

## Part 7: Create .env File

```bash
# Create .env file
nano .env
```

Paste this content (replace with your actual values):

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas (Production)
MONGODB_URI=mongodb+srv://karthike:your_password@cluster0.pzedxxe.mongodb.net/skilllink?retryWrites=true&w=majority

# JWT
JWT_SECRET=acbce36aa3880428aa78ad6971f483009cc9401222147abf666f5572b1e8a68d
JWT_EXPIRE=7d

# OTP Configuration
OTP_SECRET=3722a7f7f405d9680544f02090531a0b7d6251e546f7ad29458015e99461045f
OTP_EXPIRE_MINUTES=10

# Twilio (for SMS OTP) - Optional
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Razorpay (Payment Gateway) - Optional
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google OAuth - Optional
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Apple OAuth - Optional
APPLE_CLIENT_ID=your_apple_client_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id

# File Upload
MAX_FILE_SIZE=3145728
UPLOAD_PATH=./uploads

# Credit System
CREDIT_VALUE_IN_RUPEES=10

# Frontend URL (Update with your EC2 IP or domain)
FRONTEND_URL=http://13.60.242.242:3000
```

**Important:**
- Replace `your_password` with your actual MongoDB Atlas password
- Replace `cluster0.pzedxxe.mongodb.net` with your actual cluster name
- Replace `13.60.242.242` with your actual EC2 IP

**Save in nano:**
- Press `Ctrl+O` (Write Out)
- Press `Enter` (confirm filename)
- Press `Ctrl+X` (Exit)

---

## Part 8: Create Uploads Directory

```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

---

## Part 9: Start Application with PM2

```bash
# Start the application
pm2 start server.js --name skilllink-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

PM2 will output a command like:
```
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

**Copy and run that exact command** to enable auto-start on reboot.

---

## Part 10: Verify Deployment

### Check PM2 Status

```bash
pm2 status
```

Should show: `skilllink-backend` with status `online`

### Check Logs

```bash
pm2 logs skilllink-backend --lines 20
```

Look for:
- `✅ MongoDB Connected` (success!)
- `🚀 Server running on port 5000`
- `📡 Environment: production`

### Test Health Endpoint Locally

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"OK","message":"SkillLink API is running"}
```

---

## Part 11: Configure Security Group (Critical!)

If you can't access the API from outside, update the security group:

1. Go to **AWS Console** → **EC2** → **Instances**
2. Select your instance
3. Click **"Security"** tab
4. Click the **security group** link
5. Click **"Edit inbound rules"**
6. Click **"Add rule"**
7. Configure:
   - **Type:** Custom TCP
   - **Port range:** `5000`
   - **Source:** `0.0.0.0/0` (or your IP for better security)
   - **Description:** "SkillLink Backend API"
8. Click **"Save rules"**

**Wait 10-30 seconds** for changes to take effect.

---

## Part 12: Test API from Outside

### From Browser

Open these URLs in your browser:

1. **Health Check:**
   ```
   http://13.60.242.242:5000/api/health
   ```

2. **Get Categories:**
   ```
   http://13.60.242.242:5000/api/categories
   ```

3. **Get Professionals:**
   ```
   http://13.60.242.242:5000/api/professionals
   ```

### From Postman

**Base URL:** `http://13.60.242.242:5000`

**Test Endpoints:**

1. **Health Check**
   - Method: `GET`
   - URL: `http://13.60.242.242:5000/api/health`

2. **Get Categories**
   - Method: `GET`
   - URL: `http://13.60.242.242:5000/api/categories`

3. **Get Professionals**
   - Method: `GET`
   - URL: `http://13.60.242.242:5000/api/professionals`

4. **Send OTP**
   - Method: `POST`
   - URL: `http://13.60.242.242:5000/api/auth/send-otp`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "phone": "+919999999999"
     }
     ```

5. **Verify OTP**
   - Method: `POST`
   - URL: `http://13.60.242.242:5000/api/auth/verify-otp`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "phone": "+919999999999",
       "otp": "123456"
     }
     ```

---

## Troubleshooting

### MongoDB Connection Issues

**Error:** `❌ MongoDB Connection Error: authentication failed`

**Solution:**
1. Verify MongoDB Atlas credentials in `.env` file
2. Check Database Access in MongoDB Atlas
3. Ensure password is correct (no special characters need URL encoding)

**Error:** `Could not connect to any servers - IP not whitelisted`

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (or your EC2 IP)
3. Wait 1-2 minutes
4. Restart PM2: `pm2 restart skilllink-backend`

### API Timeout Issues

**Error:** Request timeout in Postman/Browser

**Solution:**
1. Check AWS Security Group allows port 5000
2. Verify EC2 instance is running
3. Test locally first: `curl http://localhost:5000/api/health`
4. Check PM2 status: `pm2 status`

### PM2 Not Starting on Boot

**Solution:**
1. Run: `pm2 startup`
2. Copy and run the command it outputs
3. Verify: `pm2 save`

---

## Useful Commands

### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs skilllink-backend

# Restart application
pm2 restart skilllink-backend

# Stop application
pm2 stop skilllink-backend

# Delete from PM2
pm2 delete skilllink-backend

# Monitor in real-time
pm2 monit
```

### Application Commands

```bash
# View recent logs
pm2 logs skilllink-backend --lines 50

# Test health endpoint
curl http://localhost:5000/api/health

# Check if port is listening
netstat -tuln | grep 5000
```

### Update Application

```bash
# Navigate to backend
cd /var/www/skilllink-backend/backend

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install --production

# Restart application
pm2 restart skilllink-backend
```

---

## Deployment Checklist

- [ ] EC2 instance launched
- [ ] Security group configured (ports 22, 80, 443, 5000)
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB database user created
- [ ] MongoDB network access configured (0.0.0.0/0)
- [ ] Connected to EC2 via SSH
- [ ] Node.js, PM2, Git installed
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] .env file created with correct MongoDB URI
- [ ] Uploads directory created
- [ ] Application started with PM2
- [ ] PM2 startup command executed
- [ ] MongoDB connection verified (✅ MongoDB Connected)
- [ ] Health endpoint works locally
- [ ] Security group allows port 5000
- [ ] Health endpoint works from browser/Postman

---

## Cost Breakdown

| Service | Cost |
|---------|------|
| EC2 t2.micro (Free Tier) | **$0/month** (12 months) |
| EC2 t2.micro (After free tier) | **~$8.50/month** |
| MongoDB Atlas (Free Tier) | **$0/month** (forever) |
| Route 53 (Optional) | **~$0.50/month** |
| **TOTAL (First Year)** | **~$0.50/month** |
| **TOTAL (After)** | **~$9/month** |

---

## Next Steps

1. **Setup Domain (Optional):**
   - Purchase domain
   - Point DNS to EC2 IP
   - Setup Nginx reverse proxy
   - Get SSL certificate with Let's Encrypt

2. **Setup Monitoring:**
   - CloudWatch for AWS resources
   - PM2 monitoring
   - Application logs

3. **Backup Strategy:**
   - MongoDB Atlas automatic backups
   - EC2 snapshots

4. **Scaling:**
   - Use Elastic Beanstalk for easier scaling
   - Setup load balancer
   - Auto-scaling groups

---

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs skilllink-backend`
2. Verify MongoDB connection
3. Check AWS Security Group rules
4. Verify environment variables in `.env`
5. Check EC2 instance status in AWS Console

---

**Last Updated:** November 2025
**Deployed By:** Karthikeyan Kumbam
**Repository:** https://github.com/karthikeyankumbam/skill

