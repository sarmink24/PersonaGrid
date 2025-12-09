import { http } from './http';
import type { Task } from '../types';

interface TaskPayload {
  platform: Task['platform'];
  taskType: Task['taskType'];
  payload: Record<string, unknown>;
  scheduledFor?: string;
}

export const fetchTasks = async (personaId: string): Promise<Task[]> => {
  const { data } = await http.get<{ tasks: Task[] }>(
    `/personas/${personaId}/tasks`
  );
  return data.tasks;
};

export const createTask = async (
  personaId: string,
  payload: TaskPayload
): Promise<Task> => {
  const { data } = await http.post<{ task: Task }>(
    `/personas/${personaId}/tasks`,
    payload
  );
  return data.task;
};

export const updateTaskStatus = async (
  taskId: string,
  status: Task['status']
): Promise<Task> => {
  const { data } = await http.patch<{ task: Task }>(
    `/tasks/${taskId}/status`,
    { status }
  );
  return data.task;
};

