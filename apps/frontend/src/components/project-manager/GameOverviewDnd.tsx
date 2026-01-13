'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  reorderPlayers,
  reorderTeams,
  updatePlayerDevices,
  updatePlayerTeam,
} from '@/features/projects/actions'
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Activity,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Gamepad2,
  GripVertical,
  Monitor,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Shield,
  Square,
  Target,
  Users,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useDeviceConnections } from '@/lib/websocket'
import type { GameMode as WSGameMode } from '@/lib/websocket/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { AddDeviceDialog, AddPlayerDialog, AddTeamDialog } from './AddDialogs'
import type { Device, Player, Project, Team } from './types'

interface GameOverviewProps {
  project: Project
  availableDevices?: Device[]
}

const GAME_MODES: { value: WSGameMode; label: string; icon: React.ReactNode }[] = [
  { value: 'free', label: 'Free Play', icon: <Zap className="w-4 h-4" /> },
  { value: 'deathmatch', label: 'Deathmatch', icon: <Target className="w-4 h-4" /> },
  { value: 'team', label: 'Team Battle', icon: <Users className="w-4 h-4" /> },
  { value: 'capture_flag', label: 'Capture Flag', icon: <Shield className="w-4 h-4" /> },
  { value: 'timed', label: 'Timed Match', icon: <Activity className="w-4 h-4" /> },
]

// Types for drag-and-drop
type DraggableType = 'team' | 'player' | 'device'
type DraggableItem = {
  type: DraggableType
  id: string
  data: Team | Player | Device
  containerId?: string // For players: teamId, for devices: playerId
}

// ==================== DROPPABLE COMPONENTS ====================

function DroppableZone({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && 'ring-2 ring-primary ring-offset-2')}
    >
      {children}
    </div>
  )
}

// ==================== SORTABLE COMPONENTS ====================

