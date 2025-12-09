import { http } from './http';
import type { Organization, Persona } from '../types';

export const fetchOrganizations = async (): Promise<Organization[]> => {
  const { data } = await http.get<{ organizations: Organization[] }>(
    '/organizations'
  );
  return data.organizations;
};

export const createOrganization = async (
  payload: Pick<Organization, 'name' | 'mission'>
): Promise<Organization> => {
  const { data } = await http.post<{ organization: Organization }>(
    '/organizations',
    payload
  );
  return data.organization;
};

export const fetchPersonas = async (): Promise<Persona[]> => {
  const { data } = await http.get<{ personas: Persona[] }>(
    '/organizations/personas'
  );
  return data.personas;
};

type SocialProfileInput = {
  network: 'twitter' | 'instagram' | 'facebook';
  handle: string;
};

export interface PersonaPayload {
  displayName: string;
  personalityTraits: string[];
  bio?: string;
  socialProfiles?: SocialProfileInput[];
}

export const createPersona = async (
  payload: PersonaPayload
): Promise<Persona> => {
  const { data } = await http.post<{ persona: Persona }>(
    '/organizations/personas',
    payload
  );
  return data.persona;
};

export const updatePersona = async (
  id: string,
  payload: Partial<PersonaPayload>
): Promise<Persona> => {
  const { data } = await http.patch<{ persona: Persona }>(
    `/organizations/personas/${id}`,
    payload
  );
  return data.persona;
};

export const togglePersonaStatus = async (id: string): Promise<Persona> => {
  const { data } = await http.patch<{ persona: Persona }>(
    `/organizations/personas/${id}/toggle-status`
  );
  return data.persona;
};

export const deletePersona = async (id: string): Promise<void> => {
  await http.delete(`/organizations/personas/${id}`);
};

