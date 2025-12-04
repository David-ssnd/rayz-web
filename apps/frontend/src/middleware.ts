import { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export default function middleware(request: NextRequest) {
  const handleI18nRouting = createIntlMiddleware(routing)
  return handleI18nRouting(request)
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
