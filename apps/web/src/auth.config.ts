import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [], // Providers are configured in auth.ts to avoid edge runtime issues with Prisma
} satisfies NextAuthConfig
