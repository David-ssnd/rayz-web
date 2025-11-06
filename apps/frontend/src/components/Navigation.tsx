'use client'

import { Link } from '@/i18n/routing'
import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Navigation() {
  const t = useTranslations('Navigation')

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <img
          src="/rayz-trim.svg"
          alt="RayZ"
          className="h-16 w-auto mr-4 object-contain inline-block"
          style={{ maxHeight: '4rem', width: 'auto' }}
        />

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/presentation">{t('presentation')}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/hardware">{t('hardware')}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link href="/techstack">{t('techStack')}</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a
                  href="https://github.com/David-ssnd/RayZ"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-1">
                    {t('github')}
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a
                  href="https://docs.google.com/document/d/1u_znfRPnOI1DHgK9Md7V5L7YhYJi6iWcMULM_RJ-6mI/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-1">
                    {t('documentation')}
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  )
}
