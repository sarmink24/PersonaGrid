import type { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService.js';
import { HttpError } from '../utils/httpError.js';

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    email: string;
    createdAt: string;
  };
}

export const authenticateAdmin = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const admin = await AdminService.verifyToken(token);

    req.admin = {
      id: admin.id,
      email: admin.email,
      createdAt: admin.createdAt.toISOString(),
    };
    next();
  } catch (error) {
    next(error);
  }
};

