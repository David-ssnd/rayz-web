import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../lib/adapter-secret'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: Request) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const payload = await request.json()

  if (!payload?.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      name: payload.name ?? null,
      image: payload.image ?? null,
      emailVerified: payload.emailVerified ? new Date(payload.emailVerified) : null,
      password: payload.password ?? null,
      role: payload.role ?? 'user',
    },
  })

  return NextResponse.json(user)
}
