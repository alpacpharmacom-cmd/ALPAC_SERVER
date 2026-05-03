import { app } from '../src/app';
import { connectDB } from '../src/lib/db';

// Initialize the database connection for serverless invocations
connectDB();

export default app;
 