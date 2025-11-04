import type { Metadata } from 'next'

import './globals.css'

import { Navigation } from '@/components/Navigation'
import { ThemeProvider } from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'RayZ Dashboard',
  description: 'Hardware and software monitoring dashboard for RayZ project',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex min-h-screen flex-col items-center p-8">
            <div className="w-full max-w-6xl">
              <Navigation />
              <div className="mt-8">{children}</div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
