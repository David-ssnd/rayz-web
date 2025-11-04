import type { Metadata } from 'next';

import './globals.css';

import Link from 'next/link';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'RayZ Dashboard',
  description: 'Hardware and software monitoring dashboard for RayZ project',
};

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
              <div className="flex items-center">
                <img
                  src="/rayz.svg"
                  alt="RayZ"
                  className="h-16 w-auto mr-4 object-contain inline-block"
                  style={{ maxHeight: '4rem', width: 'auto' }}
                />

                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/presentation">Presentation</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/hardware">Hardware</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link href="/techstack">Tech Stack</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <ThemeToggle />
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>

              <div className="mt-8">{children}</div>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
