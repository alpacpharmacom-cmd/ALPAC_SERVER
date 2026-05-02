import { Response } from 'express';

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};

export const successResponse = <T>(
  res: Response,
  data?: T,
  message: string = 'Success',
  statusCode: number = 200
) => {
  return sendResponse(res, statusCode, true, message, data);
};

export const errorResponse = (
  res: Response,
  message: string = 'Error',
  statusCode: number = 500,
  stack?: string
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : stack,
  });
};
