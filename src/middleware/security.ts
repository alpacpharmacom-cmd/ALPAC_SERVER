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
// Localhost origins are only included in development to avoid production bypass vectors.
const PRODUCTION_ORIGINS = ['https://alpac-client.vercel.app'];
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

const ALLOWED_ORIGINS = [
  ...PRODUCTION_ORIGINS,
  ...(config.NODE_ENV !== 'production' ? DEV_ORIGINS : []),
  ...(config.CORS_ORIGIN ? [config.CORS_ORIGIN] : []),
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // No origin = server-to-server / non-browser (curl, Postman).
    // These are not protected by CORS anyway, so allow them through.
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
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
