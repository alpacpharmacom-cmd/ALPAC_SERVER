import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

// Mock the database connection in app.ts or where it's called
// Since app.ts doesn't call connectDB(), we don't need to mock it there.
// But we might need to mock models if they are used in routes.

describe('Health Check Endpoint', () => {
  it('GET /api/health should return 200 and success status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Server is healthy');
    expect(res.body.data.status).toBe('UP');
  });

  it('GET / should return 200 and welcome message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Welcome to the Alpac API!');
  });
});
