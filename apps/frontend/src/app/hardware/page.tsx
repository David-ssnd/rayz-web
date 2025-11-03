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
  id: string;
  name: string;
  type: string;
}

const mockDevices: HardwareDevice[] = [
  {
    id: '1',
    name: 'Target Device',
    type: 'ESP32',
  },
  {
    id: '2',
    name: 'Weapon Device',
    type: 'ESP32',
  },
];

export default function HardwarePage() {
  return (
    <PageLayout
      title="Hardware Monitoring"
      description="Monitor and control connected hardware devices"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDevices.map((device) => (
          <Card key={device.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{device.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Type: {device.type}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
