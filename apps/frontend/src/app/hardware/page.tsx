import type { Metadata } from 'next';
import { BowArrow, Car, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout } from '@/components/PageLayout';

export const metadata: Metadata = {
  title: 'Hardware | RayZ',
  description: 'Real-time hardware monitoring and control dashboard',
};

interface HardwareDevice {
  name: string;
  microcontroller: string;
  description: string;
  ai_img_url?: string;
  real_img_url?: string;
  badge?: string;
}

const mockDevices: HardwareDevice[] = [
  {
    name: 'Target Device',
    microcontroller: 'ESP32-C3 Supermini',
    ai_img_url: '',
    real_img_url: '/hardware/target.jpeg',
    description: 'A device used as a target for testing purposes.',
    badge: 'Target',
  },
  {
    name: 'Weapon Device',
    microcontroller: 'ESP32-WROOM',
    ai_img_url: '',
    real_img_url: '/hardware/weapon.jpeg',
    description: 'A device used as a weapon for testing purposes.',
    badge: 'Weapon',
  },
];

const connectedDevice: HardwareDevice = {
  name: 'Connected devices',
  microcontroller: 'Multiple Microcontrollers',
  ai_img_url: '',
  real_img_url: '/hardware/weapon-target.jpeg',
  description: 'Devices connected and communicating in real-time.',
};

export default function HardwarePage() {
  return (
    <PageLayout
      title="Hardware Monitoring"
      description="Monitor and control connected hardware devices"
    >
      <div className="grid grid-cols-2 gap-6">
        {mockDevices.map((device) => (
          <Card key={device.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-large">{device.name}</CardTitle>
              {device.badge && (
                <Badge variant="hardware" className="px-2 py-1">
                  {device.badge === 'Target' && <Target className="h-4 w-4" />}
                  {device.badge === 'Weapon' && <BowArrow className="h-4 w-4" />}
                  <span>{device.badge}</span>
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col items-center">
                {device.real_img_url && (
                  <img
                    src={device.real_img_url}
                    alt={`${device.name} Image`}
                    className="object-cover rounded-md"
                  />
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Microcontroller: {device.microcontroller}
                </p>
              </div>

              <CardDescription className="mt-4 text-sm">{device.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-large">{connectedDevice.name}</CardTitle>
          <Badge variant="success" className="px-2 py-1">
            <div className="flex items-center space-x-1">
              <Car className="h-4 w-4" />
              <span>Connected</span>
            </div>
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col items-center">
            {connectedDevice.real_img_url && (
              <img
                src={connectedDevice.real_img_url}
                alt={`${connectedDevice.name} Image`}
                className="object-cover rounded-md"
              />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Microcontroller: {connectedDevice.microcontroller}
            </p>
          </div>

          <CardDescription className="mt-4 text-sm">{connectedDevice.description}</CardDescription>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
