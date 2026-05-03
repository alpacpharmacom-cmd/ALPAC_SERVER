import { app } from '../src/app';
import { connectDB } from '../src/lib/db';
import { config } from '../src/utils/config';

const ALLOWED_ORIGINS = [
  'https://alpac-client.vercel.app',
  'http://localhost:5173',
  config.CORS_ORIGIN,
].filter(Boolean);

export default async function handler(req: any, res: any) {
  // --- Manual CORS headers (required for Vercel serverless) ---
  const origin = req.headers['origin'] || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '');

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  // Handle preflight OPTIONS immediately
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await connectDB();
    return app(req, res);
  } catch (err: any) {
    console.error('[api/index]: Failed to connect to DB', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed. Ensure MongoDB Atlas Network Access is set to 0.0.0.0/0',
      error: err.message 
    });
  }
}