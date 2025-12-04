import { NextResponse } from 'next/server'

import { ensureAdapterSecret } from '../../../../../../lib/adapter-secret'
import { prisma } from '../../../../../../lib/prisma'

type Params = {
  params: Promise<{
    email: string
  }>
}

export async function GET(request: Request, context: Params) {
  const unauthorized = ensureAdapterSecret(request)
  if (unauthorized) return unauthorized

  const { email } = await context.params
  const decodedEmail = decodeURIComponent(email)
  const user = await prisma.user.findUnique({ where: { email: decodedEmail } })

  return NextResponse.json(user)
}
