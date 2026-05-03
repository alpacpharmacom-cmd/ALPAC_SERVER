import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { config } from '../utils/config';

// 1. Helmet Security Headers
export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// 2. CORS Configuration
// Hardcoded list ensures CORS works on Vercel regardless of env var state
const ALLOWED_ORIGINS = [
  'https://alpac-client.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, origin);
    }
    // Also allow any env-configured origin
    if (config.CORS_ORIGIN && origin === config.CORS_ORIGIN) {
      return callback(null, origin);
    }
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 200,
});

// 3. Express 5 Compatibility fix for express-mongo-sanitize
// Express 5 getters for query/body/params can be immutable; this ensures they are rewritable.
export const express5QueryFix = (req: Request, res: Response, next: NextFunction) => {
  const targets: (keyof Request)[] = ['query', 'body', 'params'];

  targets.forEach((target) => {
    if (req[target]) {
      Object.defineProperty(req, target, {
        value: { ...(req[target] as object) },
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
  });

  next();
};

// 4. NoSQL Injection Sanitizer
export const nosqlSanitizer = mongoSanitize();

// 5. Malformed JSON Handler
export const jsonErrorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  const isMalformedJson =
    err instanceof SyntaxError &&
    'status' in err &&
    (err as Record<string, unknown>).status === 400 &&
    'body' in err;

  if (isMalformedJson) {
    res.status(400).json({ message: 'Malformed JSON payload' });
    return;
  }
  next(err);
};
