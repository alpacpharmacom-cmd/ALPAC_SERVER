import dotenv from 'dotenv';
dotenv.config(); // No 'override: true' — Vercel dashboard env vars must not be overwritten by .env

import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import {
  securityHeaders,
  corsMiddleware,
  express5QueryFix,
  nosqlSanitizer,
  jsonErrorHandler,
} from './middleware/security';
import { xssSanitizer } from './middleware/sanitize.middleware';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { apiRouter } from './routes/api.router';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Trust Vercel's proxy so X-Forwarded-For is used for real client IPs.
// Without this, every request appears to come from the same internal IP,
// causing the rate limiter to incorrectly throttle all users together.
app.set('trust proxy', 1);

// ==================== SECURITY & HEADERS ====================
app.use(securityHeaders);
app.use(corsMiddleware);
// Explicitly handle OPTIONS preflight for all routes (required in serverless)
app.options(/.*/, corsMiddleware);
app.use(express5QueryFix);
app.use(nosqlSanitizer);

// ==================== RATE LIMITING ====================
// Rate limiters are placed AFTER corsMiddleware so that any 429 rejection
// response still includes the Access-Control-Allow-Origin header.
app.use('/api', generalLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// ==================== BODY PARSERS ====================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(jsonErrorHandler);

// ==================== INPUT SANITIZATION ====================
app.use(hpp());           // Prevent HTTP Parameter Pollution
app.use(xssSanitizer);    // Strip XSS from all string inputs

// ==================== ROUTES ====================
// System Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Alpac API!',
    data: { status: 'Running', version: '1.0.0', timestamp: new Date().toISOString() },
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: { status: 'UP', timestamp: new Date().toISOString() },
  });
});

// API Router Mount
app.use('/api', apiRouter);

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

export { app };
