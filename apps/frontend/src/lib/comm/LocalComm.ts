/**
 * LocalComm - WebSocket-based Communication for Local Mode
 *
 * Connects to a local WebSocket server that bridges to ESP32 devices.
 * Used when the app runs locally (downloaded/Electron/Tauri).
 */

import type { ClientMessage, ServerMessage } from '@rayz/types'
import type { CommConnectionState, GameComm, LocalCommConfig } from './types'

const DEFAULT_CONFIG: Required<LocalCommConfig> = {
  serverUrl: 'ws://localhost:8080',
  autoReconnect: true,
  reconnectDelay: 1000,
  maxRetries: 10,
  connectionTimeout: 5000,
  heartbeatInterval: 30000,
}

export class LocalComm implements GameComm {
  readonly mode = 'local' as const

  private config: Required<LocalCommConfig>
  private ws: WebSocket | null = null
  private _state: CommConnectionState = 'disconnected'
  private connectedDevices: Set<string> = new Set()
  private retryCount = 0
  private reconnectTimeout: NodeJS.Timeout | null = null
  private heartbeatInterval: NodeJS.Timeout | null = null

  // Event handlers
  private messageHandlers: Map<string, Set<(message: ServerMessage, device: string) => void>> =
    new Map()
  private stateHandlers: Set<(state: CommConnectionState) => void> = new Set()
  private errorHandlers: Set<(error: Error) => void> = new Set()

  constructor(config: LocalCommConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  get state(): CommConnectionState {
    return this._state
  }

  async connect(): Promise<void> {
    if (this._state === 'connecting' || this._state === 'connected') {
      return
    }

    return new Promise((resolve, reject) => {
      this.setState('connecting')

      try {
        this.ws = new WebSocket(this.config.serverUrl)

        const connectionTimeout = setTimeout(() => {
          if (this._state === 'connecting') {
            this.ws?.close()
            const error = new Error('Connection timeout')
            this.handleError(error)
            reject(error)
          }
        }, this.config.connectionTimeout)

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout)
          this.retryCount = 0
          this.setState('connected')
          this.startHeartbeat()
          resolve()
        }

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout)
          this.stopHeartbeat()
          this.connectedDevices.clear()

          if (this._state !== 'disconnected') {
            this.setState('disconnected')
            if (this.config.autoReconnect && this.retryCount < this.config.maxRetries) {
              this.scheduleReconnect()
            }
          }
        }

        this.ws.onerror = (event) => {
          clearTimeout(connectionTimeout)
          const error = new Error('WebSocket error')
          this.handleError(error)
          if (this._state === 'connecting') {
            reject(error)
          }
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        this.handleError(error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.config.autoReconnect = false
    this.clearReconnectTimeout()
    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connectedDevices.clear()
    this.setState('disconnected')
  }

  send(deviceId: string, message: ClientMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false
    }

    try {
      // Wrap message with target device ID for the bridge server
      const envelope = {
        target: deviceId,
        payload: message,
      }
      this.ws.send(JSON.stringify(envelope))
      return true
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error)
      return false
    }
  }

  broadcast(message: ClientMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    try {
      // Broadcast envelope without target
      const envelope = {
        broadcast: true,
        payload: message,
      }
      this.ws.send(JSON.stringify(envelope))
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error)
    }
  }

  onMessage(
    deviceId: string,
    callback: (message: ServerMessage, fromDevice: string) => void
  ): () => void {
    if (!this.messageHandlers.has(deviceId)) {
      this.messageHandlers.set(deviceId, new Set())
    }
    this.messageHandlers.get(deviceId)!.add(callback)

    return () => {
      this.messageHandlers.get(deviceId)?.delete(callback)
    }
  }

  onStateChange(callback: (state: CommConnectionState) => void): () => void {
    this.stateHandlers.add(callback)
    return () => {
      this.stateHandlers.delete(callback)
    }
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorHandlers.add(callback)
    return () => {
      this.errorHandlers.delete(callback)
    }
  }

  getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices)
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId)
  }

  // ============= Private Methods =============

  private setState(state: CommConnectionState): void {
    if (this._state !== state) {
      this._state = state
      this.stateHandlers.forEach((handler) => {
        try {
          handler(state)
        } catch (e) {
          console.error('[LocalComm] Error in state handler:', e)
        }
      })
    }
  }

  private handleError(error: Error): void {
    this.setState('error')
    this.errorHandlers.forEach((handler) => {
      try {
        handler(error)
      } catch (e) {
        console.error('[LocalComm] Error in error handler:', e)
      }
    })
  }

  private handleMessage(data: string): void {
    try {
      const envelope = JSON.parse(data) as {
        source: string
        payload: ServerMessage
      }

      const { source: deviceId, payload: message } = envelope

      // Track connected devices
      if (message.type === 'status') {
        this.connectedDevices.add(deviceId)
      }

      // Emit to specific device handlers
      this.messageHandlers.get(deviceId)?.forEach((handler) => {
        try {
          handler(message, deviceId)
        } catch (e) {
          console.error(`[LocalComm] Error in message handler for ${deviceId}:`, e)
        }
      })

      // Emit to wildcard handlers
      this.messageHandlers.get('*')?.forEach((handler) => {
        try {
          handler(message, deviceId)
        } catch (e) {
          console.error('[LocalComm] Error in wildcard message handler:', e)
        }
      })
    } catch (err) {
      console.error('[LocalComm] Failed to parse message:', err)
    }
  }

  private scheduleReconnect(): void {
    this.clearReconnectTimeout()

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.retryCount),
      30000 // Max 30s delay
    )

    this.reconnectTimeout = setTimeout(() => {
      this.retryCount++
      this.connect().catch(() => {
        // Error already handled in connect()
      })
    }, delay)
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }))
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }
}
