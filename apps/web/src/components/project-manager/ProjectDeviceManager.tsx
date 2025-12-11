'use client'

import { useState, useTransition } from 'react'
import { addDevice } from '@/features/devices/actions'
import { addDeviceToProject, removeDeviceFromProject } from '@/features/projects/actions'
import { Plus, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { IpAddressInput } from '../IpAddressInput'
import { Device, Project } from './types'

export function ProjectDeviceManager({
  project,
  availableDevices,
}: {
  project: Project
  availableDevices: Device[]
}) {
  const [isPending, startTransition] = useTransition()
  const [ipAddress, setIpAddress] = useState('')

  // Filter devices that are NOT in this project
  const devicesToAdd = availableDevices.filter((d: Device) => d.projectId !== project.id)

  const handleAddNewDevice = () => {
    if (!ipAddress) return
    startTransition(async () => {
      // 1. Add to inventory
      const res = await addDevice(ipAddress)
      if (res.success && res.device) {
        // 2. Add to project
        await addDeviceToProject(project.id, res.device.id)
        setIpAddress('')
      } else {
        // Handle error
        console.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-2">
        <div className="grid gap-1.5 flex-1">
          <label className="text-sm font-medium">Add New Device (IP)</label>
          <IpAddressInput value={ipAddress} onChange={setIpAddress} />
        </div>
        <Button onClick={handleAddNewDevice} disabled={isPending || !ipAddress} size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Project Devices</h3>
          <Select
            onValueChange={(val) =>
              startTransition(async () => {
                await addDeviceToProject(project.id, val)
              })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Add from Inventory" />
            </SelectTrigger>
            <SelectContent>
              {devicesToAdd.length === 0 ? (
                <SelectItem value="none" disabled>
                  No available devices
                </SelectItem>
              ) : (
                devicesToAdd.map((device: Device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name || device.ipAddress}{' '}
                    {device.projectId ? '(In another project)' : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          {project.devices.map((device: Device) => (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 border rounded-md"
            >
              <div className="flex flex-col">
                <span className="font-medium">{device.name || device.ipAddress}</span>
                <span className="text-xs text-muted-foreground">{device.ipAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                  {device.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await removeDeviceFromProject(device.id)
                    })
                  }
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {project.devices.length === 0 && (
            <div className="text-sm text-muted-foreground">No devices in this project.</div>
          )}
        </div>
      </div>
    </div>
  )
}
