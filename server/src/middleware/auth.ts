import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { HttpError } from '../utils/httpError.js';

export interface AuthRequest extends Request {
  organization?: {
    id: string;
    name: string;
    email: string;
    mission: string | null;
    createdAt: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const organization = await AuthService.verifyToken(token);
    
    if (!organization.email) {
      throw new HttpError(401, 'Invalid organization');
    }

    req.organization = organization;
    next();
  } catch (error) {
    next(error);
  }
};

