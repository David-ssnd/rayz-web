'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ClientMessage,
  ConfigUpdateMessage,
  ConnectionState,
  DeviceState,
  DeviceStatusMessage,
  GameCommandMessage,
  GameMode,
  HeartbeatAckMessage,
  HitReportMessage,
  initialDeviceState,
  RespawnMessage,
  ServerMessage,
  ShotFiredMessage,
} from './types'

export interface UseDeviceWebSocketOptions {
  /** IP address of the ESP32 device */
  ipAddress: string
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean
  /** Reconnect on disconnect (default: true) */
  autoReconnect?: boolean
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number
  /** Heartbeat interval in ms (default: 60000 - 1 minute) */
  heartbeatInterval?: number
  /** Connection timeout in ms (default: 5000) */
  connectionTimeout?: number
  /** Callback when status is received */
  onStatus?: (status: DeviceStatusMessage) => void
  /** Callback when shot is fired */
  onShotFired?: (shot: ShotFiredMessage) => void
  /** Callback when hit is reported */
  onHitReport?: (hit: HitReportMessage) => void
  /** Callback when respawn occurs */
  onRespawn?: (respawn: RespawnMessage) => void
  /** Callback on any message */
  onMessage?: (message: ServerMessage) => void
  /** Callback on connection state change */
  onConnectionChange?: (state: ConnectionState) => void
  /** Callback on error */
  onError?: (error: Event) => void
}

export interface UseDeviceWebSocketReturn {
  /** Current device state */
  state: DeviceState
  /** Current connection state */
  connectionState: ConnectionState
  /** Whether the device is connected */
  isConnected: boolean
  /** Connect to the device */
  connect: () => void
  /** Disconnect from the device */
  disconnect: () => void
  /** Send a raw message */
  send: (message: ClientMessage) => boolean
  /** Request current status */
  getStatus: () => boolean
  /** Send heartbeat */
  sendHeartbeat: () => boolean
  /** Update device configuration */
  updateConfig: (config: Omit<ConfigUpdateMessage, 'type'>) => boolean
  /** Send game command */
  sendGameCommand: (command: 'start' | 'stop' | 'reset', gamemode?: GameMode) => boolean
  /** Forward hit info to device */
  forwardHit: (shooterId: string) => boolean
  /** Confirm kill */
  confirmKill: () => boolean
}

