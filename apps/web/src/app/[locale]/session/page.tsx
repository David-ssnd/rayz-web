'use client'

import { use } from 'react'
import Image from 'next/image'
import { signIn, signOut, useSession } from 'next-auth/react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type SessionDemoPageProps = {
  params: Promise<{ locale: string }>
}

export default function SessionDemoPage({ params }: SessionDemoPageProps) {
  const { data: session, status } = useSession()
  const { locale } = use(params)
  const callbackUrl = `/${locale}/control`

  const isLoading = status === 'loading'
  const isAuthenticated = Boolean(session)

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Session preview</CardTitle>
          <CardDescription>
            Simple page that proves the Auth.js setup works by reading the active session and
            exposing quick sign-in / sign-out helpers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p>
              {isLoading
                ? 'Checking your session...'
                : isAuthenticated
                  ? `Signed in as ${session?.user?.email ?? 'unknown user'}`
                  : 'You are currently signed out.'}
            </p>
          </div>

          {session?.user?.image ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Image
                src={session.user.image}
                alt={session.user.email ?? 'Signed in user'}
                width={64}
                height={64}
                className="rounded-full border"
              />
              <p className="text-sm text-muted-foreground">
                This avatar comes from the OAuth profile.
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              >
                Sign out
              </Button>
            ) : (
              <>
                <Button onClick={() => signIn('google', { callbackUrl })}>
                  Sign in with Google
                </Button>
                <Button variant="outline" onClick={() => signIn(undefined, { callbackUrl })}>
                  Choose provider
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
