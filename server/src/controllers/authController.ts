import { Request, Response } from 'express';
// Ensure SendOtpServiceResponse is imported if it's a named export, or adjust types here
import { sendOtpService, verifyOtpService, SendOtpServiceResponse } from '../services/authService'; 
import { generateToken } from '../utils/jwtHelper'; // We'll create this util soon

interface SendOtpRequestBody {
    mobile_number?: string;
    mobileNumber?: string; // Adding support for camelCase
}

interface VerifyOtpRequestBody {
    mobile_number?: string;
    mobileNumber?: string; // Adding support for camelCase
    otp: string;
}

export const sendOtpController = async (req: Request<{}, {}, SendOtpRequestBody>, res: Response) => {
    console.log('Request body:', req.body); // Debug: log the request body
    
    // Support both mobile_number and mobileNumber
    const mobile_number = req.body.mobile_number || req.body.mobileNumber;

    if (!mobile_number) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Basic validation for mobile number format (can be enhanced)
    if (!/^\d{10,15}$/.test(mobile_number)) {
        return res.status(400).json({ message: 'Invalid mobile number format' });
    }

    try {
        const result: SendOtpServiceResponse = await sendOtpService(mobile_number);
        if (!result.success) {
            // Service layer handled the error and provided a message and status code
            console.error(`sendOtpService failed for ${mobile_number}: ${result.message}`, result.error); // Added detailed logging
            return res.status(result.statusCode || 500).json({ 
                message: result.message,
                error: result.error ? { message: result.error.message, stack: result.error.stack } : undefined
            });
        }
        return res.status(200).json({ message: 'OTP sent successfully.' });
    } catch (error: any) { // Catch any unexpected errors not caught by the service
        console.error(`Unexpected error in sendOtpController for ${mobile_number}:`, error); // Added detailed logging
        return res.status(500).json({
            message: error.message || 'Internal server error',
            stack: error.stack
        });
    }
};

export const verifyOtpController = async (req: Request<{}, {}, VerifyOtpRequestBody>, res: Response) => {
    console.log('Verify OTP request body:', req.body); // Debug: log the request body
    
    // Support both mobile_number and mobileNumber
    const mobile_number = req.body.mobile_number || req.body.mobileNumber;
    const { otp } = req.body;

    if (!mobile_number || !otp) {
        return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    if (!/^\d{10,15}$/.test(mobile_number)) {
        return res.status(400).json({ message: 'Invalid mobile number format' });
    }

    try {
        const user = await verifyOtpService(mobile_number, otp);

        if (!user) {
            // Log this attempt for easier debugging
            console.warn(`Invalid OTP or mobile number attempt: ${mobile_number}`);
            return res.status(400).json({ message: 'Invalid OTP or mobile number' });
        }

        // User is verified, generate a JWT token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("FATAL: JWT_SECRET is not defined in environment variables.");
            return res.status(500).json({
                message: 'Internal server error: JWT configuration missing.',
                detail: 'JWT_SECRET environment variable is not set.'
            });
        }
        const token = generateToken({ userId: user.id, mobileNumber: user.mobile_number });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                mobile_number: user.mobile_number,
                is_verified: user.is_verified
            }
        });
    } catch (error: any) {
        console.error(`Unexpected error in verifyOtpController for ${mobile_number}:`, error); // Added detailed logging
        return res.status(500).json({
            message: error.message || 'Internal server error',
            stack: error.stack
        });
    }
};