export function useDeviceWebSocket(options: UseDeviceWebSocketOptions): UseDeviceWebSocketReturn {
  const {
    ipAddress,
    autoConnect = true,
    autoReconnect = true,
    reconnectDelay = 3000,
    heartbeatInterval = 60000,
    connectionTimeout = 5000,
    onStatus,
    onShotFired,
    onHitReport,
    onRespawn,
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

  // Update connection state and notify
  const updateConnectionState = useCallback(
    (newState: ConnectionState) => {
      setConnectionState(newState)
      setState((prev) => ({ ...prev, connectionState: newState }))
      onConnectionChange?.(newState)
    },
    [onConnectionChange]
  )

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
  }, [])

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!mountedRef.current) return

      try {
        const message = JSON.parse(event.data) as ServerMessage
        onMessage?.(message)

        switch (message.type) {
          case 'status': {
            const status = message as DeviceStatusMessage
            setState((prev) => ({
              ...prev,
              deviceId: status.device_id,
              deviceName: status.device_name,
              playerId: status.player_id,
              role: status.role,
              team: status.team,
              color: status.color,
              gamemode: status.gamemode,
              gameState: status.game_state,
              kills: status.kills,
              deaths: status.deaths,
              shots: status.shots,
              hits: status.hits,
              health: status.health,
              lastStatusUpdate: new Date(),
            }))
            onStatus?.(status)
            break
          }

          case 'heartbeat_ack': {
            const ack = message as HeartbeatAckMessage
            setState((prev) => ({
              ...prev,
              kills: ack.kills,
              deaths: ack.deaths,
              health: ack.health,
              gameState: ack.game_state,
              lastHeartbeat: new Date(),
            }))
            break
          }

          case 'shot_fired': {
            const shot = message as ShotFiredMessage
            setState((prev) => ({
              ...prev,
              shots: shot.shots,
            }))
            onShotFired?.(shot)
            break
          }

          case 'hit_report': {
            const hit = message as HitReportMessage
            onHitReport?.(hit)
            break
          }

          case 'respawn': {
            const respawn = message as RespawnMessage
            setState((prev) => ({
              ...prev,
              gameState: respawn.state,
            }))
            onRespawn?.(respawn)
            break
          }

          case 'game_state_change': {
            setState((prev) => ({
              ...prev,
              gameState: message.game_state,
              gamemode: message.gamemode,
            }))
            break
          }
        }
      } catch (error) {
        console.error(`[WS ${ipAddress}] Failed to parse message:`, error)
      }
    },
    [ipAddress, onMessage, onStatus, onShotFired, onHitReport, onRespawn]
  )

  // Send message helper
  const send = useCallback(
    (message: ClientMessage): boolean => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message))
        return true
      }
      console.warn(`[WS ${ipAddress}] Cannot send, not connected`)
      return false
    },
    [ipAddress]
  )

  // Connect to device
  const connect = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return
    }

    clearTimeouts()
    updateConnectionState('connecting')

    const wsUrl = `ws://${ipAddress}/ws`
    console.log(`[WS ${ipAddress}] Connecting to ${wsUrl}...`)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn(`[WS ${ipAddress}] Connection timeout`)
          ws.close()
        }
      }, connectionTimeout)

      ws.onopen = () => {
        if (!mountedRef.current) return
        console.log(`[WS ${ipAddress}] Connected!`)
        clearTimeout(connectionTimeoutRef.current!)
        updateConnectionState('connected')
        setState((prev) => ({
          ...prev,
          lastConnected: new Date(),
          lastError: undefined,
        }))

        // Request initial status
        send({ type: 'get_status' })

        // Start heartbeat interval
        heartbeatIntervalRef.current = setInterval(() => {
          send({ type: 'heartbeat' })
        }, heartbeatInterval)
      }

      ws.onmessage = handleMessage

      ws.onerror = (error) => {
        if (!mountedRef.current) return
        console.error(`[WS ${ipAddress}] Error:`, error)
        setState((prev) => ({
          ...prev,
          lastError: 'Connection error',
        }))
        updateConnectionState('error')
        onError?.(error)
      }

      ws.onclose = () => {
        if (!mountedRef.current) return
        console.log(`[WS ${ipAddress}] Disconnected`)
        clearTimeouts()
        updateConnectionState('disconnected')

        // Schedule reconnect if enabled
        if (shouldReconnectRef.current && autoReconnect) {
          console.log(`[WS ${ipAddress}] Reconnecting in ${reconnectDelay}ms...`)
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && shouldReconnectRef.current) {
              connect()
            }
          }, reconnectDelay)
        }
      }
    } catch (error) {
      console.error(`[WS ${ipAddress}] Failed to create WebSocket:`, error)
      updateConnectionState('error')
      setState((prev) => ({
        ...prev,
        lastError: 'Failed to create connection',
      }))
    }
  }, [
    ipAddress,
    connectionTimeout,
    heartbeatInterval,
    autoReconnect,
    reconnectDelay,
    clearTimeouts,
    updateConnectionState,
    handleMessage,
    send,
    onError,
  ])

  // Disconnect from device
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    clearTimeouts()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    updateConnectionState('disconnected')
  }, [clearTimeouts, updateConnectionState])

  // API methods
  const getStatus = useCallback(() => send({ type: 'get_status' }), [send])

  const sendHeartbeat = useCallback(() => send({ type: 'heartbeat' }), [send])

  const updateConfig = useCallback(
    (config: Omit<ConfigUpdateMessage, 'type'>) => send({ type: 'config_update', ...config }),
    [send]
  )

  const sendGameCommand = useCallback(
    (command: 'start' | 'stop' | 'reset', gamemode?: GameMode) => {
      const msg: GameCommandMessage = { type: 'game_command', command }
      if (gamemode) msg.gamemode = gamemode
      return send(msg)
    },
    [send]
  )

  const forwardHit = useCallback(
    (shooterId: string) => send({ type: 'hit_forward', shooter_id: shooterId }),
    [send]
  )

  const confirmKill = useCallback(() => send({ type: 'kill_confirmed' }), [send])

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true
    shouldReconnectRef.current = autoReconnect

    if (autoConnect) {
      connect()
    }

    return () => {
      mountedRef.current = false
      shouldReconnectRef.current = false
      clearTimeouts()
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect when IP changes
  useEffect(() => {
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
  }
}
