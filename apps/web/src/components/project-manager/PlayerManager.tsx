'use client'

import { useState, useTransition } from 'react'
import {
  addPlayer,
  removePlayer,
  updatePlayer,
  updatePlayerDevice,
  updatePlayerTeam,
} from '@/features/projects/actions'
import { Edit2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Device, Player, Project, Team } from './types'

export function PlayerManager({ project, devices }: { project: Project; devices: Device[] }) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = () => {
    if (!name) return
    startTransition(async () => {
      await addPlayer(project.id, name)
      setName('')
    })
  }

  const startEditing = (player: Player) => {
    setEditingPlayerId(player.id)
    setEditName(player.name)
  }

  const saveEdit = () => {
    if (!editingPlayerId || !editName) return
    startTransition(async () => {
      await updatePlayer(editingPlayerId, { name: editName })
      setEditingPlayerId(null)
    })
  }

  const handleTeamChange = (playerId: string, teamId: string) => {
    startTransition(async () => {
      await updatePlayerTeam(playerId, teamId === 'none' ? null : teamId)
    })
  }

  const handleDeviceChange = (playerId: string, deviceId: string) => {
    startTransition(async () => {
      await updatePlayerDevice(playerId, deviceId === 'none' ? null : deviceId)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Player Name" />
        <Button onClick={handleAdd} disabled={isPending || !name}>
          Add Player
        </Button>
      </div>

      <div className="grid gap-2">
        {project.players.map((player: Player) => (
          <div
            key={player.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md gap-4"
          >
            {editingPlayerId === player.id ? (
              <div className="flex items-center gap-2 min-w-32">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8"
                />
                <Button size="sm" onClick={saveEdit} disabled={isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingPlayerId(null)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-32">
                <span className="font-medium">{player.name}</span>
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

            <div className="flex flex-1 gap-2 flex-col sm:flex-row">
              <Select
                value={player.teamId || 'none'}
                onValueChange={(val) => handleTeamChange(player.id, val)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Team</SelectItem>
                  {project.teams.map((team: Team) => (
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

              <Select
                value={player.deviceId || 'none'}
                onValueChange={(val) => handleDeviceChange(player.id, val)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Assign Device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Device</SelectItem>
                  {devices.map((device: Device) => (
                    <SelectItem
                      key={device.id}
                      value={device.id}
                      disabled={
                        !!project.players.find(
                          (p: Player) => p.deviceId === device.id && p.id !== player.id
                        )
                      }
                    >
                      {device.name || device.ipAddress}
                      {device.projectId && device.projectId !== project.id
                        ? ' (In another project)'
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await removePlayer(player.id)
                })
              }
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ))}
        {project.players.length === 0 && (
          <div className="text-sm text-muted-foreground">No players added yet.</div>
        )}
      </div>
    </div>
  )
}
