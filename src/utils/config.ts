import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters long'),
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ADMIN_EMAILS: z.string().optional().default(''),
  CORS_ORIGIN: z.string().url().optional().default('http://localhost:5173'),
  EMAIL_SERVICE: z.string().optional().default('gmail'),
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  FROM_EMAIL: z.string().email().optional().default('no-reply@Alpac.com'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  // eslint-disable-next-line no-console
  console.error('[config]: ❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const config = _env.data;
