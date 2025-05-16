import { pool } from '../config/database';
import { executeQuery, executeTransaction } from '../utils/queryHelper';
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
    name?: string | null; // Added
    default_address_id?: number | null; // Added (assuming BIGINT maps to number)
    created_at: Date;
    updated_at: Date;
}

// Define specific types for the service response
interface SendOtpServiceSuccess {
    success: true;
    message: string;
}

interface SendOtpServiceError {
    success: false;
    message: string;
    statusCode: number;
    error?: Error; // To hold the original error object
}

export type SendOtpServiceResponse = SendOtpServiceSuccess | SendOtpServiceError;

/**
 * Generates an OTP, stores it for the user (creating user if not exists),
 * and (conceptually) sends it.
 */
export const sendOtpService = async (mobileNumber: string): Promise<SendOtpServiceResponse> => {
    const otp = otpGenerator.generate(OTP_LENGTH, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
    });
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    try {
        console.log('[sendOtpService] Starting OTP generation for:', mobileNumber);

        // Use a transaction for atomicity - either everything succeeds or nothing does
        return await executeTransaction<SendOtpServiceResponse>(async (client) => {
            try {
                // Check if user exists
                let userResult = await client.query<User>(
                    'SELECT * FROM users WHERE mobile_number = $1', 
                    [mobileNumber]
                );
                
                let user: User | null = userResult.rows[0] || null;

                if (user) {
                    // User exists, update OTP and expiry
                    await client.query(
                        'UPDATE users SET otp = $1, otp_expires_at = $2, updated_at = NOW() WHERE id = $3',
                        [otp, otpExpiresAt, user.id]
                    );
                    console.log('[sendOtpService] Updated OTP for existing user:', user.id);
                } else {
                    // User does not exist, create new user
                    // name and default_address_id will be NULL by default as per schema
                    const newUserResult = await client.query<User>(
                        'INSERT INTO users (mobile_number, otp, otp_expires_at, is_verified) VALUES ($1, $2, $3, FALSE) RETURNING *',
                        [mobileNumber, otp, otpExpiresAt]
                    );
                    user = newUserResult.rows[0];
                    console.log('[sendOtpService] Created new user:', user);
                }

                console.log(`[sendOtpService] OTP for ${mobileNumber}: ${otp}`); // For development: Log OTP. DO NOT do this in production.
                // TODO: Integrate SMS gateway to send OTP to user's mobileNumber

                return { success: true, message: 'OTP generated and (conceptually) sent.' };
            } catch (innerError: any) {
                // This will trigger a ROLLBACK in the transaction wrapper
                throw innerError;
            }
        });
    } catch (error: any) {
        console.error('[sendOtpService] Database/Service Error:', error);
        let statusCode = 500;
        let message = 'Failed to process OTP request due to a server error.';
        
        // Provide more specific error messages based on common Postgres error codes
        if (error.code === '23505') { // unique_violation
            statusCode = 409; // Conflict
            message = 'This mobile number is already registered.';
        } else if (error.code === '23502') { // not_null_violation
            statusCode = 400; // Bad Request
            message = 'Missing required fields.';
        } else if (error.code === '08006' || error.code === '57P01') { // connection issues
            statusCode = 503; // Service Unavailable
            message = 'Database connection error. Please try again later.';
        }
        
        return { 
            success: false, 
            message, 
            statusCode,
            error: error // Include the original error object for logging
        };
    }
};

/**
 * Verifies the OTP provided by the user.
 * Returns user details if OTP is valid, null otherwise.
 * Throws an error for unexpected issues (e.g., database connection).
 */
export const verifyOtpService = async (mobileNumber: string, otp: string): Promise<User | null> => {
    try {
        console.log('[verifyOtpService] Starting OTP verification for:', mobileNumber);
        
        // Using transaction to ensure all operations are atomic
        return await executeTransaction<User | null>(async (client) => {
            // Check if user exists and get their OTP details
            const userResult = await client.query<User>(
                'SELECT * FROM users WHERE mobile_number = $1',
                [mobileNumber]
            );

            const user = userResult.rows[0];
            
            // Validation checks
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
                // Increment failed attempts counter here if you want to implement that feature
                return null; // OTP does not match
            }

            if (new Date() > new Date(user.otp_expires_at)) {
                console.log(`[verifyOtpService] OTP expired for user: ${mobileNumber}`);
                // Clear expired OTP
                await client.query(
                    'UPDATE users SET otp = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1', 
                    [user.id]
                );
                return null; // OTP expired
            }

            // OTP is valid, mark user as verified and clear OTP
            // The RETURNING * will include all user fields including name and default_address_id
            const updatedUserResult = await client.query<User>(
                'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *',
                [user.id]
            );
            
            console.log(`[verifyOtpService] User ${mobileNumber} verified successfully`);
            return updatedUserResult.rows[0] || null;
        });    } catch (error: any) {
        console.error('[verifyOtpService] Database/Transaction Error:', error);
        
        // Add retry logic for specific types of errors
        if (error.code === '08006' || error.code === '57P01') {
            console.log('[verifyOtpService] Connection error detected, retrying...');
            
            // Simple retry for connection issues - just once
            try {
                const userResult = await executeQuery<User>(
                    'SELECT * FROM users WHERE mobile_number = $1 AND otp = $2 AND otp_expires_at > NOW()',
                    [mobileNumber, otp]
                );
                
                if (userResult.rowCount && userResult.rowCount !== undefined && userResult.rowCount > 0) {
                    // OTP is valid, mark user as verified and clear OTP in a separate query
                    const updatedUserResult = await executeQuery<User>(
                        'UPDATE users SET is_verified = TRUE, otp = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1 RETURNING *',
                        [userResult.rows[0].id]
                    );
                    
                    return updatedUserResult.rows[0] || null;
                }
                return null;
            } catch (retryError) {
                console.error('[verifyOtpService] Retry also failed:', retryError);
                throw retryError; 
            }
        }
        
        // Re-throw the original error if not handled above
        throw error;
    }
}
