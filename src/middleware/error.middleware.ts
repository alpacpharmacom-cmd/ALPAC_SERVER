import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const rawMessage =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Internal Server Error';
  const stack = err instanceof Error ? err.stack : undefined;

  // In production, never leak raw library/internal error messages to clients.
  // Log the real message server-side for debugging.
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.error('[errorHandler]:', rawMessage, stack);
  }
  const message = isProduction && statusCode === 500 ? 'Internal Server Error' : rawMessage;

  res.status(statusCode).json({
    success: false,
    message,
    stack: isProduction ? null : stack,
  });
};


export { errorHandler };
