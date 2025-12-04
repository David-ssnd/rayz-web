import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../../../lib/adapter-secret'
import { prisma } from '../../../../../../lib/prisma'

export async function POST(request: Request) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const payload = await request.json()

  if (!payload?.token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const record = await prisma.verificationToken.findUnique({ where: { token: payload.token } })

  if (!record) {
    return NextResponse.json(null)
  }

  await prisma.verificationToken.delete({ where: { token: payload.token } })

  if (payload.identifier && payload.identifier !== record.identifier) {
    return NextResponse.json(null)
  }

  return NextResponse.json(record)
}
