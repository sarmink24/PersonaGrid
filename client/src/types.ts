export type Platform = 'twitter' | 'instagram' | 'facebook';

export interface Organization {
  id: string;
  name: string;
  mission: string | null;
  createdAt: string;
}

export interface SocialProfile {
  id: string;
  personaId: string;
  network: Platform;
  handle: string;
  accessToken: string | null;
  createdAt: string;
}

export interface Persona {
  id: string;
  organizationId: string;
  displayName: string;
  personalityTraits: string[];
  bio: string | null;
  isActive: boolean;
  createdAt: string;
  socialProfiles: SocialProfile[];
}

export type TaskType = 'like' | 'share' | 'post' | 'comment' | 'follow';

export interface Task {
  id: string;
  personaId: string;
  platform: Platform;
  taskType: TaskType;
  payload: Record<string, unknown>;
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
  scheduledFor: string | null;
  createdAt: string;
}

