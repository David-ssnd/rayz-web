import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../../lib/adapter-secret'
import { prisma } from '../../../../../lib/prisma'

type Params = {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: Params) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const user = await prisma.user.findUnique({ where: { id: params.id } })
  return NextResponse.json(user)
}

export async function PUT(request: Request, { params }: Params) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const payload = await request.json()

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      email: payload.email ?? undefined,
      name: payload.name ?? undefined,
      image: payload.image ?? undefined,
      emailVerified: payload.emailVerified
        ? new Date(payload.emailVerified)
        : payload.emailVerified === null
          ? null
          : undefined,
      password: payload.password ?? undefined,
      role: payload.role ?? undefined,
    },
  })

  return NextResponse.json(user)
}
