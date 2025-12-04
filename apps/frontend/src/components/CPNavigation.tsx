'use client'

import { useState } from 'react'
import { Link } from '@/i18n/routing'
import { ExternalLink, Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  VisuallyHidden,
} from '@/components/ui/sheet'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'

export function CPNavigation() {
  const t = useTranslations('CPNavigation')
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: t('control'), href: '/control' },
    { label: t('back'), href: '/presentation' },
  ]

  return (
    <>
      <div className="hidden md:flex items-center justify-between w-full gap-4">
        <img src="/rayz-trim.svg" alt="RayZ" className="h-6 w-auto object-contain shrink-0" />

        {/* Desktop Navigation Menu */}
        <div className="flex items-center flex-1 lg:gap-0 md:gap-0">
          <NavigationMenu>
            <NavigationMenuList className="md:gap-0 lg:gap-1">
              {navItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link href={item.href}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop Theme & Language Switchers */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Navigation (under md) */}
      <div className="flex md:hidden items-center justify-between w-full">
        {/* Mobile Menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <VisuallyHidden>
              <SheetTitle>Navigation Menu</SheetTitle>
            </VisuallyHidden>
            <div className="flex flex-col space-y-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Theme & Language Switchers */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}
