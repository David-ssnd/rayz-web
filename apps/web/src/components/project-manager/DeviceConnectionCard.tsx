'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Disc,
  Link,
  RefreshCw,
  Settings,
  Unlink,
  User,
  Wifi,
  WifiOff,
} from 'lucide-react'

import { useDeviceWebSocket } from '@/lib/websocket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Assumes types match your new Prisma Schema where 'number' is the 0-255 Protocol ID
import type { Player, Team } from './types'

interface DeviceConnectionCardProps {
  ipAddress: string
  deviceName?: string
  assignedPlayer?: Player | null
  playerTeam?: Team | null
  teams?: Team[]
  onRemove?: () => void
}

export function DeviceConnectionCard({
  ipAddress,
  deviceName: initialName,
  assignedPlayer,
  playerTeam,
  teams = [],
}: DeviceConnectionCardProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [configTeamId, setConfigTeamId] = useState<number | undefined>(undefined)

  const isAssigned = !!assignedPlayer

  const { state, connectionState, isConnected, connect, disconnect, getStatus, updateConfig } =
    useDeviceWebSocket({
      ipAddress,
      autoConnect: true,
      autoReconnect: true,
    })

  // Sync assigned player → device configuration
  useEffect(() => {
    if (isConnected && isAssigned && assignedPlayer) {
      // Calculate color integer
      let colorInt: number | undefined = undefined
      if (playerTeam?.color) {
        const hex = playerTeam.color.replace('#', '')
        const parsed = parseInt(hex, 16)
        if (!isNaN(parsed)) colorInt = parsed
      }

      updateConfig({
        // IMPORTANT: Use the Protocol ID (number), not the DB ID (UUID)
        // If your Player type still uses 'playerId' for the int, change .number to .playerId
        player_id: assignedPlayer.number,
        team_id: playerTeam?.number,
        color_rgb: colorInt,
      })
    }
  }, [isConnected, isAssigned, assignedPlayer, playerTeam, updateConfig])

  const handleUpdateConfig = () => {
    updateConfig({
      team_id: configTeamId,
    })
    setShowSettings(false)
  }

  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'connected':
        return (
          <Badge variant="default" className="gap-1 text-xs">
            <Wifi className="w-3 h-3" />
            <span className="hidden sm:inline">Online</span>
          </Badge>
        )
      case 'connecting':
        return (
          <Badge variant="secondary" className="gap-1 text-xs">
            <RefreshCw className="w-3 h-3 animate-spin" />
          </Badge>
        )
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1 text-xs">
            <WifiOff className="w-3 h-3" />
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <WifiOff className="w-3 h-3" />
          </Badge>
        )
    }
  }

  // Display name priority
  const displayName = assignedPlayer?.name || initialName || `Device @ ${ipAddress}`

  return (
    <Card className={`w-full transition-all ${isAssigned ? 'border-primary/30 bg-primary/5' : ''}`}>
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm truncate">{displayName}</span>
              {isAssigned && (
                <Badge variant="outline" className="gap-1 text-xs border-primary/50">
                  <Link className="w-3 h-3" />
                  <span className="hidden sm:inline">Linked</span>
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{ipAddress}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">{getConnectionBadge()}</div>
        </div>

        {/* Player / Team info */}
        {isAssigned && playerTeam && (
          <div className="flex items-center gap-2 text-xs">
            <User className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">Team:</span>
            <div
              className="w-3 h-3 rounded-full border"
              style={{ backgroundColor: playerTeam.color }}
            />
            <span>{playerTeam.name}</span>
          </div>
        )}

        {/* Live Stats Grid */}
        {isConnected && (
          <div className="grid grid-cols-4 gap-1 text-center text-xs bg-muted/50 rounded-md p-2">
            <div>
              <div className="font-bold text-sm">{state.kills}</div>
              <div className="text-muted-foreground text-[10px]">Kills</div>
            </div>
            <div>
              <div className="font-bold text-sm">{state.deaths}</div>
              <div className="text-muted-foreground text-[10px]">Deaths</div>
            </div>
            <div>
              <div className="font-bold text-sm">{state.hearts}</div>
              <div className="text-muted-foreground text-[10px]">Hearts</div>
            </div>
            <div>
              <div className="font-bold text-sm">{state.maxAmmo === -1 ? '∞' : state.ammo}</div>
              <div className="text-muted-foreground text-[10px]">Ammo</div>
            </div>
          </div>
        )}

        {/* Status Indicators (Respawning / Reloading) */}
        {isConnected && (state.isRespawning || state.isReloading) && (
          <div className="flex items-center gap-2 text-xs mt-1">
            {state.isRespawning && (
              <Badge variant="destructive" className="gap-1 text-[10px] h-5">
                <Activity className="w-3 h-3 animate-pulse" />
                Respawning
              </Badge>
            )}
            {state.isReloading && (
              <Badge variant="secondary" className="gap-1 text-[10px] h-5">
                <Disc className="w-3 h-3 animate-spin" />
                Reloading
              </Badge>
            )}
          </div>
        )}

        {/* Settings (Only shown when not assigned to a managed player) */}
        {!isAssigned && showSettings && (
          <div className="space-y-2 p-2 border rounded-md bg-muted/50">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Manual Team Override</label>
              <Select
                // Convert number to string for Select value
                value={configTeamId !== undefined ? String(configTeamId) : ''}
                onValueChange={(value) => {
                  if (value === '') {
                    setConfigTeamId(undefined)
                  } else {
                    setConfigTeamId(Number(value))
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Team (Solo)</SelectItem>
                  {teams.map((team) => (
                    // IMPORTANT: Value must be the Protocol ID (number), NOT the DB ID (UUID)
                    // If we use team.id (UUID), Number(value) will result in NaN
                    <SelectItem key={team.id} value={String(team.number)}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}{' '}
                        <span className="text-muted-foreground text-[10px]">
                          (ID: {team.number})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={handleUpdateConfig}>
                Apply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowSettings(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-1 pt-1">
          {!isConnected ? (
            <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={connect}>
              <Wifi className="w-3 h-3 mr-1" />
              Connect
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={getStatus}
              >
                <RefreshCw className="w-3 h-3 sm:mr-1" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              {!isAssigned && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-3 h-3 sm:mr-1" />
                  <span className="hidden sm:inline">Config</span>
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={disconnect}>
                <Unlink className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>

        {isAssigned && isConnected && (
          <p className="text-[10px] text-muted-foreground text-center">
            Config controlled by player settings
          </p>
        )}

        {state.lastError && <p className="text-xs text-destructive truncate">{state.lastError}</p>}
      </CardContent>
    </Card>
  )
}
