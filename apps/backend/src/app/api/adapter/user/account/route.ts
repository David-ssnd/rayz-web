import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../../../lib/adapter-secret'
import { prisma } from '../../../../../../lib/prisma'

export async function GET(request: Request) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const provider = searchParams.get('provider')
  const providerAccountId = searchParams.get('providerAccountId')

  if (!provider || !providerAccountId) {
    return NextResponse.json({ error: 'Missing provider params' }, { status: 400 })
  }

  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: {
      user: true,
    },
  })

  return NextResponse.json(account?.user ?? null)
}
