import { http } from './http';
import type { Organization, Persona } from '../types';
import type { PaginationMeta } from '../components/Pagination';

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

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export const fetchPersonas = async (page = 1, limit = 20): Promise<PaginatedResult<Persona>> => {
  const { data } = await http.get<PaginatedResult<Persona>>(
    `/organizations/personas?page=${page}&limit=${limit}`
  );
  return data;
};

type SocialProfileInput = {
  network: 'twitter' | 'instagram' | 'facebook' | 'linkedin';
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

