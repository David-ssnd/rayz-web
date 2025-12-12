'use client'

import { useState, useTransition } from 'react'
import {
  addPlayer,
  removePlayer,
  updatePlayer,
  updatePlayerDevices,
  updatePlayerTeam,
} from '@/features/projects/actions'
import { Edit2, Monitor, Plus, Trash2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  DEFAULT_PLAYER_ID,
  Device,
  MAX_PLAYER_ID,
  MIN_PLAYER_ID,
  Player,
  Project,
  Team,
} from './types'

export function PlayerManager({ project, devices }: { project: Project; devices: Device[] }) {
  const [name, setName] = useState('')
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID)
  const [isPending, startTransition] = useTransition()
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editNumericId, setEditNumericId] = useState(DEFAULT_PLAYER_ID)

  // Get devices assigned to a specific player
  const getPlayerDevices = (player: Player): Device[] => {
    return devices.filter((d: Device) => d.assignedPlayerId === player.id)
  }

  // Get available devices (not assigned to any player)
  const getAvailableDevices = (): Device[] => {
    return devices.filter((d: Device) => !d.assignedPlayerId)
  }

  const handleAdd = () => {
    if (!name) return
    startTransition(async () => {
      await addPlayer(project.id, name, playerId)
      setName('')
      setPlayerId(DEFAULT_PLAYER_ID)
    })
  }

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id)
    setEditName(player.name)
    setEditNumericId(player.playerId || DEFAULT_PLAYER_ID)
  }

  const saveEdit = () => {
    if (!editingPlayerId || !editName) return
    startTransition(async () => {
      await updatePlayer(editingPlayerId, { name: editName, playerId: editNumericId })
      setEditingPlayerId(null)
    })
  }

  const handleTeamChange = (playerId: string, teamId: string) => {
    startTransition(async () => {
      await updatePlayerTeam(playerId, teamId === 'none' ? null : teamId)
    })
  }

  const handleAddDevice = (playerId: string, deviceId: string) => {
    const player = project.players?.find((p: Player) => p.id === playerId)
    if (!player) return

    const currentDeviceIds = getPlayerDevices(player).map((d) => d.id)
    if (currentDeviceIds.includes(deviceId)) return

    startTransition(async () => {
      await updatePlayerDevices(playerId, [...currentDeviceIds, deviceId])
    })
  }

  const handleRemoveDevice = (playerId: string, deviceId: string) => {
    const player = project.players?.find((p: Player) => p.id === playerId)
    if (!player) return

    const newDeviceIds = getPlayerDevices(player)
      .map((d) => d.id)
      .filter((id: string) => id !== deviceId)
    startTransition(async () => {
      await updatePlayerDevices(playerId, newDeviceIds)
    })
  }

  return (
    <div className="space-y-4">
      {/* Add Player Form */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player Name"
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">ID:</label>
          <Input
            type="number"
            min={MIN_PLAYER_ID}
            max={MAX_PLAYER_ID}
            value={playerId}
            onChange={(e) =>
              setPlayerId(
                Math.min(
                  MAX_PLAYER_ID,
                  Math.max(MIN_PLAYER_ID, parseInt(e.target.value) || DEFAULT_PLAYER_ID)
                )
              )
            }
            className="w-20"
          />
        </div>
        <Button onClick={handleAdd} disabled={isPending || !name}>
          Add Player
        </Button>
      </div>

      {/* Players List */}
      <div className="grid gap-3">
        {project.players?.map((player: Player) => {
          const playerDevices = getPlayerDevices(player)
          const availableDevices = getAvailableDevices()
          const playerTeam = project.teams?.find((t: Team) => t.id === player.teamId)

          return (
            <div
              key={player.id}
              className="p-3 border rounded-md space-y-3"
              style={{
                borderLeftColor: playerTeam?.color,
                borderLeftWidth: playerTeam ? '4px' : undefined,
              }}
            >
              {/* Player Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {editingPlayerId === player.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 flex-1"
                      placeholder="Name"
                    />
                    <div className="flex items-center gap-1">
                      <label className="text-xs text-muted-foreground">ID:</label>
                      <Input
                        type="number"
                        min={MIN_PLAYER_ID}
                        max={MAX_PLAYER_ID}
                        value={editNumericId}
                        onChange={(e) =>
                          setEditNumericId(
                            Math.min(
                              MAX_PLAYER_ID,
                              Math.max(MIN_PLAYER_ID, parseInt(e.target.value) || DEFAULT_PLAYER_ID)
                            )
                          )
                        }
                        className="w-16 h-8"
                      />
                    </div>
                    <Button size="sm" onClick={saveEdit} disabled={isPending}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingPlayerId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.name}</span>
                    <Badge variant="outline" className="text-xs">
                      ID: {player.playerId ?? DEFAULT_PLAYER_ID}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => startEditing(player)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* Team Select */}
                  <Select
                    value={player.teamId || 'none'}
                    onValueChange={(val) => handleTeamChange(player.id, val)}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue placeholder="Team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Team</SelectItem>
                      {project.teams?.map((team: Team) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: team.color }}
                            />
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      startTransition(async () => {
                        await removePlayer(player.id)
                      })
                    }
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Player Devices */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Devices:</span>
                {playerDevices.map((device: Device) => (
                  <Badge key={device.id} variant="secondary" className="gap-1 pr-1">
                    <Monitor className="w-3 h-3" />
                    {device.name || device.ipAddress}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                      onClick={() => handleRemoveDevice(player.id, device.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}

                {/* Add Device Dropdown */}
                {availableDevices.length > 0 && (
                  <Select value="" onValueChange={(val) => handleAddDevice(player.id, val)}>
                    <SelectTrigger className="w-auto h-7 gap-1 text-xs">
                      <Plus className="w-3 h-3" />
                      <span>Add Device</span>
                    </SelectTrigger>
                    <SelectContent>
                      {availableDevices.map((device: Device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex items-center gap-2">
                            <Monitor className="w-3 h-3" />
                            {device.name || device.ipAddress}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {playerDevices.length === 0 && availableDevices.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No devices available</span>
                )}
              </div>
            </div>
          )
        })}

        {(!project.players || project.players.length === 0) && (
          <div className="text-sm text-muted-foreground text-center py-4">
            No players added yet.
          </div>
        )}
      </div>
    </div>
  )
}
