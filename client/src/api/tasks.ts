import { http } from './http';
import type { Task } from '../types';
import type { PaginationMeta } from '../components/Pagination';

interface TaskPayload {
  platform: Task['platform'];
  taskType: Task['taskType'];
  payload: Record<string, unknown>;
  scheduledFor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export const fetchTasks = async (personaId: string, page = 1, limit = 20): Promise<PaginatedResult<Task>> => {
  const { data } = await http.get<PaginatedResult<Task>>(
    `/personas/${personaId}/tasks?page=${page}&limit=${limit}`
  );
  return data;
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

