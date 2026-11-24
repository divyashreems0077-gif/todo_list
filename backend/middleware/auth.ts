import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { verifyAuthToken } from '../utils/jwt.js';
import { toPublicUser, userRepository } from '../utils/storage.js';

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication token is missing.' });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      res.status(401).json({ error: 'Account no longer exists. Please sign in again.' });
      return;
    }

    req.user = toPublicUser(user);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}
