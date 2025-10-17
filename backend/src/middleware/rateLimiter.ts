import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Custom key generator to handle Azure's IP format with port numbers
const customKeyGenerator = (req: Request): string => {
  // Extract IP address from the request
  let ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Handle Azure's IP format with port (e.g., "105.179.7.98:60274")
  if (ip && ip.includes(':')) {
    // Split by colon and take the first part (IP address)
    ip = ip.split(':')[0];
  }
  
  // Fallback to a default key if no IP is found
  return ip || 'unknown';
};

// General API rate limiter (disabled for development)
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000'), // Very high limit for development
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

// Strict rate limiter for authentication endpoints (disabled for development)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased limit for development
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.round((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

// Password reset rate limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts, please try again later.',
      retryAfter: Math.round((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime - Date.now()) / 1000 : 3600)
    });
  }
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 file uploads per 15 minutes
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    message: 'Too many file uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many file uploads, please try again later.',
      retryAfter: Math.round((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime - Date.now()) / 1000 : 900)
    });
  }
});

// Search rate limiter
export const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 search requests per minute
  keyGenerator: customKeyGenerator,
  message: {
    success: false,
    message: 'Too many search requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many search requests, please try again later.',
      retryAfter: Math.round((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime - Date.now()) / 1000 : 60)
    });
  }
});

// Create custom rate limiter
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: customKeyGenerator,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.round((req as any).rateLimit?.resetTime ? ((req as any).rateLimit.resetTime - Date.now()) / 1000 : windowMs / 1000)
      });
    }
  });
};








