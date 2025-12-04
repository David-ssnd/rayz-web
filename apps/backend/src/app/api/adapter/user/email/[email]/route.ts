import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../../../lib/adapter-secret'
import { prisma } from '../../../../../../lib/prisma'

type Params = {
  params: {
    email: string
  }
}

export async function GET(request: Request, { params }: Params) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const email = decodeURIComponent(params.email)
  const user = await prisma.user.findUnique({ where: { email } })

  return NextResponse.json(user)
}
