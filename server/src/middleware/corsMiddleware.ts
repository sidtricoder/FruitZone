import { Request, Response, NextFunction } from 'express';

/**
 * Custom CORS middleware for handling cross-origin requests
 * This is a fallback in case the regular CORS middleware doesn't work properly on Vercel
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );

  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Move to the next middleware
  next();
};
