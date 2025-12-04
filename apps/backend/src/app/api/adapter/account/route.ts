import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../../lib/adapter-secret'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const payload = await request.json()

  if (!payload?.userId || !payload?.provider || !payload?.providerAccountId || !payload?.type) {
    return NextResponse.json({ error: 'Missing account fields' }, { status: 400 })
  }

  const account = await prisma.account.create({
    data: {
      userId: payload.userId,
      type: payload.type,
      provider: payload.provider,
      providerAccountId: payload.providerAccountId,
      refresh_token: payload.refresh_token ?? null,
      access_token: payload.access_token ?? null,
      expires_at: payload.expires_at ?? null,
      token_type: payload.token_type ?? null,
      scope: payload.scope ?? null,
      id_token: payload.id_token ?? null,
      session_state: payload.session_state ?? null,
    },
  })

  return NextResponse.json(account)
}
