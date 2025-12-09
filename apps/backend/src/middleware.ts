import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  // 1. Skip public routes
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/api/health')
  ) {
    return NextResponse.next()
  }

  // 2. Check for Authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  // 3. Verify Token
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET)
    await jwtVerify(token, secret)
    // Token is valid
    return NextResponse.next()
  } catch (error) {
    console.error('Token verification failed:', error)
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}

export const config = {
  matcher: '/api/:path*',
}
