'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  AckMessage,
  ClientMessage,
  ConfigUpdateMessage,
  ConnectionState,
  DeviceState,
  DeviceStatusMessage,
  GameCommandMessage,
  GameCommandType,
  GameOverMessage,
  HeartbeatAckMessage,
  HitReportMessage,
  initialDeviceState,
  OpCode,
  ReloadMessage,
  RemoteSoundMessage,
  RespawnMessage,
  ServerMessage,
  ShotFiredMessage,
} from './types'

export interface UseDeviceWebSocketOptions {
  ipAddress: string
  autoConnect?: boolean
  autoReconnect?: boolean
  reconnectDelay?: number
  heartbeatInterval?: number
  connectionTimeout?: number

  // Callbacks
  onStatus?: (status: DeviceStatusMessage) => void
  onShotFired?: (shot: ShotFiredMessage) => void
  onHitReport?: (hit: HitReportMessage) => void
  onRespawn?: (respawn: RespawnMessage) => void
  onReload?: (reload: ReloadMessage) => void
  onGameOver?: (gameOver: GameOverMessage) => void
  onAck?: (ack: AckMessage) => void
  onMessage?: (message: ServerMessage) => void
  onConnectionChange?: (state: ConnectionState) => void
  onError?: (error: Event) => void
}

export interface UseDeviceWebSocketReturn {
  state: DeviceState
  connectionState: ConnectionState
  isConnected: boolean

  // Connection
  connect: () => void
  disconnect: () => void

  // Generic Send
  send: (message: ClientMessage) => boolean

  // Helper Methods
  getStatus: () => boolean
  sendHeartbeat: () => boolean
  updateConfig: (config: Omit<ConfigUpdateMessage, 'type' | 'op'>) => boolean
  sendGameCommand: (command: GameCommandType) => boolean
  forwardHit: (shooterId: number) => boolean
  confirmKill: () => boolean
  playRemoteSound: (soundId: number) => boolean
}

