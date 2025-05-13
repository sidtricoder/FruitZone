import { Request, Response } from 'express';
import { sendOtpService, verifyOtpService } from '../services/authService';
import { generateToken } from '../utils/jwtHelper'; // We'll create this util soon

interface SendOtpRequestBody {
    mobile_number: string;
}

interface VerifyOtpRequestBody {
    mobile_number: string;
    otp: string;
}

export const sendOtpController = async (req: Request<{}, {}, SendOtpRequestBody>, res: Response) => {
    const { mobile_number } = req.body;

    if (!mobile_number) {
        return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Basic validation for mobile number format (can be enhanced)
    if (!/^\d{10,15}$/.test(mobile_number)) {
        return res.status(400).json({ message: 'Invalid mobile number format' });
    }

    try {
        const result = await sendOtpService(mobile_number);
        if (!result.success) {
            return res.status(result.statusCode || 500).json({ message: result.message });
        }
        // In a real app, the OTP would be sent via SMS. For now, we might return it in dev or just a success message.
        return res.status(200).json({ message: 'OTP sent successfully.' }); // For production, don't send OTP in response
    } catch (error) {
        console.error('[sendOtpController] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const verifyOtpController = async (req: Request<{}, {}, VerifyOtpRequestBody>, res: Response) => {
    const { mobile_number, otp } = req.body;

    if (!mobile_number || !otp) {
        return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    if (!/^\d{10,15}$/.test(mobile_number)) {
        return res.status(400).json({ message: 'Invalid mobile number format' });
    }

    try {
        const user = await verifyOtpService(mobile_number, otp);

        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP or mobile number' });
        }

        // User is verified, generate a JWT token
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
    } catch (error) {
        console.error('[verifyOtpController] Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
