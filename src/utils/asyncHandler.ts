import { Request, Response, NextFunction } from 'express';

const asyncHandler =
  <T = Request>(fn: (req: T, res: Response, next: NextFunction) => unknown) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as unknown as T, res, next)).catch(next);
  };

export { asyncHandler };
