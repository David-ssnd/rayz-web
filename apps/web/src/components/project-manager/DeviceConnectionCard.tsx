'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  Link,
  RefreshCw,
  Settings,
  Target,
  Unlink,
  User,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'

import { useDeviceWebSocket } from '@/lib/websocket'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { Player, Team } from './types'

interface DeviceConnectionCardProps {
  ipAddress: string
  deviceName?: string
  /** If assigned to a player, device config comes from player */
  assignedPlayer?: Player | null
  /** Player's team (resolved from player.teamId) */
  playerTeam?: Team | null
  /** Available teams for unassigned device config */
  teams?: Team[]
  /** Callback when device should be removed from project */
  onRemove?: () => void
}

export function DeviceConnectionCard({
  ipAddress,
  deviceName: initialName,
  assignedPlayer,
  playerTeam,
  teams = [],
  onRemove,
}: DeviceConnectionCardProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [configName, setConfigName] = useState('')
  const [configTeam, setConfigTeam] = useState('')

  const isAssigned = !!assignedPlayer

  const { state, connectionState, isConnected, connect, disconnect, getStatus, updateConfig } =
    useDeviceWebSocket({
      ipAddress,
      autoConnect: true,
      autoReconnect: true,
      onStatus: (status) => {
        console.log(`[${ipAddress}] Status received:`, status)
      },
    })

  // When connected and assigned to a player, sync player config to device
  useEffect(() => {
    if (isConnected && isAssigned) {
      updateConfig({
        device_name: assignedPlayer.name,
        player_id: assignedPlayer.playerId,
        team: playerTeam?.name || undefined,
        color: playerTeam?.color || undefined,
      })
    }
  }, [isConnected, isAssigned, assignedPlayer, playerTeam, updateConfig])

  // Sync unassigned device config inputs with device state
  useEffect(() => {
    if (!isAssigned) {
      if (state.deviceName) setConfigName(state.deviceName)
      if (state.team) setConfigTeam(state.team)
    }
  }, [state.deviceName, state.team, isAssigned])

  const handleUpdateConfig = () => {
    updateConfig({
      device_name: configName || undefined,
      team: configTeam || undefined,
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

  const getRoleBadge = () => {
    if (!state.role) return null
    const Icon = state.role === 'weapon' ? Zap : Target
    return (
      <Badge variant={state.role === 'weapon' ? 'default' : 'secondary'} className="gap-1 text-xs">
        <Icon className="w-3 h-3" />
        <span className="hidden sm:inline capitalize">{state.role}</span>
      </Badge>
    )
  }

  // Display name priority: assigned player name > device reported name > initial name > IP
  const displayName = isAssigned
    ? assignedPlayer.name
    : state.deviceName || initialName || ipAddress

  return (
    <Card className={`w-full transition-all ${isAssigned ? 'border-primary/30 bg-primary/5' : ''}`}>
      <CardContent className="p-3 space-y-2">
        {/* Header Row */}
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
          <div className="flex items-center gap-1 shrink-0">
            {getRoleBadge()}
            {getConnectionBadge()}
          </div>
        </div>

        {/* Player/Team Info (when assigned) */}
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

        {/* Stats Row (compact) */}
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
              <div className="font-bold text-sm">{state.shots}</div>
              <div className="text-muted-foreground text-[10px]">Shots</div>
            </div>
            <div>
              <div className="font-bold text-sm">{state.health}</div>
              <div className="text-muted-foreground text-[10px]">HP</div>
            </div>
          </div>
        )}

        {/* Game State (compact) */}
        {isConnected && state.gameState && (
          <div className="flex items-center gap-2 text-xs">
            <Activity className="w-3 h-3" />
            <Badge variant="outline" className="text-[10px] h-5">
              {state.gamemode || 'free'}
            </Badge>
            <Badge
              variant={state.gameState === 'playing' ? 'default' : 'secondary'}
              className="text-[10px] h-5"
            >
              {state.gameState}
            </Badge>
          </div>
        )}

        {/* Settings Panel (only for unassigned devices) */}
        {!isAssigned && showSettings && (
          <div className="space-y-2 p-2 border rounded-md bg-muted/50">
            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Device Name</label>
              <Input
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Device name"
                className="h-8 text-xs"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-medium">Team</label>
              <Select value={configTeam} onValueChange={setConfigTeam}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}
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

        {/* Assigned notice */}
        {isAssigned && isConnected && (
          <p className="text-[10px] text-muted-foreground text-center">
            Config controlled by player settings
          </p>
        )}

        {/* Last Error */}
        {state.lastError && <p className="text-xs text-destructive">{state.lastError}</p>}
      </CardContent>
    </Card>
  )
}
