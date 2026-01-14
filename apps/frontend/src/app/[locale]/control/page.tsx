import type { Metadata } from 'next'
import { getDevices } from '@/features/devices/actions'
import { getGameModes, getProjects } from '@/features/projects/actions'
import type { DeviceState } from '@rayz/types'
import { getTranslations } from 'next-intl/server'

import { PageLayout } from '@/components/PageLayout'
import { ProjectManagerClient } from '@/components/ProjectManagerClient'

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

  // Transform database devices to DeviceState format
  const deviceStates: DeviceState[] = devices.map((device) => ({
    ipAddress: device.ipAddress,
    connectionState: 'disconnected' as const,
    deviceId: 0,
    playerId: 0,
    teamId: 0,
    colorRgb: 0,
    enableHearts: true,
    maxHearts: 3,
    enableAmmo: false,
    maxAmmo: 0,
    kills: 0,
    deaths: 0,
    shots: 0,
    friendlyKills: 0,
    hitsReceived: 0,
    hearts: 3,
    ammo: 0,
    isRespawning: false,
    isReloading: false,
  }))

  return (
    <PageLayout title={t('title')} description={t('description')}>
      <ProjectManagerClient
        projects={projects}
        availableDevices={deviceStates}
        gameModes={gameModes}
      />
    </PageLayout>
  )
}
