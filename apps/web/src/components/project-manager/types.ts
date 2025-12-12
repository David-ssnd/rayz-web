// Import Prisma modelov (sú vždy synchronizované so schema.prisma)

// C:\Users\dado7\Desktop\RayZ\web\apps\web\src\components\project-manager\types.ts
// C:\Users\dado7\Desktop\RayZ\web\packages\database\src\generated\client

// WebSocket runtime typy
import type {
  ConnectionState,
  DeviceRole,
  DeviceState,
  GameState,
  GameMode as WSGameMode,
} from '@/lib/websocket/types'

import {
  Device as PrismaDevice,
  GameMode as PrismaGameMode,
  Player as PrismaPlayer,
  Project as PrismaProject,
  Team as PrismaTeam,
} from '../../../../../packages/database/src/generated/client'

// Player ID constants
export const DEFAULT_PLAYER_ID = 10
export const MIN_PLAYER_ID = 0
export const MAX_PLAYER_ID = 255

/**
 * Project with relations
 * Prisma štandardne negeneruje vzťahy v hlavnom type, preto ich pridávame manuálne.
 */
export type Project = PrismaProject & {
  devices: Device[]
  players: Player[]
  teams: Team[]
  gameMode?: GameMode
}

/**
 * Team type (pure Prisma)
 */
export type Team = PrismaTeam

/**
 * Player type + optional relations
 */
export type Player = PrismaPlayer & {
  devices?: Device[] // optional, závisí od query (include)
}

/**
 * Device type + runtime WebSocket fields
 * DB polia sú z PrismaDevice, ale dopĺňame polia, ktoré existujú len počas behu.
 */
export type Device = PrismaDevice & {
  role?: DeviceRole // runtime (nie v DB)
  state?: DeviceState // runtime
  connectionState?: ConnectionState // runtime
}

/**
 * GameMode (priamo z DB)
 * Ak chceš doplniť runtime stav, môžeš pridať polia sem.
 */
export type GameMode = PrismaGameMode

// Re-export WebSocket types for pohodlie
export type { ConnectionState, DeviceRole, DeviceState, GameState, WSGameMode }
