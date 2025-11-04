'use client';

import { memo, useCallback, useState } from 'react';

import type { HardwareDevice } from '@/types/hardware';
import { downloadImage } from '@/lib/downloadUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { DeviceBadge } from './DeviceBadge';
import { useZoom } from './useZoom';
import { ZoomControls } from './ZoomControls';

export const HardwareDeviceCard = memo(
  ({ name, microcontroller, description, real_img_url, scheme_img_url, badge }: HardwareDevice) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { zoom, setZoomValue, resetZoom } = useZoom();

    // Download handler
    const handleDownload = useCallback(() => {
      if (!scheme_img_url) return;
      const filename = `${name.replace(/\s+/g, '_')}_scheme.png`;
      downloadImage(scheme_img_url, filename);
    }, [scheme_img_url, name]);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-large">{name}</CardTitle>
          <DeviceBadge badge={badge} />
        </CardHeader>
        <CardContent>
          {/* Real image display */}
          {real_img_url && (
            <div className="mb-4 flex flex-col items-center">
              <img src={real_img_url} alt={`${name} Image`} className="object-cover rounded-md" />
            </div>
          )}

          {/* Microcontroller info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Microcontroller: {microcontroller}</p>
          </div>

          {/* Description */}
          <CardDescription className="mt-4 text-sm">{description}</CardDescription>

          {/* Scheme dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4 w-full" disabled={!scheme_img_url}>
                View Scheme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh]">
              <DialogHeader>
                <DialogTitle>{name} - Circuit Scheme</DialogTitle>
                <DialogDescription>Detailed circuit schematic for {name}</DialogDescription>
              </DialogHeader>

              <ZoomControls
                zoom={zoom}
                onZoomChange={setZoomValue}
                onResetZoom={resetZoom}
                onDownload={handleDownload}
              />

              {/* Zoomable image container */}
              <div className="relative overflow-auto max-h-[75vh] border rounded-md bg-muted/20">
                <div
                  style={{
                    width: `${zoom * 100}%`,
                    height: `${zoom * 100}%`,
                    transition: 'width 0.1s ease-out, height 0.1s ease-out',
                  }}
                >
                  {scheme_img_url && (
                    <img
                      src={scheme_img_url}
                      alt={`${name} Scheme`}
                      className="rounded-md w-full h-auto block"
                      draggable={false}
                      style={{ cursor: 'default' }}
                    />
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }
);
