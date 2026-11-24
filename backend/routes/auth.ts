import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Router, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { loginSchema, registerSchema, validateBody } from '../middleware/validate.js';
import type { AuthenticatedRequest, UserRecord } from '../types/index.js';
import { signAuthToken } from '../utils/jwt.js';
import { toPublicUser, userRepository } from '../utils/storage.js';

const router = Router();
const BCRYPT_SALT_ROUNDS = 12;

router.post('/register', validateBody(registerSchema), async (req, res: Response) => {
  try {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const newUser: UserRecord = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await userRepository.create(newUser);
    const publicUser = toPublicUser(newUser);
    const token = signAuthToken(publicUser);

    res.status(201).json({
      token,
      user: publicUser,
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'USER_EXISTS') {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Unable to create account. Please try again.' });
  }
});

router.post('/login', validateBody(loginSchema), async (req, res: Response) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    const user = await userRepository.findByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const publicUser = toPublicUser(user);
    const token = signAuthToken(publicUser);

    res.status(200).json({
      token,
      user: publicUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Unable to sign in. Please try again.' });
  }
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ user: req.user });
});

router.post('/logout', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ message: 'Signed out successfully.' });
});

export default router;
