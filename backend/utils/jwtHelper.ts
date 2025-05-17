import jwt from 'jsonwebtoken';

interface TokenPayload {
    userId: number;
    mobileNumber: string;
}

// It's crucial that JWT_SECRET is set in your environment variables.
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
    // In production, failing to have a JWT_SECRET is a critical security issue.
    console.error("FATAL ERROR: JWT_SECRET is not defined in environment variables. Application cannot securely issue tokens.");
    // Consider throwing an error to halt application startup in production if the secret is missing.
    // throw new Error("FATAL ERROR: JWT_SECRET is not defined. Halting application.");
} else if (!JWT_SECRET) {
    console.warn("Warning: JWT_SECRET is not defined. Using a default insecure secret for development. DO NOT USE IN PRODUCTION.");
}

// Fallback for development if JWT_SECRET is not set, to allow basic functionality.
// THIS IS INSECURE FOR PRODUCTION.
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'default-insecure-secret-for-dev-only';

export const generateToken = (payload: TokenPayload): string => {
    if (EFFECTIVE_JWT_SECRET === 'default-insecure-secret-for-dev-only' && process.env.NODE_ENV === 'production') {
        // Final check to prevent using default secret in production, though the initial check should catch this.
        console.error("CRITICAL: Attempting to use default insecure JWT_SECRET in production.");
        throw new Error("Token generation failed due to missing or insecure JWT_SECRET in production.");
    }
    return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: '1d' }); // Token expires in 1 day
};

export const verifyToken = (token: string): TokenPayload | null => {
    if (EFFECTIVE_JWT_SECRET === 'default-insecure-secret-for-dev-only' && process.env.NODE_ENV === 'production') {
        console.error("CRITICAL: Attempting to verify token with default insecure JWT_SECRET in production.");
        return null; // Or throw an error
    }
    try {
        const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as TokenPayload;
        return decoded;
    } catch (error) {
        console.error("Invalid token:", error); // This should work in your Node env
        return null;
    }
};
