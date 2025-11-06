'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { useParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/routing'
import ReactCountryFlag from 'react-country-flag'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type Locale = 'en' | 'sk'

export function LanguageSwitcher() {
  const [mounted, setMounted] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const [isPending, startTransition] = useTransition()

  const currentLocale = (params.locale as Locale) || 'en'

  // Only render after mounting to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  function onSelectChange(nextLocale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale })
    })
  }

  if (!mounted) {
    // Return a placeholder with the same dimensions during SSR
    return <div className="bg-background border rounded-full p-0.5 h-8 w-[60px]" />
  }

  return (
    <ToggleGroup
      type="single"
      value={currentLocale}
      onValueChange={(value) => {
        if (value) onSelectChange(value as Locale)
      }}
      className="bg-background border rounded-full p-0.5"
      disabled={isPending}
    >
      <ToggleGroupItem
        value="en"
        aria-label="English"
        size="sm"
        className="rounded-full h-6 w-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <ReactCountryFlag countryCode="GB" svg />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="sk"
        aria-label="Slovak"
        size="sm"
        className="rounded-full h-6 w-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <ReactCountryFlag countryCode="SK" svg />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
