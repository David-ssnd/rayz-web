import type { Metadata } from 'next'
import { getDevices } from '@/features/devices/actions'
import { getGameModes, getProjects } from '@/features/projects/actions'
import { getTranslations } from 'next-intl/server'

import { ProjectManager } from '@/components/ProjectManager'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Hardware' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function ControlPanelPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Control' })

  const devices = await getDevices()
  const projects = await getProjects()
  const gameModes = await getGameModes()

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
        <p className="mb-6">{t('description')}</p>
      </div>

      <div>
        <ProjectManager projects={projects} availableDevices={devices} gameModes={gameModes} />
      </div>
    </div>
  )
}
