#!/bin/bash
# Script to create production .env file
# Usage: ./create-production-env.sh

echo "Creating production .env file..."

# Generate secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
OTP_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

cat > .env << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas (Production)
# Replace username, password, and cluster with your MongoDB Atlas credentials
MONGODB_URI=mongodb+srv://karthike:62xcNjCZFuzYCkQB@cluster.mongodb.net/skilllink?retryWrites=true&w=majority

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=7d

# OTP Configuration
OTP_SECRET=${OTP_SECRET}
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

# Frontend URL (Update with your production frontend URL or domain)
FRONTEND_URL=http://your-ec2-ip:3000
EOF

echo "✅ Production .env file created!"
echo ""
echo "⚠️  IMPORTANT: Update the following in .env file:"
echo "   - MONGODB_URI: Replace with your MongoDB Atlas connection string"
echo "   - FRONTEND_URL: Update with your actual frontend URL"
echo "   - Optional: Add Twilio, Razorpay, OAuth credentials if needed"
echo ""
echo "Edit .env file: nano .env"

