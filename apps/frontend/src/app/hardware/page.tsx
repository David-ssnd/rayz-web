import type { Metadata } from 'next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
}

const mockDevices: HardwareDevice[] = [
  {
    name: 'Target Device',
    microcontroller: 'ESP32-C3 Supermini',
    ai_img_url: '',
    real_img_url: '',
    description: 'A device used as a target for testing purposes.',
  },
  {
    name: 'Weapon Device',
    microcontroller: 'ESP32-WROOM',
    ai_img_url: '',
    real_img_url: '',
    description: 'A device used as a weapon for testing purposes.',
  },
];

export default function HardwarePage() {
  return (
    <PageLayout
      title="Hardware Monitoring"
      description="Monitor and control connected hardware devices"
    >
      <div className="flex flex-col gap-6">
        {mockDevices.map((device) => (
          <Card key={device.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Microcontroller: {device.microcontroller}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
