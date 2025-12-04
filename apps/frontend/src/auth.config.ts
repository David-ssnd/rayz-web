import { jwtVerify, SignJWT } from 'jose'
import type { NextAuthConfig, Session } from 'next-auth'
import type { AdapterUser } from 'next-auth/adapters'
import type { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

import { backendAdapter } from '@/lib/auth-adapter'

const backendBaseUrl = process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL
const authSecret = process.env.AUTH_SECRET

const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const JWT_MAX_AGE = 60 * 15 // 15 minutes

function assertEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is not set`)
  }

  return value
}

async function encodeJwt(payload: Record<string, unknown>, expiresIn = JWT_MAX_AGE) {
  const secretKey = new TextEncoder().encode(assertEnv(authSecret, 'AUTH_SECRET'))

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(secretKey)
}

async function verifyJwt(token: string) {
  const secretKey = new TextEncoder().encode(assertEnv(authSecret, 'AUTH_SECRET'))
  const { payload } = await jwtVerify(token, secretKey)
  return payload as JWT
}

async function verifyCredentials(email: string, password: string): Promise<AdapterUser | null> {
  const baseUrl = assertEnv(backendBaseUrl, 'BACKEND_API_URL or NEXT_PUBLIC_BACKEND_URL')
  const response = await fetch(`${baseUrl}/api/auth/credentials/verify`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  if (!response.ok) {
    return null
  }

  return (await response.json()) as AdapterUser
}

export const authConfig: NextAuthConfig = {
  // adapter: backendAdapter(),
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: JWT_MAX_AGE,
    async encode({ token }: { token?: JWT | null }) {
      if (!token) return ''
      return await encodeJwt(token, JWT_MAX_AGE)
    },
    async decode({ token }: { token?: string | null }) {
      if (!token) return null
      try {
        return await verifyJwt(token)
      } catch (error) {
        console.error('Failed to decode JWT', error)
        return null
      }
    },
  },
  providers: [
    Google({
      clientId: assertEnv(process.env.AUTH_GOOGLE_ID, 'AUTH_GOOGLE_ID'),
      clientSecret: assertEnv(process.env.AUTH_GOOGLE_SECRET, 'AUTH_GOOGLE_SECRET'),
    }),
    GitHub({
      clientId: assertEnv(process.env.AUTH_GITHUB_ID, 'AUTH_GITHUB_ID'),
      clientSecret: assertEnv(process.env.AUTH_GITHUB_SECRET, 'AUTH_GITHUB_SECRET'),
    }),
    Credentials({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials?: Record<'email' | 'password', string>) {
        if (!credentials?.email || !credentials.password) {
          return null
        }

        return verifyCredentials(credentials.email, credentials.password)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AdapterUser | null }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = user.role ?? 'user'
      }

      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token) {
        const sessionUser = session.user as typeof session.user & {
          id?: string
          role?: string
        }
        sessionUser.id = (token.id as string) ?? token.sub
        sessionUser.role = (token.role as string) ?? 'user'
      }

      if (token) {
        const apiToken = await encodeJwt(
          {
            sub: token.sub ?? token.id,
            id: token.id,
            email: token.email,
            role: token.role ?? 'user',
          },
          JWT_MAX_AGE
        )

        ;(session as Record<string, unknown>).token = apiToken
      }

      return session
    },
  },
}
