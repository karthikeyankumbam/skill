// Simple OTP generator and validator
// In production, integrate with Twilio or similar service

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone) => {
  const otp = generateOTP();
  const expiresAt = Date.now() + (process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000;

  otpStore.set(phone, {
    otp,
    expiresAt,
    attempts: 0
  });

  // In production, send via Twilio/SMS service
  console.log(`OTP for ${phone}: ${otp} (Expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes)`);

  // Simulate Twilio integration
  /*
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  
  await client.messages.create({
    body: `Your SkillLink OTP is ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
  */

  return { success: true, message: 'OTP sent successfully' };
};

const verifyOTP = (phone, otp) => {
  const stored = otpStore.get(phone);

  if (!stored) {
    return { valid: false, message: 'OTP not found or expired' };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phone);
    return { valid: false, message: 'OTP has expired' };
  }

  if (stored.attempts >= 5) {
    otpStore.delete(phone);
    return { valid: false, message: 'Too many failed attempts' };
  }

  if (stored.otp !== otp) {
    stored.attempts += 1;
    return { valid: false, message: 'Invalid OTP' };
  }

  // OTP verified successfully
  otpStore.delete(phone);
  return { valid: true, message: 'OTP verified' };
};

const clearOTP = (phone) => {
  otpStore.delete(phone);
};

module.exports = {
  sendOTP,
  verifyOTP,
  clearOTP
};

