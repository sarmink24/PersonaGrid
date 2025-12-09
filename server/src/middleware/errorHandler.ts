import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Unexpected server error' });
};

