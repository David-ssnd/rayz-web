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
import { Providers } from './providers';
import { ThemeToggle } from '@/components/ThemeToggle';

export const metadata: Metadata = {
  title: 'RayZ Dashboard',
  description: 'Hardware and software monitoring dashboard for RayZ project',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main className="flex min-h-screen flex-col items-center p-8">
            <div className="w-full max-w-6xl">
              <div className="flex">
                <img src="/rayz.svg" alt="RayZ" className="h-16 w-auto mr-4" />

                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <Link href="/presentation" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Presentation
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/hardware" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Hardware
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                      <Link href="/techstack" legacyBehavior passHref>
                        <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                          Tech Stack
                        </NavigationMenuLink>
                      </Link>
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
