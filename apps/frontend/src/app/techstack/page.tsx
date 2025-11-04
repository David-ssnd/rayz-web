import type { Metadata } from 'next'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLayout } from '@/components/PageLayout'

export const metadata: Metadata = {
  title: 'Tech Stack | RayZ',
  description: 'Technology stack and architecture overview',
}

interface TechItem {
  name: string
  description: string
  badges: BadgeVariant[]
}

type BadgeVariant = 'frontend' | 'backend' | 'hardware' | 'development' | 'database'

const techStack: TechItem[] = [
  {
    name: 'Next.js',
    description: 'React framework for web applications',
    badges: ['frontend', 'backend'],
  },
  {
    name: 'TypeScript',
    description: 'Type-safe JavaScript',
    badges: ['backend', 'frontend'],
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    badges: ['frontend'],
  },
  {
    name: 'shadcn/ui',
    description: 'Modern UI component library',
    badges: ['frontend'],
  },
  {
    name: 'ESP32',
    description: 'Microcontroller for IoT devices',
    badges: ['hardware'],
  },
  {
    name: 'PlatformIO',
    description: 'IDE for embedded development',
    badges: ['development'],
  },
  {
    name: 'Prisma',
    description: 'Next-generation ORM',
    badges: ['database'],
  },
  {
    name: 'PostgreSQL',
    description: 'Relational database',
    badges: ['database'],
  },
]

export default function TechStackPage() {
  return (
    <PageLayout
      title="Technology Stack"
      description="Tools and technologies powering the RayZ project"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {techStack.map((item) => (
          <Card key={item.name}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{item.description}</CardDescription>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.badges.map((badge) => (
                  <Badge key={`${item.name}-${badge}`} variant={badge}>
                    {badge.charAt(0).toUpperCase() + badge.slice(1)}
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
