#!/bin/bash
# AWS EC2 Setup Script for SkillLink Backend
# Run this script on a fresh Ubuntu EC2 instance

set -e

echo "🚀 Setting up SkillLink Backend on EC2..."

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Note: MongoDB is hosted on MongoDB Atlas (free tier)
# No local MongoDB installation needed
# See DEPLOYMENT.md for MongoDB Atlas setup instructions

# Install Nginx for reverse proxy
sudo apt-get install -y nginx

# Install Certbot for SSL
sudo apt-get install -y certbot python3-certbot-nginx

# Create app directory
sudo mkdir -p /var/www/skilllink-backend
sudo chown -R $USER:$USER /var/www/skilllink-backend

# Create uploads directory
sudo mkdir -p /var/www/skilllink-backend/uploads
sudo chmod 755 /var/www/skilllink-backend/uploads

echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "1. Setup MongoDB Atlas (free tier) - see DEPLOYMENT.md"
echo "2. Clone your repository to /var/www/skilllink-backend"
echo "3. Run: cd /var/www/skilllink-backend && npm install"
echo "4. Create .env file with MONGODB_URI from MongoDB Atlas"
echo "5. Start with PM2: pm2 start server.js --name skilllink-backend"
echo "6. Save PM2: pm2 save && pm2 startup"
echo "7. Configure Nginx (see DEPLOYMENT.md)"

