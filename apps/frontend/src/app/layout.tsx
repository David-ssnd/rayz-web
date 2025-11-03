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
import { ThemeToggle } from '@/components/ThemeToggle';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'RayZ Dashboard',
  description: 'Hardware and software monitoring dashboard for RayZ project',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
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
                      <NavigationMenuLink
                        asChild
                        className={`${navigationMenuTriggerStyle()} hover:bg-primary/10 hover:scale-105`}
                      >
                        <Link href="/presentation">Presentation</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink
                        asChild
                        className={`${navigationMenuTriggerStyle()} hover:bg-primary/10 hover:scale-105`}
                      >
                        <Link href="/hardware">Hardware</Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <NavigationMenuLink
                        asChild
                        className={`${navigationMenuTriggerStyle()} hover:bg-primary/10 hover:scale-105`}
                      >
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
        </Providers>
      </body>
    </html>
  );
}
