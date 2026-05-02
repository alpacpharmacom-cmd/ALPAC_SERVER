import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { Product } from '../models/product.model';

vi.mock('../models/product.model', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    then: vi.fn(function (this: any, resolve: (value: unknown) => void) {
      return Promise.resolve(this._data).then(resolve);
    }),
    _data: null as unknown,
  };

  return {
    Product: {
      find: vi.fn(() => mockQuery),
      findById: vi.fn(() => mockQuery),
    },
  };
});

describe('Product API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const mockProducts = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Product 1',
          price: 100,
          countInStock: 10,
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Product 2',
          price: 200,
          countInStock: 0,
        },
      ];

      const mockQuery = (Product.find as Mock)();
      mockQuery._data = mockProducts;

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product details if found', async () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Product 1',
        price: 100,
        countInStock: 10,
      };

      const mockQuery = (Product.findById as Mock)();
      mockQuery._data = mockProduct;

      const res = await request(app).get('/api/products/507f1f77bcf86cd799439011');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Product 1');
    });

    it('should return 404 if product not found', async () => {
      const mockQuery = (Product.findById as Mock)();
      mockQuery._data = null;

      const res = await request(app).get('/api/products/507f1f77bcf86cd799439013');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
