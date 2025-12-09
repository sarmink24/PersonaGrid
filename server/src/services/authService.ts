import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import crypto from 'crypto';
import { sendResetPasswordEmail } from './emailService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const signupSchema = z.object({
  name: z.string().min(3).max(80),
  email: z.string().email(),
  password: z.string().min(6),
  mission: z.string().max(280).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const AuthService = {
  async signup(payload: unknown) {
    const parsed = signupSchema.parse(payload);

    // Check if organization with email already exists
    const existing = await prisma.organization.findUnique({
      where: { email: parsed.email },
    });

    if (existing) {
      throw new HttpError(409, 'Organization with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(parsed.password, 10);

    // Create organization
    const org = await prisma.organization.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        password: hashedPassword,
        mission: parsed.mission ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mission: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { organizationId: org.id, email: org.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      organization: {
        id: org.id,
        name: org.name,
        email: org.email,
        mission: org.mission,
        createdAt: org.createdAt.toISOString(),
      },
      token,
    };
  },

  async login(payload: unknown) {
    const parsed = loginSchema.parse(payload);

    // Find organization by email
    const org = await prisma.organization.findUnique({
      where: { email: parsed.email },
    });

    if (!org || !org.password) {
      throw new HttpError(401, 'Invalid email or password');
    }

    // Check if organization is active
    if (!org.isActive) {
      throw new HttpError(403, 'Organization is deactivated. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(parsed.password, org.password);

    if (!isValidPassword) {
      throw new HttpError(401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { organizationId: org.id, email: org.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      organization: {
        id: org.id,
        name: org.name,
        email: org.email,
        mission: org.mission,
        createdAt: org.createdAt.toISOString(),
      },
      token,
    };
  },

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        organizationId: string;
        email: string;
      };

      const org = await prisma.organization.findUnique({
        where: { id: decoded.organizationId },
        select: {
          id: true,
          name: true,
          email: true,
          mission: true,
          isActive: true,
          createdAt: true,
        },
      });

      if (!org || !org.email) {
        throw new HttpError(401, 'Organization not found');
      }

      if (!org.isActive) {
        throw new HttpError(403, 'Organization is deactivated. Please contact administrator.');
      }

      return {
        id: org.id,
        name: org.name,
        email: org.email,
        mission: org.mission,
        createdAt: org.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(401, 'Invalid or expired token');
    }
    throw new HttpError(401, 'Invalid or expired token');
  },

  async forgotPassword(email: string) {
    // Check Admin first
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (admin) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expires,
        },
      });

      await sendResetPasswordEmail(email, token);
      return { message: 'Password reset email sent' };
    }

    // Check Organization
    const org = await prisma.organization.findUnique({ where: { email } });
    if (org) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000); // 1 hour

      await prisma.organization.update({
        where: { id: org.id },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expires,
        },
      });

      await sendResetPasswordEmail(email, token);
      return { message: 'Password reset email sent' };
    }

    throw new HttpError(404, 'User not found');
  },

  async resetPassword(token: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check Admin
    const admin = await prisma.admin.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (admin) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });
      return { message: 'Password reset successfully' };
    }

    // Check Organization
    const org = await prisma.organization.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (org) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });
      return { message: 'Password reset successfully' };
    }

    throw new HttpError(400, 'Invalid or expired token');
  },
};

