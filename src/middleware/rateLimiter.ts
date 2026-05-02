import rateLimit from 'express-rate-limit';

// Global Rate Limiting for all endpoints
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 150 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict Rate Limiting for Auth
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // Limit each IP to 5 requests per windowMs
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
