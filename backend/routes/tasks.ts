import crypto from 'node:crypto';
import { Router, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createTaskSchema, updateTaskSchema, validateBody } from '../middleware/validate.js';
import type { AuthenticatedRequest, TaskRecord, TaskSummary } from '../types/index.js';
import { taskRepository } from '../utils/storage.js';

const router = Router();

router.use(requireAuth);

function computeSummary(tasks: TaskRecord[]): TaskSummary {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  return {
    total,
    completed,
    pending: total - completed,
  };
}

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const allUserTasks = await taskRepository.listByUser(userId);
    const summary = computeSummary(allUserTasks);

    const statusFilter = typeof req.query.status === 'string' ? req.query.status.toLowerCase() : 'all';
    const searchQuery = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';

    let filtered = allUserTasks;
    if (statusFilter === 'pending') {
      filtered = filtered.filter((t) => !t.completed);
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter((t) => t.completed);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery) ||
          t.description.toLowerCase().includes(searchQuery),
      );
    }

    res.status(200).json({
      tasks: filtered,
      summary,
    });
  } catch (err) {
    console.error('List tasks error:', err);
    res.status(500).json({ error: 'Unable to load tasks.' });
  }
});

router.post('/', validateBody(createTaskSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description } = req.body as { title: string; description: string };
    const now = new Date().toISOString();

    const newTask: TaskRecord = {
      id: crypto.randomUUID(),
      userId,
      title,
      description,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    const created = await taskRepository.create(newTask);
    res.status(201).json({ task: created });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Unable to create task.' });
  }
});

async function handleUpdateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id?.trim();
    if (!taskId) {
      res.status(400).json({ error: 'Task ID is required.' });
      return;
    }

    const updates = req.body as {
      title?: string;
      description?: string;
      completed?: boolean;
    };

    const updated = await taskRepository.updateForUser(taskId, userId, updates);
    if (!updated) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.status(200).json({ task: updated });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Unable to update task.' });
  }
}

router.patch('/:id', validateBody(updateTaskSchema), handleUpdateTask);
router.put('/:id', validateBody(updateTaskSchema), handleUpdateTask);

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const taskId = req.params.id?.trim();
    if (!taskId) {
      res.status(400).json({ error: 'Task ID is required.' });
      return;
    }

    const deleted = await taskRepository.deleteForUser(taskId, userId);
    if (!deleted) {
      res.status(404).json({ error: 'Task not found.' });
      return;
    }

    res.status(200).json({ deletedId: taskId });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Unable to delete task.' });
  }
});

export default router;
