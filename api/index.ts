import { app } from '../src/app';
import { connectDB } from '../src/lib/db';

import { config } from '../src/utils/config';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err: any) {
    console.error('[api/index]: Failed to connect to DB', err);
    res.setHeader('Access-Control-Allow-Origin', config.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed. Ensure MongoDB Atlas Network Access is set to 0.0.0.0/0',
      error: err.message 
    });
  }
}