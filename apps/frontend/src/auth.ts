import NextAuth from 'next-auth'

import { authConfig } from './auth.config'

const nextAuthResult = NextAuth(authConfig) as any

export const { auth, signIn, signOut } = nextAuthResult
