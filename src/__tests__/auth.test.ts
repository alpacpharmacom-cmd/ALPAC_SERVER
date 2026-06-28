import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { User } from '../models/user.model';

vi.mock('../models/user.model', () => {
  return {
    User: {
      findOne: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    },
  };
});

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = { email: 'test@example.com', name: 'Test User', phone: '1234567890', password: 'password123' };

      (User.findOne as Mock).mockResolvedValue(null);
      (User.create as Mock).mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        ...userData,
        checkIsAdmin: () => false,
      });

      const res = await request(app).post('/api/users/register').send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(userData.email);
    });

    it('should return 400 if user already exists', async () => {
      const userData = { email: 'test@example.com', name: 'Test User', phone: '1234567890', password: 'password123' };

      (User.findOne as Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

      const res = await request(app).post('/api/users/register').send(userData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User already exists');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        _id: 'mock-id',
        email: loginData.email,
        matchPassword: vi.fn().mockResolvedValue(true),
        checkIsAdmin: () => false,
      };

      (User.findOne as Mock).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app).post('/api/users/login').send(loginData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(loginData.email);
    });

    it('should return 401 with incorrect credentials', async () => {
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      const mockUser = {
        _id: 'mock-id',
        email: loginData.email,
        matchPassword: vi.fn().mockResolvedValue(false),
      };

      (User.findOne as Mock).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockUser),
      });

      const res = await request(app).post('/api/users/login').send(loginData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
