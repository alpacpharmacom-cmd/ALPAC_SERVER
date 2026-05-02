import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from './config';

const generateToken = (res: Response, userId: string) => {
  const secret = config.JWT_SECRET;

  const token = jwt.sign({ userId }, secret, {
    expiresIn: '30d',
  });

  // Set JWT as HTTP-Only Cookie for added security
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return token; // Also return the token in case you want to send it in the JSON response
};

export { generateToken };
