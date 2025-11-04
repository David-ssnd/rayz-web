import { Car } from 'lucide-react';

import type { HardwareDevice } from '@/types/hardware';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConnectedDevicesCard({
  name,
  microcontroller,
  description,
  real_img_url,
}: HardwareDevice) {
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-large">{name}</CardTitle>
        <Badge variant="success" className="px-2 py-1">
          <div className="flex items-center space-x-1">
            <Car className="h-4 w-4" />
            <span>Connected</span>
          </div>
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-col items-center">
          {real_img_url && (
            <img src={real_img_url} alt={`${name} Image`} className="object-cover rounded-md" />
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Microcontroller: {microcontroller}</p>
        </div>

        <CardDescription className="mt-4 text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
