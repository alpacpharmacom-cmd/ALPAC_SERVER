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
const allowedOrigins = [
  config.CORS_ORIGIN,
  'http://localhost:5173',
  'https://alpac-client.vercel.app'
];

export const corsMiddleware = cors({
  origin: allowedOrigins,
  credentials: true,
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
