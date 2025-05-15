import { Router, Request, Response } from 'express';
import { sendOtpController, verifyOtpController } from '../controllers/authController';

const router = Router();

/**
 * Handle OPTIONS requests explicitly for CORS preflight
 * This is especially important for deployed environments like Vercel
 */
router.options('/*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  res.status(200).end();
});

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP to user's mobile number
 * @access  Public
 * @body    { mobile_number: string } - Mobile number to send OTP to
 * @returns { success: boolean, message: string } - Success/failure message
 * @notes   This endpoint will create a new user if the mobile number doesn't exist
 *          It will update an existing user's OTP if the mobile number exists
 */
router.post('/send-otp', sendOtpController);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and authenticate the user
 * @access  Public
 * @body    { mobile_number: string, otp: string } - Mobile number and OTP to verify
 * @returns { success: boolean, message: string, token: string, user: object } - Authentication token and user data
 * @notes   This endpoint validates the OTP and marks the user as verified
 *          A JWT token is returned for subsequent authenticated requests
 */
router.post('/verify-otp', verifyOtpController);

export default router;
