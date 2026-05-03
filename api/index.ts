import { app } from '../src/app';
import { connectDB } from '../src/lib/db';

// Initialize the database connection for serverless invocations
connectDB().catch(err => console.error('[api/index]: Failed to connect to DB during initialization', err));

export default app;
 