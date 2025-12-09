import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || JWT_SECRET + '-admin';
const JWT_EXPIRES_IN = '7d';

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const AdminService = {
  async login(payload: unknown) {
    const parsed = adminLoginSchema.parse(payload);

    const admin = await prisma.admin.findUnique({
      where: { email: parsed.email },
    });

    if (!admin) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(parsed.password, admin.password);

    if (!isValidPassword) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: 'admin' },
      ADMIN_JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        createdAt: admin.createdAt.toISOString(),
      },
      token,
    };
  },

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as {
        adminId: string;
        email: string;
        role: string;
      };

      if (decoded.role !== 'admin') {
        throw new HttpError(401, 'Invalid admin token');
      }

      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      if (!admin) {
        throw new HttpError(401, 'Admin not found');
      }

      return admin;
    } catch (error) {
      throw new HttpError(401, 'Invalid or expired token');
    }
  },

  async listOrganizations() {
    const orgs = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        mission: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orgs.map((org) => ({
      id: org.id,
      name: org.name,
      email: org.email,
      mission: org.mission,
      isActive: org.isActive,
      createdAt: org.createdAt.toISOString(),
    }));
  },

  async toggleOrganizationStatus(organizationId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, isActive: true },
    });

    if (!org) {
      throw new HttpError(404, 'Organization not found');
    }

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { isActive: !org.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        mission: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      mission: updated.mission,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
    };
  },

  async listGlobalPersonas() {
    const personas = await prisma.persona.findMany({
      // @ts-ignore
      where: { organizationId: null },
      orderBy: { createdAt: 'desc' },
    });
    return personas;
  },

  async createGlobalPersona(payload: unknown) {
    const schema = z.object({
      displayName: z.string().min(1),
      personalityTraits: z.array(z.string()),
      bio: z.string().optional(),
    });

    const parsed = schema.parse(payload);

    const persona = await prisma.persona.create({
      data: {
        displayName: parsed.displayName,
        personalityTraits: parsed.personalityTraits,
        bio: parsed.bio || null,
        // @ts-ignore - Global persona has null organizationId
        organizationId: null,
      },
    });

    return persona;
  },

  async deleteGlobalPersona(id: string) {
    // Ensure it's actually a global persona before deleting
    const persona = await prisma.persona.findUnique({
      where: { id },
    });

    if (!persona) {
      throw new HttpError(404, 'Persona not found');
    }

    if (persona.organizationId !== null) {
      throw new HttpError(403, 'Cannot delete organization-specific persona');
    }

    await prisma.persona.delete({
      where: { id },
    });

    return { success: true };
  },

  async updateGlobalPersona(id: string, payload: unknown) {
    const schema = z.object({
      displayName: z.string().min(1).optional(),
      personalityTraits: z.array(z.string()).optional(),
      bio: z.string().optional(),
    });

    const parsed = schema.parse(payload);

    // Ensure it's a global persona
    const existing = await prisma.persona.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new HttpError(404, 'Persona not found');
    }

    if (existing.organizationId !== null) {
      throw new HttpError(403, 'Cannot update organization-specific persona');
    }

    const persona = await prisma.persona.update({
      where: { id },
      data: {
        ...(parsed.displayName && { displayName: parsed.displayName }),
        ...(parsed.personalityTraits && { personalityTraits: parsed.personalityTraits }),
        ...(parsed.bio !== undefined && { bio: parsed.bio || null }),
      },
    });

    return persona;
  },

  async togglePersonaStatus(id: string) {
    const persona = await prisma.persona.findUnique({
      where: { id },
      select: { id: true, isActive: true, organizationId: true },
    });

    if (!persona) {
      throw new HttpError(404, 'Persona not found');
    }

    if (persona.organizationId !== null) {
      throw new HttpError(403, 'Cannot toggle organization-specific persona');
    }

    const updated = await prisma.persona.update({
      where: { id },
      data: { isActive: !persona.isActive },
    });

    return updated;
  },
};

