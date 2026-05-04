import { app } from '../src/app';
import { connectDB } from '../src/lib/db';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err: any) {
    // Log full error internally but never expose DB details to clients
    console.error('[api/index]: Failed to connect to DB', err);

    // Still need CORS headers on error responses so the browser can read the body
    const origin: string = req.headers['origin'] || '';
    if (origin === 'https://alpac-client.vercel.app') {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Content-Type', 'application/json');
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again later.',
    });
  }
}