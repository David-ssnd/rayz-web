import type {
  ConnectionState,
  DeviceRole,
  DeviceState,
  GameState,
  GameMode as WSGameMode,
} from '@/lib/websocket/types'

// Player ID is 8-bit (0-255), default 10
// This ID is sent via laser for hit detection
export const DEFAULT_PLAYER_ID = 10
export const MIN_PLAYER_ID = 0
export const MAX_PLAYER_ID = 255

export type Project = {
  id: string
  name: string
  description?: string
  gameModeId?: string
  gameMode?: GameMode
  duration?: number
  devices: Device[]
  teams: Team[]
  players: Player[]
}

export type Team = {
  id: string
  name: string
  color: string
  projectId: string
}

export type Player = {
  id: string
  name: string
  playerId: number // 8-bit ID (0-255) for laser identification
  teamId?: string
  devices?: Device[] // Assigned devices (optional depending on query)
  projectId: string
}

export type Device = {
  id: string
  name?: string
  ipAddress: string
  role?: DeviceRole
  projectId?: string
  assignedPlayerId?: string | null
}

export type GameMode = {
  id: string
  name: string
}

// Re-export WebSocket types for convenience
export type { ConnectionState, DeviceRole, DeviceState, GameState, WSGameMode }
