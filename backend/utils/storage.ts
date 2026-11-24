import fs from 'node:fs/promises';
import path from 'node:path';
import type { PublicUser, TaskRecord, UserRecord } from '../types/index.js';

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');

function getBaseDataDir(): string {
  const configured = process.env.DATA_DIR?.trim();
  return configured ? path.resolve(process.cwd(), configured) : DEFAULT_DATA_DIR;
}

function resolveSafeDataFile(fileName: string): string {
  const baseDir = getBaseDataDir();
  const safeName = path.basename(fileName);
  const resolvedPath = path.resolve(baseDir, safeName);

  if (!resolvedPath.startsWith(baseDir + path.sep)) {
    throw new Error('Invalid storage file path');
  }

  return resolvedPath;
}

// Per-file promise queue prevents concurrent read-modify-write races on JSON files
const writeQueues = new Map<string, Promise<unknown>>();

function enqueueFileOp<T>(fileName: string, operation: () => Promise<T>): Promise<T> {
  const previous = writeQueues.get(fileName) ?? Promise.resolve();
  const next = previous.then(operation, operation);
  writeQueues.set(
    fileName,
    next.catch(() => undefined),
  );
  return next;
}

async function ensureDataFile<T>(fileName: string, defaultValue: T): Promise<string> {
  const filePath = resolveSafeDataFile(fileName);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2), 'utf8');
  }

  return filePath;
}

async function readJsonFile<T>(fileName: string, defaultValue: T): Promise<T> {
  const filePath = await ensureDataFile(fileName, defaultValue);
  const raw = await fs.readFile(filePath, 'utf8');
  if (!raw.trim()) {
    return defaultValue;
  }
  return JSON.parse(raw) as T;
}

async function writeJsonFile<T>(fileName: string, data: T): Promise<void> {
  const filePath = await ensureDataFile(fileName, data);
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempPath, filePath);
}

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

const USERS_FILE = 'users.json';
const TASKS_FILE = 'tasks.json';

/**
 * Local JSON file repository for development.
 * To deploy to serverless platforms with ephemeral filesystems (e.g. Vercel),
 * swap these repository methods with a persistent database adapter (PostgreSQL, Turso, etc.).
 */
export const userRepository = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    return enqueueFileOp(USERS_FILE, async () => {
      const users = await readJsonFile<UserRecord[]>(USERS_FILE, []);
      const normalized = email.trim().toLowerCase();
      return users.find((u) => u.email.toLowerCase() === normalized) ?? null;
    });
  },

  async findById(id: string): Promise<UserRecord | null> {
    return enqueueFileOp(USERS_FILE, async () => {
      const users = await readJsonFile<UserRecord[]>(USERS_FILE, []);
      return users.find((u) => u.id === id) ?? null;
    });
  },

  async create(user: UserRecord): Promise<UserRecord> {
    return enqueueFileOp(USERS_FILE, async () => {
      const users = await readJsonFile<UserRecord[]>(USERS_FILE, []);
      const exists = users.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
      if (exists) {
        throw new Error('USER_EXISTS');
      }
      users.push(user);
      await writeJsonFile(USERS_FILE, users);
      return user;
    });
  },
};

export const taskRepository = {
  async listByUser(userId: string): Promise<TaskRecord[]> {
    return enqueueFileOp(TASKS_FILE, async () => {
      const tasks = await readJsonFile<TaskRecord[]>(TASKS_FILE, []);
      return tasks
        .filter((t) => t.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
  },

  async create(task: TaskRecord): Promise<TaskRecord> {
    return enqueueFileOp(TASKS_FILE, async () => {
      const tasks = await readJsonFile<TaskRecord[]>(TASKS_FILE, []);
      tasks.push(task);
      await writeJsonFile(TASKS_FILE, tasks);
      return task;
    });
  },

  async updateForUser(
    taskId: string,
    userId: string,
    updates: Partial<Pick<TaskRecord, 'title' | 'description' | 'completed'>>,
  ): Promise<TaskRecord | null> {
    return enqueueFileOp(TASKS_FILE, async () => {
      const tasks = await readJsonFile<TaskRecord[]>(TASKS_FILE, []);
      const index = tasks.findIndex((t) => t.id === taskId && t.userId === userId);
      if (index === -1) {
        return null;
      }

      const existing = tasks[index];
      const updated: TaskRecord = {
        ...existing,
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.completed !== undefined ? { completed: updates.completed } : {}),
        updatedAt: new Date().toISOString(),
      };

      tasks[index] = updated;
      await writeJsonFile(TASKS_FILE, tasks);
      return updated;
    });
  },

  async deleteForUser(taskId: string, userId: string): Promise<boolean> {
    return enqueueFileOp(TASKS_FILE, async () => {
      const tasks = await readJsonFile<TaskRecord[]>(TASKS_FILE, []);
      const index = tasks.findIndex((t) => t.id === taskId && t.userId === userId);
      if (index === -1) {
        return false;
      }

      tasks.splice(index, 1);
      await writeJsonFile(TASKS_FILE, tasks);
      return true;
    });
  },
};
