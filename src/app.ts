import dotenv from 'dotenv';
dotenv.config({ override: true });
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

// ==================== SECURITY & HEADERS ====================
app.use(securityHeaders);
app.use(corsMiddleware);
// Explicitly handle OPTIONS preflight for all routes (required in serverless)
app.options('*', corsMiddleware);
app.use(express5QueryFix);
app.use(nosqlSanitizer);

// ==================== RATE LIMITING ====================
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
