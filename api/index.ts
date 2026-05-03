import { app } from '../src/app';
import { connectDB } from '../src/lib/db';
import { config } from '../src/utils/config';

const ALLOWED_ORIGINS = [
  'https://alpac-client.vercel.app',
  'http://localhost:5173',
  config.CORS_ORIGIN,
].filter(Boolean) as string[];

/** Apply CORS headers — must run before any early return or throw */
function applyCorsHeaders(req: any, res: any) {
  const origin: string = req.headers['origin'] || '';

  // Only echo back the origin if it is explicitly allowed.
  // For unknown origins, omit the header entirely (don't fall back to another origin).
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  }
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req: any, res: any) {
  // Always set CORS first — before any await, throw, or early return
  applyCorsHeaders(req, res);

  // Handle preflight OPTIONS immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    return app(req, res);
  } catch (err: any) {
    // Log full error internally but never expose DB details to clients
    console.error('[api/index]: Failed to connect to DB', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again later.',
    });
  }
}