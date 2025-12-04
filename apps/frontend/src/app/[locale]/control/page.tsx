import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import type { ConnectedDevice } from '@/types/hardware'
import { ConnectedDeviceCard } from '@/components/ConnectedDeviceCard'

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

const newDevice: ConnectedDevice = {
  id: 'new',
  name: 'New Device',
  ipAddress: '',
  status: 'online',
}

const Devices: ConnectedDevice[] = [
  {
    id: 'device1',
    name: 'Device 1',
    ipAddress: '192.168.1.2',
    status: 'online',
  },
]

export default async function ControlPanelPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Control' })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
      <p className="mb-6">{t('description')}</p>
      <div className="grid grid-cols-1 gap-4">
        {/* Add devices via ip address on LAN */}
        <ConnectedDeviceCard {...newDevice} key={newDevice.id} isNew />
        {Devices.map((device) => (
          <ConnectedDeviceCard {...device} key={device.id} {...device} />
        ))}
      </div>
    </div>
  )
}
