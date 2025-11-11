# SkillLink - Local Service Marketplace

A comprehensive platform connecting users with local professionals for home and personal services. Built with Node.js, MongoDB, and React.

## Features

- **Guest Browsing**: Browse professionals without login
- **Wallet/Credit System**: Access control based on credits
- **Multi-language Support**: English, Telugu, Hindi, Tamil, Kannada
- **Role-based Access**: User, Professional, Admin dashboards
- **Real-time Chat**: Socket.io based messaging
- **KYC Verification**: Admin approval system for professionals
- **Booking Management**: Complete booking lifecycle
- **Reviews & Ratings**: User feedback system
- **Referral System**: Earn credits through referrals

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time features
- Razorpay integration (payment gateway)
- Multer for file uploads

### Frontend
- React 18
- Vite
- Tailwind CSS
- React Router
- React Query
- Zustand (state management)
- i18next (localization)
- Socket.io Client

## Project Structure

```
skill/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth & validation
│   ├── utils/           # Utilities (OTP, upload, etc.)
│   ├── scripts/         # Seed data script
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── store/       # State management
│   │   ├── utils/       # API & utilities
│   │   └── locales/     # Translation files
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skilllink
JWT_SECRET=your_secret_key
CREDIT_VALUE_IN_RUPEES=10
FRONTEND_URL=http://localhost:3000
```

5. Seed the database (optional):
```bash
npm run seed
```

6. Start the server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/apple` - Apple OAuth
- `GET /api/auth/me` - Get current user

### Professionals
- `GET /api/professionals` - List professionals (with access control)
- `GET /api/professionals/:id` - Get professional details
- `POST /api/professionals/unlock/:id` - Unlock profile (deducts credit)
- `POST /api/professionals/register` - Register as professional
- `POST /api/professionals/kyc` - Upload KYC documents

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/accept` - Accept booking
- `PUT /api/bookings/:id/update-status` - Update status
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Wallet
- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/add-funds` - Create payment order
- `POST /api/wallet/verify-payment` - Verify and add funds

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/professionals/pending-kyc` - Pending KYC
- `PUT /api/admin/professionals/:id/approve-kyc` - Approve KYC
- `GET /api/admin/users` - List users
- `GET /api/admin/bookings` - List bookings

## Access Control Logic

### Guest Users
- Can browse categories and professionals
- See limited info (name, rating, location, price)
- Contact details are locked

### Logged-in Users (No Credits)
- Same as guests
- Can see "Unlock Profile" option

### Users with Credits
- Can unlock profiles (1 credit)
- Can create bookings (1 credit)
- Can access chat (1 credit)
- Full profile visibility

### Professionals
- Need credits to view user details
- Can accept/reject bookings
- Manage availability and pricing

## Default Admin Credentials

After running seed script:
- Phone: +919999999999
- Password: admin123

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skilllink
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
OTP_SECRET=your_otp_secret
CREDIT_VALUE_IN_RUPEES=10
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
FRONTEND_URL=http://localhost:3000
```

## Deployment

### Backend
1. Set production environment variables
2. Use PM2 or similar for process management
3. Configure MongoDB Atlas or production DB
4. Set up SSL certificates
5. Configure CORS for production domain

### Frontend
1. Build production bundle:
```bash
npm run build
```
2. Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)
3. Update API base URL in production

## Features in Detail

### Wallet System
- 1 Credit = ₹10 (configurable)
- Credits deducted for:
  - Unlocking profiles
  - Creating bookings
  - Accessing chat
- Credits earned from:
  - Referrals
  - Completed services
  - Promotions

### Booking Flow
1. User browses professionals
2. Unlocks profile (if needed)
3. Creates booking request
4. Professional accepts/rejects
5. Status updates: Accepted → On the Way → In Progress → Completed
6. User can review after completion

### KYC Verification
1. Professional registers
2. Uploads KYC documents (ID, address proof, photo)
3. Admin reviews and approves/rejects
4. Professional goes live after approval

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.

