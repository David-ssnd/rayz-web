import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLayout } from '@/components/PageLayout'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'TechStack' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

type BadgeVariant = 'frontend' | 'backend' | 'hardware' | 'development' | 'database'

interface TechItem {
  key: string
  badges: BadgeVariant[]
}

const techStack: TechItem[] = [
  {
    key: 'nextjs',
    badges: ['frontend', 'backend'],
  },
  {
    key: 'typescript',
    badges: ['backend', 'frontend'],
  },
  {
    key: 'tailwind',
    badges: ['frontend'],
  },
  {
    key: 'shadcn',
    badges: ['frontend'],
  },
  {
    key: 'esp32',
    badges: ['hardware'],
  },
  {
    key: 'platformio',
    badges: ['development'],
  },
  {
    key: 'prisma',
    badges: ['database'],
  },
  {
    key: 'postgresql',
    badges: ['database'],
  },
]

export default async function TechStackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'TechStack' })

  return (
    <PageLayout title={t('title')} description={t('description')}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techStack.map((item) => (
          <Card key={item.key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t(`items.${item.key}.name`)}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{t(`items.${item.key}.description`)}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.badges.map((badge) => (
                  <Badge key={`${item.key}-${badge}`} variant={badge}>
                    {t(`badges.${badge}`)}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  )
}
