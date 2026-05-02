import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Recursively sanitize all string values in an object to prevent XSS attacks.
 * Strips dangerous HTML/script tags while preserving safe text content.
 */
const sanitizeValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return xss(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
};

/**
 * Global XSS sanitization middleware.
 * Recursively sanitizes all string values in req.body, req.query, and req.params
 * to strip malicious HTML and script injections.
 */
export const xssSanitizer = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    Object.defineProperty(req, 'query', {
      value: sanitizeValue(req.query),
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  if (req.params && typeof req.params === 'object') {
    Object.defineProperty(req, 'params', {
      value: sanitizeValue(req.params) as Record<string, string>,
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }

  next();
};
