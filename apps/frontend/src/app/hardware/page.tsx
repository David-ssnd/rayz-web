import type { Metadata } from 'next'

import type { HardwareDevice } from '@/types/hardware'
import { ConnectedDevicesCard } from '@/components/hardware/ConnectedDevicesCard'
import { HardwareDeviceCard } from '@/components/hardware/HardwareDeviceCard'
import { PageLayout } from '@/components/PageLayout'

export const metadata: Metadata = {
  title: 'Hardware | RayZ',
  description: 'Real-time hardware monitoring and control dashboard',
}

const mockDevices: HardwareDevice[] = [
  {
    name: 'Target Device',
    microcontroller: 'ESP32-C3 Supermini',
    scheme_img_url: '/schemes/target.svg',
    real_img_url: '/hardware/target.jpeg',
    description: 'A device used as a target for testing purposes.',
    badge: 'Target',
  },
  {
    name: 'Weapon Device',
    microcontroller: 'ESP32-WROOM',
    scheme_img_url: '/schemes/weapon.svg',
    real_img_url: '/hardware/weapon.jpeg',
    description: 'A device used as a weapon for testing purposes.',
    badge: 'Weapon',
  },
]

const connectedDevice: HardwareDevice = {
  name: 'Connected devices',
  microcontroller: 'Multiple Microcontrollers',
  real_img_url: '/hardware/weapon-target.jpeg',
  description: 'Devices connected and communicating in real-time.',
}

export default function HardwarePage() {
  return (
    <PageLayout
      title="Hardware Monitoring"
      description="Monitor and control connected hardware devices"
    >
      <div className="grid grid-cols-2 gap-6">
        {mockDevices.map((device) => (
          <HardwareDeviceCard key={device.name} {...device} />
        ))}
      </div>
      <ConnectedDevicesCard {...connectedDevice} />
    </PageLayout>
  )
}
