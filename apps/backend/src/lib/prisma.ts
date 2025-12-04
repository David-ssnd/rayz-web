import { PrismaClient } from '@prisma/client'

const globalPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
}

function createClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not defined')
  }

  return new PrismaClient({
    adapter: {
      driver: 'postgresql',
      url: databaseUrl,
    } as any,
  })
}

export const prisma = globalPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalPrisma.prisma = prisma
}
