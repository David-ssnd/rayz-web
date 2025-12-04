import { Trash, Trash2 } from 'lucide-react'

import type { ConnectedDevice } from '@/types/hardware'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Button } from './ui/button'
import { Input } from './ui/input'

type ConnectedDeviceCardProps = ConnectedDevice & {
  key: string
  isNew?: boolean
}

export function ConnectedDeviceCard({ key, isNew, ...props }: ConnectedDeviceCardProps) {
  return (
    <>
      {isNew ? (
        <Card>
          <CardHeader>
            <CardTitle>Add device by IP address on LAN:</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="flex flex-row gap-2">
              <Input />
              <Button variant={'default'}>Add Device</Button>
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-row justify-between items-center">
              <CardTitle>{props.name}</CardTitle>
              <Button variant={'destructive'} size={'sm'}>
                <Trash2 />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>Device details here</CardDescription>
          </CardContent>
        </Card>
      )}
    </>
  )
}
