import { Router } from 'express';
import { AuthService } from '../services/authService.js';
import { HttpError } from '../utils/httpError.js';

export const authRouter = Router();

authRouter.post('/signup', async (req, res, next) => {
  try {
    const result = await AuthService.signup(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'No token provided');
    }

    const token = authHeader.substring(7);
    const organization = await AuthService.verifyToken(token);

    res.json({ organization });
  } catch (error) {
    next(error);
  }
});

