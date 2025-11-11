# Quick Start Guide

## Prerequisites
- Node.js 16+ installed
- MongoDB running (local or MongoDB Atlas)
- npm or yarn

## Quick Setup (5 minutes)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run seed  # Optional: Seed sample data
npm run dev   # Start server on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev   # Start on port 3000
```

### 3. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Default Credentials (After Seeding)

**Admin:**
- Phone: +919999999999
- Password: admin123

**Sample Users:**
- Phone: +919876543210 (User)
- Phone: +919876543211 (User/Professional)

## Testing the Flow

1. **Browse as Guest**: Visit homepage, browse professionals
2. **Login**: Use OTP login (OTP will be logged in console)
3. **Add Credits**: Go to Wallet, add funds
4. **Unlock Profile**: Click on a professional, unlock profile (1 credit)
5. **Create Booking**: Book a service
6. **Admin Panel**: Login as admin, approve KYC

## Key Features to Test

- ✅ Guest browsing (limited info)
- ✅ OTP authentication
- ✅ Wallet/credit system
- ✅ Profile unlocking
- ✅ Booking creation
- ✅ Professional dashboard
- ✅ Admin KYC approval
- ✅ Multi-language support (change in navbar)

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env

**Port Already in Use:**
- Change PORT in backend/.env
- Update FRONTEND_URL accordingly

**OTP Not Working:**
- Check console for OTP (development mode)
- In production, configure Twilio credentials

## Next Steps

1. Configure payment gateway (Razorpay)
2. Set up Twilio for SMS OTP
3. Configure Google/Apple OAuth
4. Deploy to production

For detailed documentation, see README.md

