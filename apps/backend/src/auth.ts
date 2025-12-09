import { PrismaAdapter } from '@auth/prisma-adapter'
import NextAuth from 'next-auth'

import { prisma } from '@/lib/prisma'

import { authConfig } from './auth.config'

const authResult = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  ...authConfig,
}) as any

export const { handlers, auth, signIn, signOut } = authResult
