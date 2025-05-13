import { Router } from 'express';
import { sendOtpController, verifyOtpController } from '../controllers/authController';

const router = Router();

// @route   POST /api/auth/send-otp
// @desc    Send OTP to user's mobile number
// @access  Public
router.post('/send-otp', sendOtpController);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login user / create user
// @access  Public
router.post('/verify-otp', verifyOtpController);

export default router;
