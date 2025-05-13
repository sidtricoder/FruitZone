import { pool } from '../config/database';
import otpGenerator from 'otp-generator';
// import bcrypt from 'bcrypt'; // Not strictly needed for OTP, but if you store hashed OTPs

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5; // OTP valid for 5 minutes

interface User {
    id: number;
    mobile_number: string;
    otp?: string | null;
    otp_expires_at?: Date | null;
    is_verified: boolean;
    created_at: Date;
    updated_at: Date;
}

/**
 * Generates an OTP, stores it for the user (creating user if not exists),
 * and (conceptually) sends it.
 */
export const sendOtpService = async (mobileNumber: string): Promise<{ success: boolean; message: string; statusCode?: number }> => {
    const otp = otpGenerator.generate(OTP_LENGTH, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const client = await pool.connect();
    try {
        // Check if user exists
        let userResult = await client.query<User>('SELECT * FROM users WHERE mobile_number = $1', [mobileNumber]);
        let user: User | null = userResult.rows[0] || null;

        if (user) {
            // User exists, update OTP and expiry
            await client.query(
                'UPDATE users SET otp = $1, otp_expires_at = $2, updated_at = NOW() WHERE id = $3',
                [otp, otpExpiresAt, user.id]
            );
        } else {
            // User does not exist, create new user
            const newUserResult = await client.query<User>(
                'INSERT INTO users (mobile_number, otp, otp_expires_at, is_verified) VALUES ($1, $2, $3, FALSE) RETURNING *',
                [mobileNumber, otp, otpExpiresAt]
            );
            user = newUserResult.rows[0];
        }

        console.log(`OTP for ${mobileNumber}: ${otp}`); // For development: Log OTP. DO NOT do this in production.
        // TODO: Integrate SMS gateway to send OTP to user's mobileNumber

        return { success: true, message: 'OTP generated and (conceptually) sent.' };

    } catch (error) {
        console.error('[sendOtpService] Database Error:', error);
        return { success: false, message: 'Failed to process OTP request due to a database error.', statusCode: 500 };
    } finally {
        client.release();
    }
};

/**
 * Verifies the OTP provided by the user.
 * Returns user details if OTP is valid, null otherwise.
 */
export const verifyOtpService = async (mobileNumber: string, otp: string): Promise<User | null> => {
    const client = await pool.connect();
    try {
        const userResult = await client.query<User>(
            'SELECT * FROM users WHERE mobile_number = $1',
            [mobileNumber]
        );

        const user = userResult.rows[0];

        if (!user) {
            console.log(`[verifyOtpService] User not found for mobile: ${mobileNumber}`);
            return null; // User not found
        }

        if (!user.otp || !user.otp_expires_at) {
            console.log(`[verifyOtpService] No OTP found for user: ${mobileNumber}`);
            return null; // No OTP was set for this user
        }

        if (user.otp !== otp) {
            console.log(`[verifyOtpService] Invalid OTP for user: ${mobileNumber}. Expected: ${user.otp}, Got: ${otp}`);
            return null; // OTP does not match
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            console.log(`[verifyOtpService] OTP expired for user: ${mobileNumber}`);
            // Optionally clear the expired OTP
            await client.query('UPDATE users SET otp = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1', [user.id]);
            return null; // OTP expired
        }

        // OTP is valid, mark user as verified and clear OTP
        const updatedUserResult = await client.query<User>(
            'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *',
            [user.id]
        );
        
        return updatedUserResult.rows[0] || null;

    } catch (error) {
        console.error('[verifyOtpService] Database Error:', error);
        return null; // Or throw a custom error to be handled by the controller
    } finally {
        client.release();
    }
};
