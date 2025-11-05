# next-intl Implementation Guide

## ✅ Implementation Complete

The RayZ frontend has been successfully configured for bilingual support (English and Slovak) using next-intl.

## 🌍 Supported Languages

- **English (en)** - Default language
- **Slovak (sk)** - Slovenčina

## 📁 Project Structure

```
web/apps/frontend/
├── messages/                    # Translation files
│   ├── en.json                 # English translations
│   └── sk.json                 # Slovak translations
├── src/
│   ├── i18n/                   # i18n configuration
│   │   ├── request.ts          # Server-side request config
│   │   └── routing.ts          # Routing configuration
│   ├── middleware.ts           # Locale detection middleware
│   ├── types/
│   │   └── i18n.ts            # TypeScript definitions for translations
│   ├── app/
│   │   ├── layout.tsx         # Root layout (minimal)
│   │   └── [locale]/          # Locale-specific routes
│   │       ├── layout.tsx     # Locale layout with providers
│   │       ├── page.tsx       # Home page (redirects to /presentation)
│   │       ├── presentation/
│   │       ├── hardware/
│   │       └── techstack/
│   └── components/
│       ├── Navigation.tsx      # Updated with translations
│       └── LanguageSwitcher.tsx # New language switcher component
```

## 🔧 Configuration

### next.config.js

```javascript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {
  transpilePackages: ['@rayz/ui', '@rayz/types'],
}

export default withNextIntl(nextConfig)
```

### Routing Configuration (src/i18n/routing.ts)

- Locales: `['en', 'sk']`
- Default locale: `'en'`
- Locale prefix strategy: `'as-needed'` (English URLs don't have /en prefix)

### Middleware (src/middleware.ts)

- Automatically detects user's preferred language
- Redirects to appropriate locale
- Persists locale preference

## 🎨 Features Implemented

### 1. **Language Switcher**

- Located in the navigation bar (next to theme toggle)
- Globe icon button
- Dropdown menu with language options
- Current language is highlighted
- Maintains current page when switching languages

### 2. **Translated Content**

All pages and components are fully translated:

- Navigation menu items
- Page titles and descriptions
- Metadata (SEO)
- Hardware device information
- Tech stack items and badges

### 3. **Type-Safe Translations**

- Full TypeScript support for translation keys
- Autocomplete for translation keys in IDE
- Compile-time checking for missing translations

### 4. **SEO Optimization**

- Locale-specific metadata
- Proper language tags in HTML
- Search engine friendly URLs

## 🚀 Usage

### Accessing the Application

- **English**: `http://localhost:3000` or `http://localhost:3000/en`
- **Slovak**: `http://localhost:3000/sk`

The application will automatically detect your browser's language preference and redirect accordingly.

### Using Translations in Components

#### Server Components

```tsx
import { getTranslations } from 'next-intl/server'

export default async function MyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'MyNamespace' })

  return <h1>{t('title')}</h1>
}
```

#### Client Components

```tsx
'use client'

import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('MyNamespace')

  return <h1>{t('title')}</h1>
}
```

#### Navigation Links

```tsx
import { Link } from '@/i18n/routing'

;<Link href="/presentation">{t('Navigation.presentation')}</Link>
```

## 📝 Adding New Translations

### 1. Update Translation Files

**messages/en.json**

```json
{
  "MyFeature": {
    "title": "My Feature Title",
    "description": "My feature description"
  }
}
```

**messages/sk.json**

```json
{
  "MyFeature": {
    "title": "Názov Mojej Funkcie",
    "description": "Popis mojej funkcie"
  }
}
```

### 2. Use in Components

```tsx
const t = useTranslations('MyFeature')
return <h1>{t('title')}</h1>
```

TypeScript will automatically provide autocomplete and type checking for your translation keys!

## 🛠️ Build & Deploy

### Development

```bash
cd web/apps/frontend
pnpm run dev
```

### Production Build

```bash
cd web/apps/frontend
pnpm run build
pnpm run start
```

The build process generates static pages for both locales.

## 📦 Dependencies Added

- `next-intl` (v4.4.0) - Internationalization library
- `@radix-ui/react-dropdown-menu` (v2.1.16) - For language switcher

## 🎯 Key Implementation Details

1. **Locale Routing**: Uses `[locale]` dynamic segment for locale-based routing
2. **Automatic Detection**: Middleware detects user's preferred language from Accept-Language header
3. **URL Strategy**: English doesn't require `/en` prefix (as-needed strategy)
4. **Client/Server Split**: Proper separation between client and server components
5. **Type Safety**: Full TypeScript support with interface augmentation
6. **Component Updates**: All components updated to use next-intl hooks

## ⚠️ Known Warnings

1. **Workspace Root Warning**: Can be ignored or fixed by configuring `turbopack.root` in next.config.js
2. **Middleware Deprecation**: Next.js 16 uses "proxy" terminology, but functionality works correctly

## 🔍 Testing Checklist

- [x] Navigation between /en and /sk routes
- [x] Language switcher functionality
- [x] Metadata in both languages
- [x] Locale detection from browser
- [x] All pages translated correctly
- [x] Theme toggle compatibility
- [x] Build succeeds without errors
- [x] Type safety for translation keys

## 📚 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js App Router i18n Guide](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Radix UI Dropdown Menu](https://www.radix-ui.com/primitives/docs/components/dropdown-menu)

## 🎉 Summary

Your RayZ application now fully supports English and Slovak languages with:

- Seamless language switching
- Type-safe translations
- SEO-optimized locale routing
- Professional language switcher UI
- Maintained theme toggle functionality

Visit http://localhost:3000 to see it in action!
