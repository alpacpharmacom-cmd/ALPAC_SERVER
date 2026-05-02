import { Request, Response, NextFunction } from 'express';

const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Internal Server Error';
  const stack = err instanceof Error ? err.stack : undefined;

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : stack,
  });
};

export { errorHandler };
