export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  total: number;
  pending: number;
  completed: number;
}

export type TaskFilter = 'all' | 'pending' | 'completed';
export type TaskSort = 'newest' | 'oldest' | 'title';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TasksResponse {
  tasks: Task[];
  summary: TaskSummary;
}
