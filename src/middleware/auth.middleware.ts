import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler';
import { User } from '../models/user.model';
import { config } from '../utils/config';

// Extend Express Request to include the user property
export interface AuthRequest extends Request {
  user: {
    _id: string;
    isAdmin: boolean;
    name?: string;
    email: string; // Add email here since we need it in controllers
    [key: string]: unknown;
  };
}

export const verifyToken = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // 1. Check for token in cookies first (Higher security)
    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Fallback to Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2) {
        token = parts[1];
      }
    }

    if (token) {
      try {
        const secret = config.JWT_SECRET;

        const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { userId: string };

        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
          res.status(401);
          throw new Error('Not authorized, user not found');
        }

        // Ensure req.user has a consistent structure
        const userObj = user.toObject();
        req.user = {
          ...userObj,
          _id: user._id.toString(), // Ensure _id is a string for easy comparison
          isAdmin: user.checkIsAdmin(),
        };

        next();
      } catch (error: unknown) {
        res.status(401);
        if (error instanceof Error) {
          if (error.name === 'TokenExpiredError') {
            throw new Error('Not authorized, token expired', { cause: error });
          } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Not authorized, invalid token', { cause: error });
          }
        }
        throw error;
      }
    } else {
      res.status(401);
      throw new Error('Not authorized, no token provided');
    }
  }
);

export const verifyAdmin = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      res.status(403);
      throw new Error('Not authorized as an admin');
    }
  }
);