function SortableTeam({
  team,
  players,
  isExpanded,
  onToggle,
  getDevicesForPlayer,
  getDeviceConnectionState,
}: {
  team: Team
  players: Player[]
  isExpanded: boolean
  onToggle: () => void
  getDevicesForPlayer: (player: Player) => Device[]
  getDeviceConnectionState: (ipAddress: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `team-${team.id}`,
    data: { type: 'team', team },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const teamDevices = players.flatMap((p) => getDevicesForPlayer(p))
  const onlineDevices = teamDevices.filter(
    (d) => getDeviceConnectionState(d.ipAddress) === 'connected'
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('overflow-hidden rounded border bg-card', isDragging && 'opacity-50')}
    >
      {/* Team Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
        <button {...attributes} {...listeners} className="cursor-grab touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <button onClick={onToggle} className="flex items-center gap-2 flex-1">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
          <span className="font-medium truncate">{team.name}</span>
        </button>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{players.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <Monitor className="w-4 h-4" />
            <span>
              {onlineDevices.length}/{teamDevices.length}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Content - Players droppable area */}
      {isExpanded && (
        <SortableContext
          items={players.map((p) => `player-${p.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2 min-h-[60px] bg-background/50">
            {players.length > 0 ? (
              <div className="space-y-1">
                {players.map((player) => (
                  <SortablePlayer
                    key={player.id}
                    player={player}
                    teamColor={team.color}
                    devices={getDevicesForPlayer(player)}
                    getDeviceConnectionState={getDeviceConnectionState}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4 border-2 border-dashed rounded">
                Drop players here
              </div>
            )}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

function SortablePlayer({
  player,
  teamColor,
  devices,
  getDeviceConnectionState,
}: {
  player: Player
  teamColor?: string
  devices: Device[]
  getDeviceConnectionState: (ipAddress: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `player-${player.id}`,
    data: { type: 'player', player },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col gap-1 p-2 rounded bg-muted/30 border',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab touch-none">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <Gamepad2 className="w-4 h-4" style={{ color: teamColor }} />
        <span className="font-medium">{player.name}</span>
        <Badge variant="outline" className="text-xs">
          ID: {player.number}
        </Badge>
      </div>

      {/* Devices droppable area */}
      <SortableContext
        items={devices.map((d) => `device-${d.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <DroppableZone
          id={`player-devices-${player.id}`}
          className="ml-6 flex flex-wrap gap-1 min-h-6 p-1 rounded"
        >
          {devices.length > 0 ? (
            devices.map((device) => (
              <SortableDevice
                key={device.id}
                device={device}
                getDeviceConnectionState={getDeviceConnectionState}
              />
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">Drop devices here</span>
          )}
        </DroppableZone>
      </SortableContext>
    </div>
  )
}

function SortableDevice({
  device,
  getDeviceConnectionState,
}: {
  device: Device
  getDeviceConnectionState: (ipAddress: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `device-${device.id}`,
    data: { type: 'device', device },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isOnline = getDeviceConnectionState(device.ipAddress) === 'connected'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-md bg-background border text-xs cursor-grab',
        isDragging && 'opacity-50'
      )}
    >
      {isOnline ? (
        <Wifi className="w-3 h-3 text-green-500" />
      ) : (
        <WifiOff className="w-3 h-3 text-muted-foreground" />
      )}
      <Monitor className="w-3 h-3" />
      <span className="truncate max-w-24">{device.name || device.ipAddress}</span>
    </div>
  )
}

// ==================== MAIN COMPONENT ====================

export function GameOverview({ project, availableDevices = [] }: GameOverviewProps) {
  const [selectedGameMode, setSelectedGameMode] = useState<WSGameMode>('free')
  const [isGameRunning, setIsGameRunning] = useState(false)
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(
    () => new Set(project.teams?.map((t) => t.id) || [])
  )
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [isPending, startTransition] = useTransition()

  const { broadcastCommand, connectAll, disconnectAll, connectedDevices, connections } =
    useDeviceConnections()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Computed values
  const totalDevices = project.devices?.length || 0
  const onlineCount = connectedDevices.length
  const totalKills = connectedDevices.reduce((sum, d) => sum + (d.kills || 0), 0)
  const totalDeaths = connectedDevices.reduce((sum, d) => sum + (d.deaths || 0), 0)

  // Helper functions
  const getPlayersInTeam = (teamId: string): Player[] => {
    return project.players?.filter((p: Player) => p.teamId === teamId) || []
  }

  const getPlayersWithoutTeam = (): Player[] => {
    return project.players?.filter((p: Player) => !p.teamId) || []
  }

  const getDevicesForPlayer = (player: Player): Device[] => {
    return project.devices?.filter((d: Device) => d.assignedPlayerId === player.id) || []
  }

  const getUnassignedDevices = (): Device[] => {
    return project.devices?.filter((d: Device) => !d.assignedPlayerId) || []
  }

  const getDeviceConnectionState = (ipAddress: string) => {
    return connections.get(ipAddress)?.state.connectionState || 'disconnected'
  }

  // Toggle functions
  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId)
    } else {
      newExpanded.add(teamId)
    }
    setExpandedTeams(newExpanded)
  }

  const expandAll = () => {
    setExpandedTeams(new Set(project.teams?.map((t) => t.id) || []))
  }

  const collapseAll = () => {
    setExpandedTeams(new Set())
  }

  // Game controls
  const handleStartGame = () => {
    broadcastCommand('start')
    setIsGameRunning(true)
  }

  const handleStopGame = () => {
    broadcastCommand('stop')
    setIsGameRunning(false)
  }

  const handleResetStats = () => {
    broadcastCommand('reset')
  }

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const activeType = String(active.id).split('-')[0] as DraggableType
    const overId = String(over.id)

    startTransition(async () => {
      if (activeType === 'team') {
        // Reorder teams
        const teamIds = project.teams?.map((t) => t.id) || []
        const activeIndex = teamIds.indexOf(String(active.id).replace('team-', ''))
        const overIndex = teamIds.indexOf(overId.replace('team-', ''))
        if (activeIndex !== -1 && overIndex !== -1) {
          const newOrder = arrayMove(teamIds, activeIndex, overIndex)
          await reorderTeams(project.id, newOrder)
        }
      } else if (activeType === 'player') {
        const playerId = String(active.id).replace('player-', '')

        // Determine target team
        let targetTeamId: string | null = null
        if (overId.startsWith('team-')) {
          targetTeamId = overId.replace('team-', '')
        } else if (overId.startsWith('player-')) {
          const overPlayerId = overId.replace('player-', '')
          const overPlayer = project.players?.find((p) => p.id === overPlayerId)
          targetTeamId = overPlayer?.teamId || null
        } else if (overId === 'unassigned-players') {
          targetTeamId = null
        }

        // Update player team if changed
        const player = project.players?.find((p) => p.id === playerId)
        if (player && player.teamId !== targetTeamId) {
          await updatePlayerTeam(playerId, targetTeamId)
        }

        // Reorder players within team
        const playersInTeam = targetTeamId
          ? getPlayersInTeam(targetTeamId)
          : getPlayersWithoutTeam()
        const playerIds = playersInTeam.map((p) => p.id)
        if (!playerIds.includes(playerId)) {
          playerIds.push(playerId)
        }
        await reorderPlayers(project.id, playerIds)
      } else if (activeType === 'device') {
        const deviceId = String(active.id).replace('device-', '')
        const device = project.devices?.find((d) => d.id === deviceId)
        if (!device) return

        // Determine target player
        let targetPlayerId: string | null = null
        if (overId.startsWith('player-devices-')) {
          // Dropped on player's device zone
          targetPlayerId = overId.replace('player-devices-', '')
        } else if (overId.startsWith('player-')) {
          // Dropped on player directly
          targetPlayerId = overId.replace('player-', '')
        } else if (overId.startsWith('device-')) {
          const overDeviceId = overId.replace('device-', '')
          const overDevice = project.devices?.find((d) => d.id === overDeviceId)
          targetPlayerId = overDevice?.assignedPlayerId || null
        } else if (overId === 'unassigned-devices') {
          targetPlayerId = null
        }

        // Update device assignment - handle all cases
        const currentPlayerId = device.assignedPlayerId || null

        if (currentPlayerId !== targetPlayerId) {
          // Remove from current player first (if assigned)
          if (currentPlayerId) {
            const currentPlayer = project.players?.find((p) => p.id === currentPlayerId)
            if (currentPlayer) {
              const newDevices = getDevicesForPlayer(currentPlayer)
                .filter((d) => d.id !== deviceId)
                .map((d) => d.id)
              await updatePlayerDevices(currentPlayerId, newDevices)
            }
          }

          // Add to new player (if not unassigning)
          if (targetPlayerId) {
            const targetPlayer = project.players?.find((p) => p.id === targetPlayerId)
            if (targetPlayer) {
              const currentDevices = getDevicesForPlayer(targetPlayer).map((d) => d.id)
              if (!currentDevices.includes(deviceId)) {
                await updatePlayerDevices(targetPlayerId, [...currentDevices, deviceId])
              }
            }
          }
        }
      }
    })
  }

  // Get active drag item for overlay
  const getActiveDragItem = () => {
    if (!activeId) return null
    const [type, id] = String(activeId).split('-')

    if (type === 'team') {
      const team = project.teams?.find((t) => t.id === id)
      return team ? { type: 'team', data: team } : null
    } else if (type === 'player') {
      const player = project.players?.find((p) => p.id === id)
      return player ? { type: 'player', data: player } : null
    } else if (type === 'device') {
      const device = project.devices?.find((d) => d.id === id)
      return device ? { type: 'device', data: device } : null
    }
    return null
  }

  const activeDragItem = getActiveDragItem()
  const playersWithoutTeam = getPlayersWithoutTeam()
  const unassignedDevices = getUnassignedDevices()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Game Control Section */}
        <Card className="border-0 gap-2">
          <CardHeader className="pb-2 px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Game Control
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={onlineCount > 0 ? 'default' : 'secondary'} className="gap-1">
                  {onlineCount > 0 ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {onlineCount}/{totalDevices} Online
                </Badge>
                {isGameRunning && (
                  <Badge className="gap-1 bg-green-600">
                    <Activity className="w-3 h-3 animate-pulse" />
                    Live
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 px-0">
            {/* Game Mode Selection */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedGameMode}
                onValueChange={(v) => setSelectedGameMode(v as WSGameMode)}
                disabled={isGameRunning}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GAME_MODES.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      <div className="flex items-center gap-2">
                        {mode.icon}
                        <span>{mode.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Game Controls */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {!isGameRunning ? (
                <Button
                  size="lg"
                  className="col-span-2 h-12 gap-2"
                  onClick={handleStartGame}
                  disabled={onlineCount === 0}
                >
                  <Play className="w-5 h-5" />
                  Start Game
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="col-span-2 h-12 gap-2"
                  onClick={handleStopGame}
                >
                  <Square className="w-5 h-5" />
                  Stop Game
                </Button>
              )}
              <Button
                variant="outline"
                className="h-12 gap-2"
                onClick={handleResetStats}
                disabled={isGameRunning}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-2"
                onClick={onlineCount > 0 ? disconnectAll : connectAll}
              >
                {onlineCount > 0 ? (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Disconnect</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="hidden sm:inline">Connect</span>
                  </>
                )}
              </Button>
            </div>

            {/* Live Stats */}
            {isGameRunning && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{totalKills}</p>
                  <p className="text-xs text-muted-foreground">Total Kills</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{totalDeaths}</p>
                  <p className="text-xs text-muted-foreground">Total Deaths</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Teams & Players
          </h3>
          <div className="flex items-center gap-1">
            {/* Expand/Collapse buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={expandAll}
              title="Expand All"
            >
              <ChevronsUpDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={collapseAll}
              title="Collapse All"
            >
              <ChevronsDownUp className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            {/* Add buttons */}
            <AddTeamDialog projectId={project.id} />
            <AddPlayerDialog project={project} />
            <AddDeviceDialog project={project} availableDevices={availableDevices} />
          </div>
        </div>

        {/* Two-column layout: Active (left) | Unassigned (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left side - Active Teams */}
          <div className="lg:col-span-2 space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Active Teams
            </h4>
            {project.teams?.length > 0 ? (
              <SortableContext
                items={project.teams.map((t) => `team-${t.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {project.teams.map((team) => (
                    <SortableTeam
                      key={team.id}
                      team={team}
                      players={getPlayersInTeam(team.id)}
                      isExpanded={expandedTeams.has(team.id)}
                      onToggle={() => toggleTeam(team.id)}
                      getDevicesForPlayer={getDevicesForPlayer}
                      getDeviceConnectionState={getDeviceConnectionState}
                    />
                  ))}
                </div>
              </SortableContext>
            ) : (
              <div className="min-h-[100px] p-4 rounded border-2 border-dashed bg-muted/20 flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">
                  No teams yet. Add a team to get started.
                </p>
              </div>
            )}
          </div>

          {/* Right side - Unassigned */}
          <div className="space-y-4">
            {/* Unassigned Players */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                Unassigned Players
              </h4>
              <SortableContext
                items={playersWithoutTeam.map((p) => `player-${p.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableZone
                  id="unassigned-players"
                  className={cn(
                    'min-h-[80px] p-2 rounded border-2 border-dashed',
                    playersWithoutTeam.length === 0 && 'bg-muted/20'
                  )}
                >
                  {playersWithoutTeam.length > 0 ? (
                    <div className="space-y-1">
                      {playersWithoutTeam.map((player) => (
                        <SortablePlayer
                          key={player.id}
                          player={player}
                          devices={getDevicesForPlayer(player)}
                          getDeviceConnectionState={getDeviceConnectionState}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Drop players here
                    </div>
                  )}
                </DroppableZone>
              </SortableContext>
            </div>

            {/* Unassigned Devices */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Unassigned Devices
              </h4>
              <SortableContext
                items={unassignedDevices.map((d) => `device-${d.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableZone
                  id="unassigned-devices"
                  className={cn(
                    'min-h-[60px] p-2 rounded border-2 border-dashed flex flex-wrap gap-1',
                    unassignedDevices.length === 0 && 'bg-muted/20'
                  )}
                >
                  {unassignedDevices.length > 0 ? (
                    unassignedDevices.map((device) => (
                      <SortableDevice
                        key={device.id}
                        device={device}
                        getDeviceConnectionState={getDeviceConnectionState}
                      />
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-2 w-full">
                      Drop devices here
                    </div>
                  )}
                </DroppableZone>
              </SortableContext>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {(!project.teams || project.teams.length === 0) &&
          (!project.players || project.players.length === 0) &&
          (!project.devices || project.devices.length === 0) && (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No teams, players or devices configured.</p>
                <p className="text-sm">Use the buttons above to add teams, players, and devices.</p>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragItem && (
          <div className="opacity-80">
            {activeDragItem.type === 'team' && (
              <div className="px-3 py-2 rounded border bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: (activeDragItem.data as Team).color }}
                  />
                  <span className="font-medium">{(activeDragItem.data as Team).name}</span>
                </div>
              </div>
            )}
            {activeDragItem.type === 'player' && (
              <div className="px-3 py-2 rounded border bg-card shadow-lg">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  <span className="font-medium">{(activeDragItem.data as Player).name}</span>
                </div>
              </div>
            )}
            {activeDragItem.type === 'device' && (
              <div className="px-2 py-1 rounded border bg-card shadow-lg text-xs">
                <div className="flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  <span>
                    {(activeDragItem.data as Device).name ||
                      (activeDragItem.data as Device).ipAddress}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
