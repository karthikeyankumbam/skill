# AWS Deployment Guide - SkillLink Backend

This guide covers deploying the SkillLink backend to AWS using the cheapest options.

## 💰 AWS Cost Overview

- **EC2 t2.micro**: FREE for 12 months (then ~$8.50/month)
- **EC2 t3.micro**: ~$7.50/month (always free tier eligible)
- **Elastic Beanstalk**: FREE (only pay for EC2)
- **MongoDB Atlas**: FREE (512MB forever)
- **Route 53**: ~$0.50/month per hosted zone
- **Certificate Manager**: FREE SSL certificates

**Total Cost: $0-8/month** (depending on instance type and usage)

---

## 🎯 Option 1: AWS Elastic Beanstalk (Easiest)

**Cost:** FREE platform fee, only pay for EC2 (~$0-8/month)

### Why Elastic Beanstalk?
- ✅ Easiest AWS deployment option
- ✅ Automatic scaling and load balancing
- ✅ Zero platform fees
- ✅ Automatic health monitoring
- ✅ Easy environment variable management
- ✅ WebSocket support

### Prerequisites:
1. AWS Account (sign up at https://aws.amazon.com)
2. AWS CLI installed: `brew install awscli` (Mac) or `pip install awscli` (Linux)
3. EB CLI installed: `pip install awsebcli`

### Setup Steps:

#### 1. Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1 (or your preferred region)
# Default output format: json
```

#### 2. Initialize Elastic Beanstalk
```bash
cd backend
eb init -p node.js -r us-east-1 skilllink-backend
```

#### 3. Create Environment
```bash
eb create skilllink-backend-prod
# Choose instance type: t3.micro (free tier eligible)
# Choose load balancer: application
```

#### 4. Set Environment Variables
```bash
eb setenv \
  NODE_ENV=production \
  MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/skilllink" \
  JWT_SECRET="your_jwt_secret_here" \
  JWT_EXPIRE=7d \
  OTP_SECRET="your_otp_secret_here" \
  OTP_EXPIRE_MINUTES=10 \
  MAX_FILE_SIZE=3145728 \
  UPLOAD_PATH=./uploads \
  CREDIT_VALUE_IN_RUPEES=10 \
  FRONTEND_URL="https://your-frontend-url.com"
```

#### 5. Deploy
```bash
eb deploy
```

#### 6. Get Your URL
```bash
eb status
# Your backend URL will be shown
```

### Useful Commands:
```bash
eb logs          # View logs
eb open          # Open in browser
eb health        # Check health
eb terminate     # Delete environment
```

---

## 🖥️ Option 2: AWS EC2 (Most Control, Cheapest)

**Cost:** FREE t2.micro for 12 months, then ~$8.50/month

### Why EC2?
- ✅ Full control over the server
- ✅ Cheapest option after free tier
- ✅ Can run multiple services
- ✅ Most flexible

### Setup Steps:

#### 1. Launch EC2 Instance
1. Go to AWS Console → EC2
2. Click "Launch Instance"
3. Choose:
   - **Name:** skilllink-backend
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance type:** t2.micro (Free tier eligible)
   - **Key pair:** Create new or use existing
   - **Security Group:** 
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
     - Allow Custom TCP (port 5000) from anywhere (for testing)

#### 2. Connect to Instance
```bash
# Download your key pair
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### 3. Run Setup Script
```bash
# On EC2 instance
cd ~
wget https://raw.githubusercontent.com/your-repo/skill/main/backend/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

Or manually:
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx
```

#### 4. Deploy Application
```bash
# Clone your repository
cd /var/www
sudo git clone https://github.com/your-username/your-repo.git skilllink-backend
cd skilllink-backend/backend

# Install dependencies
npm install --production

# Create .env file
sudo nano .env
# Add all your environment variables

# Create uploads directory
sudo mkdir -p uploads
sudo chmod 755 uploads
```

#### 5. Start with PM2
```bash
# Start application
pm2 start server.js --name skilllink-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

#### 6. Configure Nginx
```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/skilllink-backend

# Edit with your domain
sudo nano /etc/nginx/sites-available/skilllink-backend
# Change "your-domain.com" to your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/skilllink-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. Setup SSL with Let's Encrypt
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
```

#### 8. Update Security Group
- Remove port 5000 from security group (only use 80/443 through Nginx)

---

## 🐳 Option 3: AWS ECS with Fargate (Containerized)

**Cost:** ~$10-15/month (more expensive but scalable)

### Why ECS?
- ✅ Containerized deployment
- ✅ Auto-scaling
- ✅ No server management
- ✅ Good for production at scale

### Setup Steps:

#### 1. Build and Push Docker Image
```bash
# Install Docker
# Build image
cd backend
docker build -t skilllink-backend .

# Tag for ECR
aws ecr create-repository --repository-name skilllink-backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag skilllink-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/skilllink-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/skilllink-backend:latest
```

#### 2. Create ECS Cluster
- Go to ECS → Create Cluster
- Choose Fargate
- Create task definition with your image
- Create service

---

## 💾 MongoDB Setup

### MongoDB Atlas (Free Forever) - Required

**MongoDB Atlas is the only MongoDB option for this deployment.**

1. **Sign up at MongoDB Atlas**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free account

2. **Create Free Cluster**
   - Click "Build a Database"
   - Choose **M0 Free Tier** (512MB storage, free forever)
   - Select your preferred region (choose one close to your AWS region)
   - Click "Create"

3. **Setup Database Access**
   - Go to "Database Access" → "Add New Database User"
   - Create username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"

4. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add your AWS IP ranges or specific EC2 IPs
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `skilllink` (or your preferred database name)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/skilllink?retryWrites=true&w=majority`

6. **Use in Environment Variables**
   - Set `MONGODB_URI` to your connection string in your deployment platform

---

## 📝 Environment Variables

Create `.env` file or set in Elastic Beanstalk:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/skilllink
JWT_SECRET=<generate_strong_secret>
JWT_EXPIRE=7d
OTP_SECRET=<generate_strong_secret>
OTP_EXPIRE_MINUTES=10
MAX_FILE_SIZE=3145728
UPLOAD_PATH=./uploads
CREDIT_VALUE_IN_RUPEES=10
FRONTEND_URL=https://your-frontend-url.com

# Optional
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

**Generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🔒 Security Checklist

- [ ] Use strong JWT_SECRET and OTP_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for your frontend domain only
- [ ] Use HTTPS (Let's Encrypt is free)
- [ ] Restrict security group to necessary ports only
- [ ] Use IAM roles instead of access keys when possible
- [ ] Enable MongoDB authentication
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

---

## 🚀 Quick Deploy Commands

### Elastic Beanstalk
```bash
eb init
eb create skilllink-backend-prod
eb setenv MONGODB_URI=... JWT_SECRET=...
eb deploy
```

### EC2
```bash
# On your local machine
scp -i key.pem -r backend/ ubuntu@ec2-ip:/var/www/skilllink-backend

# On EC2
cd /var/www/skilllink-backend
npm install --production
pm2 start server.js --name skilllink-backend
pm2 save
```

---

## 🔧 Troubleshooting

### Application won't start
- Check logs: `eb logs` (EB) or `pm2 logs` (EC2)
- Verify environment variables are set
- Check MongoDB connection
- Ensure PORT is set correctly (EB uses 8080, EC2 uses 5000)

### MongoDB connection fails
- Whitelist AWS IP ranges in MongoDB Atlas
- Check security group allows outbound connections
- Verify connection string is correct

### WebSocket not working
- Ensure load balancer supports WebSocket (Application Load Balancer)
- Check Nginx configuration includes WebSocket headers
- Verify CORS settings allow WebSocket connections

### High costs
- Use t2.micro or t3.micro instances (free tier eligible)
- Use MongoDB Atlas free tier
- Monitor CloudWatch for unexpected usage
- Set up billing alerts

---

## 📊 Cost Optimization Tips

1. **Use Free Tier**: t2.micro/t3.micro for 12 months free
2. **Reserved Instances**: Save up to 72% if committing to 1-3 years
3. **Spot Instances**: Save up to 90% for non-critical workloads
4. **MongoDB Atlas Free**: Use free tier (512MB) for small apps
5. **CloudWatch**: Monitor and set up billing alerts
6. **Auto Scaling**: Scale down during low traffic periods

---

## 📞 Support

- AWS Documentation: https://docs.aws.amazon.com
- AWS Free Tier: https://aws.amazon.com/free
- MongoDB Atlas: https://docs.atlas.mongodb.com

---

## 🎯 Recommended Setup

**For Development:**
- EC2 t2.micro (free for 12 months)
- MongoDB Atlas Free
- Total: **$0/month**

**For Production:**
- Elastic Beanstalk with t3.micro
- MongoDB Atlas Free (or M10 if needed)
- Route 53 for domain
- Total: **~$8-10/month**
