import type { AuthResponse, Task, TasksResponse, User } from '../types/todo';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}

export const authApi = {
  register(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
    return requestJson<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: { email: string; password: string }): Promise<AuthResponse> {
    return requestJson<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getCurrentUser(token: string): Promise<{ user: User }> {
    return requestJson<{ user: User }>('/api/auth/me', { method: 'GET' }, token);
  },

  logout(token: string): Promise<{ message: string }> {
    return requestJson<{ message: string }>('/api/auth/logout', { method: 'POST' }, token);
  },
};

export const tasksApi = {
  list(token: string): Promise<TasksResponse> {
    return requestJson<TasksResponse>('/api/tasks', { method: 'GET' }, token);
  },

  create(
    token: string,
    payload: { title: string; description: string },
  ): Promise<{ task: Task }> {
    return requestJson<{ task: Task }>(
      '/api/tasks',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    );
  },

  update(
    token: string,
    taskId: string,
    payload: Partial<{ title: string; description: string; completed: boolean }>,
  ): Promise<{ task: Task }> {
    return requestJson<{ task: Task }>(
      `/api/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
      token,
    );
  },

  remove(token: string, taskId: string): Promise<{ deletedId: string }> {
    return requestJson<{ deletedId: string }>(
      `/api/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'DELETE',
      },
      token,
    );
  },
};
