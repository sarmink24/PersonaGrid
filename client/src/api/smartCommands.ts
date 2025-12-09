import { http } from './http';
import type { Task } from '../types';

export interface SmartCommandPayload {
  prompt: string;
  platform: 'twitter' | 'instagram' | 'facebook';
  taskType: 'like' | 'share' | 'post' | 'comment' | 'follow';
  scheduledFor?: string;
}

export interface SmartCommandPreview {
  originalPrompt: string;
  platform: SmartCommandPayload['platform'];
  taskType: SmartCommandPayload['taskType'];
  scheduledFor?: string;
  previews: Array<{
    personaId: string;
    displayName: string;
    personalityTraits: string[];
    generatedContent: string;
  }>;
}

export interface SmartCommandConfirmation {
  platform: SmartCommandPayload['platform'];
  taskType: SmartCommandPayload['taskType'];
  scheduledFor?: string;
  confirmations: Array<{
    personaId: string;
    content: string;
  }>;
}

export const createSmartCommand = async (payload: SmartCommandPayload) => {
  const { data } = await http.post<{ tasks: Task[]; assignedPersonas: string[] }>(
    '/smart-commands',
    payload
  );
  return data;
};

export const previewSmartCommand = async (payload: SmartCommandPayload) => {
  const { data } = await http.post<SmartCommandPreview>(
    '/smart-commands/preview',
    payload
  );
  return data;
};

export const confirmSmartCommand = async (payload: SmartCommandConfirmation) => {
  const { data } = await http.post<{ tasks: Task[] }>(
    '/smart-commands/confirm',
    payload
  );
  return data;
};
