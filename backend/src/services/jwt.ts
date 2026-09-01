import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import type { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): { sub: string } {
  const payload = jwt.verify(token, config.jwt.refreshSecret) as { sub: string; type?: string };
  if (payload.type !== 'refresh') throw new Error('Invalid token type');
  return payload;
}

export function getRefreshExpiry(): Date {
  const days = 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function getAccessMaxAgeMs(): number {
  return 15 * 60 * 1000;
}

export function getRefreshMaxAgeMs(): number {
  return 7 * 24 * 60 * 60 * 1000;
}
