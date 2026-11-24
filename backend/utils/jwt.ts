import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { JwtPayload, PublicUser } from '../types/index.js';

// Read signing key from environment; generate an ephemeral 256-bit key in memory if unset
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET?.trim();
  return configured && configured.length > 0 ? configured : EPHEMERAL_FALLBACK_SECRET;
}

export function signAuthToken(user: PublicUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

export function verifyAuthToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret(), {
    algorithms: ['HS256'],
  });

  if (typeof decoded === 'string' || !decoded.sub || typeof decoded.email !== 'string') {
    throw new Error('Invalid token payload');
  }

  return decoded as JwtPayload;
}
