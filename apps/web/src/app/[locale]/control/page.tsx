import type { Metadata } from 'next'
import { getDevices } from '@/features/devices/actions'
import { getGameModes, getProjects } from '@/features/projects/actions'
import { getTranslations } from 'next-intl/server'

import { PageLayout } from '@/components/PageLayout'
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
    <PageLayout title={t('title')} description={t('description')}>
      <ProjectManager projects={projects} availableDevices={devices} gameModes={gameModes} />
    </PageLayout>
  )
}
