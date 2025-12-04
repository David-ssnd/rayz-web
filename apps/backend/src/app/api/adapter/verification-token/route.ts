import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../lib/adapter-secret'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: Request) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const payload = await request.json()

  if (!payload?.identifier || !payload?.token || !payload?.expires) {
    return NextResponse.json({ error: 'Missing verification token fields' }, { status: 400 })
  }

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier: payload.identifier,
      token: payload.token,
      expires: new Date(payload.expires),
    },
  })

  return NextResponse.json(verificationToken)
}
