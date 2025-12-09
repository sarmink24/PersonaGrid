import { http } from './http';

export interface Organization {
  id: string;
  name: string;
  email: string | null;
  mission: string | null;
  isActive: boolean;
  createdAt: string;
}

export const fetchOrganizations = async (): Promise<Organization[]> => {
  const { data } = await http.get<{ organizations: Organization[] }>('/admin/organizations');
  return data.organizations;
};

export const toggleOrganizationStatus = async (
  organizationId: string
): Promise<Organization> => {
  const { data } = await http.patch<{ organization: Organization }>(
    `/admin/organizations/${organizationId}/toggle`
  );
  return data.organization;
};

export interface GlobalPersona {
  id: string;
  displayName: string;
  personalityTraits: string[];
  bio: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface GlobalPersonaPayload {
  displayName: string;
  personalityTraits: string[];
  bio?: string;
}

export const fetchGlobalPersonas = async (): Promise<GlobalPersona[]> => {
  const { data } = await http.get<{ personas: GlobalPersona[] }>('/admin/personas');
  return data.personas;
};

export const createGlobalPersona = async (payload: GlobalPersonaPayload): Promise<GlobalPersona> => {
  const { data } = await http.post<{ persona: GlobalPersona }>('/admin/personas', payload);
  return data.persona;
};

export const deleteGlobalPersona = async (id: string): Promise<void> => {
  await http.delete(`/admin/personas/${id}`);
};

export const updateGlobalPersona = async (id: string, payload: Partial<GlobalPersonaPayload>): Promise<GlobalPersona> => {
  const { data } = await http.patch<{ persona: GlobalPersona }>(`/admin/personas/${id}`, payload);
  return data.persona;
};

export const togglePersonaStatus = async (id: string): Promise<GlobalPersona> => {
  const { data } = await http.patch<{ persona: GlobalPersona }>(`/admin/personas/${id}/toggle-status`);
  return data.persona;
};

// Admin Command Types
export interface AdminCommandPayload {
  command: string;
  platform?: 'twitter' | 'instagram' | 'facebook';
  taskType?: 'like' | 'share' | 'post' | 'comment' | 'follow';
  scheduledFor?: string;
}

export interface AdminCommandPreview {
  originalCommand: string;
  analyzedIntent: string;
  platform: 'twitter' | 'instagram' | 'facebook';
  taskType: 'like' | 'share' | 'post' | 'comment' | 'follow';
  scheduledFor?: string;
  previews: Array<{
    personaId: string;
    displayName: string;
    personalityTraits: string[];
    generatedContent: string;
  }>;
}

export interface AdminCommandConfirmation {
  platform: 'twitter' | 'instagram' | 'facebook';
  taskType: 'like' | 'share' | 'post' | 'comment' | 'follow';
  scheduledFor?: string;
  confirmations: Array<{
    personaId: string;
    content: string;
  }>;
}

export const previewAdminCommand = async (payload: AdminCommandPayload): Promise<AdminCommandPreview> => {
  const { data } = await http.post<AdminCommandPreview>('/admin/commands/preview', payload);
  return data;
};

export const confirmAdminCommand = async (payload: AdminCommandConfirmation) => {
  const { data } = await http.post<{ tasks: any[] }>('/admin/commands/confirm', payload);
  return data;
};
