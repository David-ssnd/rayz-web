// WebSocket Protocol Types for ESP32 Device Communication

// ============= Game Modes =============
export type GameMode = 'free' | 'deathmatch' | 'team' | 'capture_flag' | 'timed'

// ============= Game States =============
export type GameState = 'idle' | 'countdown' | 'playing' | 'respawning' | 'ended'

// ============= Device Roles =============
export type DeviceRole = 'weapon' | 'target'

// ============= Connection States =============
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

// ============= Messages: Browser → ESP32 =============

export interface GetStatusMessage {
  type: 'get_status'
}

export interface HeartbeatMessage {
  type: 'heartbeat'
}

export interface ConfigUpdateMessage {
  type: 'config_update'
  device_name?: string
  player_id?: number // 8-bit ID (0-255), default 10
  team?: string
  color?: string
  teammates?: number[] // array of 8-bit player IDs
  enemies?: number[] // array of 8-bit player IDs
}

export interface GameCommandMessage {
  type: 'game_command'
  command: 'start' | 'stop' | 'reset'
  gamemode?: GameMode
}

export interface HitForwardMessage {
  type: 'hit_forward'
  shooter_id: string
}

export interface KillConfirmedMessage {
  type: 'kill_confirmed'
}

export type ClientMessage =
  | GetStatusMessage
  | HeartbeatMessage
  | ConfigUpdateMessage
  | GameCommandMessage
  | HitForwardMessage
  | KillConfirmedMessage

// ============= Messages: ESP32 → Browser =============

export interface DeviceStatusMessage {
  type: 'status'
  device_id: string
  device_name: string
  player_id: number // 8-bit ID (0-255)
  role: DeviceRole
  team: string
  color: string
  ip: string
  gamemode: GameMode
  game_state: GameState
  kills: number
  deaths: number
  shots: number
  hits: number
  health: number
}

export interface HeartbeatAckMessage {
  type: 'heartbeat_ack'
  kills: number
  deaths: number
  health: number
  game_state: GameState
}

export interface ShotFiredMessage {
  type: 'shot_fired'
  device_id: string
  shots: number
  timestamp: number
}

export interface HitReportMessage {
  type: 'hit_report'
  target_id: string
  shooter_id: string
  timestamp: number
}

export interface RespawnMessage {
  type: 'respawn'
  device_id: string
  state: GameState
  respawn_time_ms: number
}

export interface GameStateChangeMessage {
  type: 'game_state_change'
  game_state: GameState
  gamemode: GameMode
}

export type ServerMessage =
  | DeviceStatusMessage
  | HeartbeatAckMessage
  | ShotFiredMessage
  | HitReportMessage
  | RespawnMessage
  | GameStateChangeMessage

// ============= Device State (for UI) =============

export interface DeviceState {
  // Connection info
  ipAddress: string
  connectionState: ConnectionState
  lastConnected?: Date
  lastError?: string

  // Device info (from status message)
  deviceId?: string
  deviceName?: string
  playerId?: number // 8-bit ID (0-255), default 10
  role?: DeviceRole
  team?: string
  color?: string

  // Game state
  gamemode?: GameMode
  gameState?: GameState
  kills: number
  deaths: number
  shots: number
  hits: number
  health: number

  // Timestamps
  lastStatusUpdate?: Date
  lastHeartbeat?: Date
}

export const initialDeviceState = (ipAddress: string): DeviceState => ({
  ipAddress,
  connectionState: 'disconnected',
  kills: 0,
  deaths: 0,
  shots: 0,
  hits: 0,
  health: 100,
})