export function useDeviceWebSocket(options: UseDeviceWebSocketOptions): UseDeviceWebSocketReturn {
  const {
    ipAddress,
    autoConnect = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    heartbeatInterval = 5000, // Faster heartbeat for RSSI updates
    connectionTimeout = 5000,
    onStatus,
    onShotFired,
    onHitReport,
    onRespawn,
    onReload,
    onGameOver,
    onAck,
    onMessage,
    onConnectionChange,
    onError,
  } = options

  const [state, setState] = useState<DeviceState>(() => initialDeviceState(ipAddress))
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef(autoReconnect)
  const mountedRef = useRef(true)

  const updateConnectionState = useCallback(
    (newState: ConnectionState) => {
      setConnectionState(newState)
      setState((prev) => ({ ...prev, connectionState: newState }))
      onConnectionChange?.(newState)
    },
    [onConnectionChange]
  )

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current)

    reconnectTimeoutRef.current = null
    heartbeatIntervalRef.current = null
    connectionTimeoutRef.current = null
  }, [])

  // =========================
  // Incoming message handler
  // =========================
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!mountedRef.current) return

      try {
        const message = JSON.parse(event.data) as ServerMessage
        onMessage?.(message)

        // Handle based on OpCode for strictness, or type string for readability
        switch (message.op) {
          case OpCode.STATUS: {
            const status = message as DeviceStatusMessage
            setState((prev) => ({
              ...prev,
              // Identity & Config
              deviceId: status.config.device_id,
              playerId: status.config.player_id,
              teamId: status.config.team_id,
              colorRgb: status.config.color_rgb,

              enableHearts: status.config.enable_hearts,
              maxHearts: status.config.max_hearts,
              enableAmmo: status.config.enable_ammo,
              maxAmmo: status.config.max_ammo,

              // Live Stats
              kills: status.stats.enemy_kills + status.stats.friendly_kills,
              deaths: status.stats.deaths,
              shots: status.stats.shots,

              // Live State
              hearts: status.state.current_hearts,
              ammo: status.state.current_ammo,
              isRespawning: status.state.is_respawning,
              isReloading: status.state.is_reloading,
              gameRemainingTime: status.state.remaining_time_s,

              lastStatusUpdate: new Date(),
            }))
            onStatus?.(status)
            break
          }

          case OpCode.HEARTBEAT_ACK: {
            const ack = message as HeartbeatAckMessage
            setState((prev) => ({
              ...prev,
              rssi: ack.rssi,
              batteryVoltage: ack.batt_voltage,
              lastHeartbeat: new Date(),
            }))
            break
          }

          case OpCode.SHOT_FIRED: {
            const shot = message as ShotFiredMessage
            setState((prev) => ({
              ...prev,
              shots: (prev.shots || 0) + 1,
            }))
            onShotFired?.(shot)
            break
          }

          case OpCode.HIT_REPORT: {
            const hit = message as HitReportMessage
            // Optionally update local health immediately, though Status update is authoritative
            onHitReport?.(hit)
            break
          }

          case OpCode.RESPAWN: {
            const respawn = message as RespawnMessage
            setState((prev) => ({
              ...prev,
              hearts: respawn.current_hearts ?? prev.maxHearts, // Fallback if not sent
              isRespawning: false,
            }))
            onRespawn?.(respawn)
            break
          }

          case OpCode.RELOAD_EVENT: {
            const reload = message as ReloadMessage
            setState((prev) => ({
              ...prev,
              ammo: reload.current_ammo,
              isReloading: false,
            }))
            onReload?.(reload)
            break
          }

          case OpCode.GAME_OVER: {
            onGameOver?.(message as GameOverMessage)
            break
          }

          case OpCode.ACK: {
            onAck?.(message as AckMessage)
            break
          }
        }
      } catch (err) {
        console.warn(`[WS ${ipAddress}] Invalid message`, err)
      }
    },
    [
      ipAddress,
      onMessage,
      onStatus,
      onShotFired,
      onHitReport,
      onRespawn,
      onReload,
      onGameOver,
      onAck,
    ]
  )

  // =========================
  // Send helper
  // =========================
  const send = useCallback((message: ClientMessage): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message))
        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setState((prev) => ({
          ...prev,
          connectionState: 'error',
          lastError: `Send failed: ${msg}`,
        }))
        return false
      }
    }
    setState((prev) => ({ ...prev, lastError: 'Cannot send: socket not open' }))
    return false
  }, [])

  // =========================
  // Connect / Disconnect
  // =========================
  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    clearTimeouts()
    updateConnectionState('connecting')

    // Choose protocol based on page context to avoid mixed content errors
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const protocol = isHttps ? 'wss' : 'ws'
    const url = `${protocol}://${ipAddress}/ws`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) ws.close()
      }, connectionTimeout)

      ws.onopen = () => {
        if (!mountedRef.current) return
        clearTimeout(connectionTimeoutRef.current!)
        updateConnectionState('connected')

        setState((prev) => ({
          ...prev,
          lastConnected: new Date(),
          lastError: undefined,
        }))

        // Initial Status Fetch
        send({ op: OpCode.GET_STATUS, type: 'get_status' })

        // Start Heartbeat Loop
        heartbeatIntervalRef.current = setInterval(() => {
          send({ op: OpCode.HEARTBEAT, type: 'heartbeat' })
        }, heartbeatInterval)
      }

      ws.onmessage = handleMessage

      ws.onerror = (e) => {
        // Provide helpful hint when on HTTPS and using ws:// (should not happen now), or WSS handshake fails
        let msg = 'WebSocket error'
        if (typeof window !== 'undefined') {
          const pageHttps = window.location.protocol === 'https:'
          if (pageHttps && url.startsWith('ws://'))
            msg += ' (blocked insecure ws:// from HTTPS page)'
          if (pageHttps && url.startsWith('wss://'))
            msg += ' (WSS handshake failed — device likely lacks TLS)'
        }
        setState((prev) => ({ ...prev, connectionState: 'error', lastError: msg }))
        updateConnectionState('error')
        onError?.(e)
      }

      ws.onclose = () => {
        clearTimeouts()
        updateConnectionState('disconnected')

        if (shouldReconnectRef.current && autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay)
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      setState((prev) => ({
        ...prev,
        connectionState: 'error',
        lastError: `Failed to create connection: ${msg}`,
      }))
      updateConnectionState('error')
    }
  }, [
    ipAddress,
    autoReconnect,
    reconnectDelay,
    heartbeatInterval,
    connectionTimeout,
    clearTimeouts,
    handleMessage,
    send,
    updateConnectionState,
    onError,
  ])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    clearTimeouts()
    wsRef.current?.close()
    wsRef.current = null
    updateConnectionState('disconnected')
  }, [clearTimeouts, updateConnectionState])

  // =========================
  // Public API Wrappers
  // =========================

  const getStatus = useCallback(() => send({ op: OpCode.GET_STATUS, type: 'get_status' }), [send])

  const sendHeartbeat = useCallback(() => send({ op: OpCode.HEARTBEAT, type: 'heartbeat' }), [send])

  const updateConfig = useCallback(
    (config: Omit<ConfigUpdateMessage, 'type' | 'op'>) =>
      send({
        op: OpCode.CONFIG_UPDATE,
        type: 'config_update',
        req_id: crypto.randomUUID().slice(0, 8),
        ...config,
      }),
    [send]
  )

  const sendGameCommand = useCallback(
    (command: GameCommandType) =>
      send({
        op: OpCode.GAME_COMMAND,
        type: 'game_command',
        req_id: crypto.randomUUID().slice(0, 8),
        command,
      }),
    [send]
  )

  const forwardHit = useCallback(
    (shooterId: number) =>
      send({
        op: OpCode.HIT_FORWARD,
        type: 'hit_forward',
        shooter_id: shooterId,
      }),
    [send]
  )

  const confirmKill = useCallback(
    () => send({ op: OpCode.KILL_CONFIRMED, type: 'kill_confirmed' }),
    [send]
  )

  const playRemoteSound = useCallback(
    (soundId: number) =>
      send({
        op: OpCode.REMOTE_SOUND,
        type: 'remote_sound',
        sound_id: soundId,
      }),
    [send]
  )

  // =========================
  // Lifecycle
  // =========================
  useEffect(() => {
    mountedRef.current = true
    shouldReconnectRef.current = autoReconnect

    if (autoConnect) connect()

    return () => {
      mountedRef.current = false
      shouldReconnectRef.current = false
      clearTimeouts()
      wsRef.current?.close()
      wsRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Reset state when IP changes
    setState(initialDeviceState(ipAddress))
    if (autoConnect) {
      disconnect()
      shouldReconnectRef.current = autoReconnect
      connect()
    }
  }, [ipAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    state,
    connectionState,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    send,
    getStatus,
    sendHeartbeat,
    updateConfig,
    sendGameCommand,
    forwardHit,
    confirmKill,
    playRemoteSound,
  }
}
