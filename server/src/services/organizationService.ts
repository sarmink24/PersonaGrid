import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import type {
  Organization,
  Persona,
  PersonaWithProfiles,
  SocialProfile,
} from '../types/index.js';
import { HttpError } from '../utils/httpError.js';
import type { Persona as PrismaPersona, PersonaSocialProfile as PrismaSocialProfile } from '../generated/prisma/index.js';

const organizationSchema = z.object({
  name: z.string().min(3).max(80),
  mission: z.string().max(280).optional(),
});

const personaSchema = z.object({
  displayName: z.string().min(3).max(60),
  personalityTraits: z.array(z.string().min(2).max(40)).min(3).max(8),
  bio: z.string().max(280).optional(),
  socialProfiles: z
    .array(
      z.object({
        network: z.enum(['twitter', 'instagram', 'facebook']),
        handle: z
          .string()
          .regex(/^[A-Za-z0-9_\\.]{3,30}$/u, 'Invalid social handle'),
      })
    )
    .max(3)
    .optional()
    .default([]),
});

const mapOrganization = (org: {
  id: string;
  name: string;
  mission: string | null;
  createdAt: Date;
}): Organization => ({
  id: org.id,
  name: org.name,
  mission: org.mission,
  createdAt: org.createdAt.toISOString(),
});

const mapPersona = (persona: {
  id: string;
  organizationId: string;
  displayName: string;
  personalityTraits: string[];
  bio: string | null;
  createdAt: Date;
}): Persona => ({
  id: persona.id,
  organizationId: persona.organizationId,
  displayName: persona.displayName,
  personalityTraits: persona.personalityTraits,
  bio: persona.bio,
  createdAt: persona.createdAt.toISOString(),
});

const mapSocialProfile = (profile: {
  id: string;
  personaId: string;
  network: string;
  handle: string;
  accessToken: string | null;
  createdAt: Date;
}): SocialProfile => ({
  id: profile.id,
  personaId: profile.personaId,
  network: profile.network as SocialProfile['network'],
  handle: profile.handle,
  accessToken: profile.accessToken,
  createdAt: profile.createdAt.toISOString(),
});

const ensureOrganization = async (organizationId: string): Promise<void> => {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true },
  });

  if (!org) {
    throw new HttpError(404, 'Organization not found');
  }
};

export const OrganizationService = {

  async listPersonas(organizationId: string): Promise<PersonaWithProfiles[]> {
    await ensureOrganization(organizationId);

    const personas = await prisma.persona.findMany({
      where: { organizationId },
      include: {
        socialProfiles: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return personas.map((persona: PrismaPersona & { socialProfiles: PrismaSocialProfile[] }) => ({
      ...mapPersona(persona),
      socialProfiles: persona.socialProfiles.map(mapSocialProfile),
    }));
  },

  async createPersona(
    organizationId: string,
    payload: unknown
  ): Promise<PersonaWithProfiles> {
    await ensureOrganization(organizationId);
    const parsed = personaSchema.parse(payload);

    const persona = await prisma.persona.create({
      data: {
        organizationId,
        displayName: parsed.displayName,
        personalityTraits: parsed.personalityTraits,
        bio: parsed.bio ?? null,
        ...(parsed.socialProfiles && parsed.socialProfiles.length > 0
          ? {
            socialProfiles: {
              create: parsed.socialProfiles.map((profile) => ({
                network: profile.network as 'twitter' | 'instagram' | 'facebook',
                handle: profile.handle,
              })),
            },
          }
          : {}),
      },
      include: {
        socialProfiles: true,
      },
    });

    return {
      ...mapPersona(persona),
      socialProfiles: persona.socialProfiles.map(mapSocialProfile),
    };
  },

  async updatePersona(
    organizationId: string,
    personaId: string,
    payload: unknown
  ): Promise<PersonaWithProfiles> {
    await ensureOrganization(organizationId);

    const updateSchema = z.object({
      displayName: z.string().min(3).max(60).optional(),
      personalityTraits: z.array(z.string().min(2).max(40)).min(3).max(8).optional(),
      bio: z.string().max(280).optional(),
    });

    const parsed = updateSchema.parse(payload);

    // Verify persona belongs to this organization
    const existing = await prisma.persona.findFirst({
      where: { id: personaId, organizationId },
    });

    if (!existing) {
      throw new HttpError(404, 'Persona not found');
    }

    const persona = await prisma.persona.update({
      where: { id: personaId },
      data: {
        ...(parsed.displayName && { displayName: parsed.displayName }),
        ...(parsed.personalityTraits && { personalityTraits: parsed.personalityTraits }),
        ...(parsed.bio !== undefined && { bio: parsed.bio || null }),
      },
      include: {
        socialProfiles: true,
      },
    });

    return {
      ...mapPersona(persona),
      socialProfiles: persona.socialProfiles.map(mapSocialProfile),
    };
  },

  async togglePersonaStatus(
    organizationId: string,
    personaId: string
  ): Promise<PersonaWithProfiles> {
    await ensureOrganization(organizationId);

    const persona = await prisma.persona.findFirst({
      where: { id: personaId, organizationId },
      select: { id: true, isActive: true },
    });

    if (!persona) {
      throw new HttpError(404, 'Persona not found');
    }

    const updated = await prisma.persona.update({
      where: { id: personaId },
      data: { isActive: !persona.isActive },
      include: {
        socialProfiles: true,
      },
    });

    return {
      ...mapPersona(updated),
      socialProfiles: updated.socialProfiles.map(mapSocialProfile),
    };
  },

  async deletePersona(
    organizationId: string,
    personaId: string
  ): Promise<void> {
    await ensureOrganization(organizationId);

    const persona = await prisma.persona.findFirst({
      where: { id: personaId, organizationId },
    });

    if (!persona) {
      throw new HttpError(404, 'Persona not found');
    }

    await prisma.persona.delete({
      where: { id: personaId },
    });
  },
};
