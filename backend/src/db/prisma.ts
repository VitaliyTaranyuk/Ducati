import { Prisma, PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export function isPrismaUniqueViolation(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
