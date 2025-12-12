'use client'

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  ClientMessage,
  ConfigUpdateMessage,
  ConnectionState,
  DeviceState,
  DeviceStatusMessage,
  GameMode,
  HitReportMessage,
  initialDeviceState,
  ServerMessage,
  ShotFiredMessage,
} from './types'

// ============= Types =============

export interface DeviceConnection {
  state: DeviceState
  ws: WebSocket | null
  connect: () => void
  disconnect: () => void
  send: (message: ClientMessage) => boolean
  getStatus: () => boolean
  updateConfig: (config: Omit<ConfigUpdateMessage, 'type'>) => boolean
  sendGameCommand: (command: 'start' | 'stop' | 'reset', gamemode?: GameMode) => boolean
}

export interface DeviceConnectionsContextValue {
  /** Map of IP address to device connection */
  connections: Map<string, DeviceConnection>
  /** Add a device to manage */
  addDevice: (ipAddress: string) => void
  /** Remove a device from management */
  removeDevice: (ipAddress: string) => void
  /** Get connection for a specific device */
  getConnection: (ipAddress: string) => DeviceConnection | undefined
  /** Get device state for a specific device */
  getDeviceState: (ipAddress: string) => DeviceState | undefined
  /** Check if device is connected */
  isDeviceConnected: (ipAddress: string) => boolean
  /** Connect all devices */
  connectAll: () => void
  /** Disconnect all devices */
  disconnectAll: () => void
  /** Send command to all connected devices */
  broadcastCommand: (command: 'start' | 'stop' | 'reset', gamemode?: GameMode) => void
  /** Get all connected device states */
  connectedDevices: DeviceState[]
  /** Event handlers - can be set by consumers */
  onHitReport?: (hit: HitReportMessage, fromDevice: string) => void
  onShotFired?: (shot: ShotFiredMessage, fromDevice: string) => void
  onStatusUpdate?: (status: DeviceStatusMessage, fromDevice: string) => void
}

// ============= Context =============

const DeviceConnectionsContext = createContext<DeviceConnectionsContextValue | null>(null)

// ============= Hook =============

export function useDeviceConnections(): DeviceConnectionsContextValue {
  const context = useContext(DeviceConnectionsContext)
  if (!context) {
    throw new Error('useDeviceConnections must be used within DeviceConnectionsProvider')
  }
  return context
}

// ============= Single Device Hook (simpler API) =============

export function useDevice(ipAddress: string) {
  const { getConnection, getDeviceState, addDevice } = useDeviceConnections()

  useEffect(() => {
    addDevice(ipAddress)
  }, [ipAddress, addDevice])

  return {
    connection: getConnection(ipAddress),
    state: getDeviceState(ipAddress),
    isConnected: getDeviceState(ipAddress)?.connectionState === 'connected',
  }
}

// ============= Provider =============

interface DeviceConnectionsProviderProps {
  children: ReactNode
  /** Initial device IPs to connect to */
  initialDevices?: string[]
  /** Auto-connect on add (default: true) */
  autoConnect?: boolean
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean
  /** Reconnect delay in ms (default: 3000) */
  reconnectDelay?: number
  /** Heartbeat interval in ms (default: 60000) */
  heartbeatInterval?: number
  /** Callback when a hit is reported */
  onHitReport?: (hit: HitReportMessage, fromDevice: string) => void
  /** Callback when a shot is fired */
  onShotFired?: (shot: ShotFiredMessage, fromDevice: string) => void
  /** Callback when status is updated */
  onStatusUpdate?: (status: DeviceStatusMessage, fromDevice: string) => void
}

export function DeviceConnectionsProvider({
  children,
  initialDevices = [],
  autoConnect = true,
  autoReconnect = true,
  reconnectDelay = 3000,
  heartbeatInterval = 60000,
  onHitReport,
  onShotFired,
  onStatusUpdate,
}: DeviceConnectionsProviderProps) {
  // Store device states
  const [deviceStates, setDeviceStates] = useState<Map<string, DeviceState>>(
    () => new Map(initialDevices.map((ip) => [ip, initialDeviceState(ip)]))
  )

  // Store WebSocket references
  const websocketsRef = useRef<Map<string, WebSocket>>(new Map())
  const reconnectTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const heartbeatIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const shouldReconnectRef = useRef<Map<string, boolean>>(new Map())

  // Event handlers refs (to avoid recreating callbacks)
  const onHitReportRef = useRef(onHitReport)
  const onShotFiredRef = useRef(onShotFired)
  const onStatusUpdateRef = useRef(onStatusUpdate)

  useEffect(() => {
    onHitReportRef.current = onHitReport
    onShotFiredRef.current = onShotFired
    onStatusUpdateRef.current = onStatusUpdate
  }, [onHitReport, onShotFired, onStatusUpdate])

  // Update device state helper
  const updateDeviceState = useCallback((ip: string, update: Partial<DeviceState>) => {
    setDeviceStates((prev) => {
      const newMap = new Map(prev)
      const current = newMap.get(ip) || initialDeviceState(ip)
      newMap.set(ip, { ...current, ...update })
      return newMap
    })
  }, [])

  // Clear timeouts for a device
  const clearDeviceTimeouts = useCallback((ip: string) => {
    const reconnectTimeout = reconnectTimeoutsRef.current.get(ip)
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeoutsRef.current.delete(ip)
    }
    const heartbeatInterval = heartbeatIntervalsRef.current.get(ip)
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatIntervalsRef.current.delete(ip)
    }
  }, [])

  // Send message to a device
  const sendToDevice = useCallback((ip: string, message: ClientMessage): boolean => {
    const ws = websocketsRef.current.get(ip)
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  // Handle incoming messages
  const handleMessage = useCallback(
    (ip: string, event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as ServerMessage

        switch (message.type) {
          case 'status': {
            const status = message as DeviceStatusMessage
            updateDeviceState(ip, {
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
            })
            onStatusUpdateRef.current?.(status, ip)
            break
          }

          case 'heartbeat_ack': {
            updateDeviceState(ip, {
              kills: message.kills,
              deaths: message.deaths,
              health: message.health,
              gameState: message.game_state,
              lastHeartbeat: new Date(),
            })
            break
          }

          case 'shot_fired': {
            updateDeviceState(ip, { shots: message.shots })
            onShotFiredRef.current?.(message, ip)
            break
          }

          case 'hit_report': {
            onHitReportRef.current?.(message, ip)
            break
          }

          case 'respawn': {
            updateDeviceState(ip, { gameState: message.state })
            break
          }

          case 'game_state_change': {
            updateDeviceState(ip, {
              gameState: message.game_state,
              gamemode: message.gamemode,
            })
            break
          }
        }
      } catch (error) {
        console.error(`[WS ${ip}] Failed to parse message:`, error)
      }
    },
    [updateDeviceState]
  )

  // Connect to a device
  const connectDevice = useCallback(
    (ip: string) => {
      const existingWs = websocketsRef.current.get(ip)
      if (
        existingWs?.readyState === WebSocket.OPEN ||
        existingWs?.readyState === WebSocket.CONNECTING
      ) {
        return
      }

      clearDeviceTimeouts(ip)
      updateDeviceState(ip, { connectionState: 'connecting' })
      shouldReconnectRef.current.set(ip, autoReconnect)

      const wsUrl = `ws://${ip}/ws`
      console.log(`[WS ${ip}] Connecting to ${wsUrl}...`)

      try {
        const ws = new WebSocket(wsUrl)
        websocketsRef.current.set(ip, ws)

        ws.onopen = () => {
          console.log(`[WS ${ip}] Connected!`)
          updateDeviceState(ip, {
            connectionState: 'connected',
            lastConnected: new Date(),
            lastError: undefined,
          })

          // Request initial status
          sendToDevice(ip, { type: 'get_status' })

          // Start heartbeat
          const interval = setInterval(() => {
            sendToDevice(ip, { type: 'heartbeat' })
          }, heartbeatInterval)
          heartbeatIntervalsRef.current.set(ip, interval)
        }

        ws.onmessage = (event) => handleMessage(ip, event)

        ws.onerror = (error) => {
          console.error(`[WS ${ip}] Error:`, error)
          updateDeviceState(ip, {
            connectionState: 'error',
            lastError: 'Connection error',
          })
        }

        ws.onclose = () => {
          console.log(`[WS ${ip}] Disconnected`)
          clearDeviceTimeouts(ip)
          websocketsRef.current.delete(ip)
          updateDeviceState(ip, { connectionState: 'disconnected' })

          // Schedule reconnect
          if (shouldReconnectRef.current.get(ip)) {
            console.log(`[WS ${ip}] Reconnecting in ${reconnectDelay}ms...`)
            const timeout = setTimeout(() => {
              if (shouldReconnectRef.current.get(ip)) {
                connectDevice(ip)
              }
            }, reconnectDelay)
            reconnectTimeoutsRef.current.set(ip, timeout)
          }
        }
      } catch (error) {
        console.error(`[WS ${ip}] Failed to create WebSocket:`, error)
        updateDeviceState(ip, {
          connectionState: 'error',
          lastError: 'Failed to create connection',
        })
      }
    },
    [
      autoReconnect,
      heartbeatInterval,
      reconnectDelay,
      clearDeviceTimeouts,
      updateDeviceState,
      sendToDevice,
      handleMessage,
    ]
  )

  // Disconnect from a device
  const disconnectDevice = useCallback(
    (ip: string) => {
      shouldReconnectRef.current.set(ip, false)
      clearDeviceTimeouts(ip)
      const ws = websocketsRef.current.get(ip)
      if (ws) {
        ws.close()
        websocketsRef.current.delete(ip)
      }
      updateDeviceState(ip, { connectionState: 'disconnected' })
    },
    [clearDeviceTimeouts, updateDeviceState]
  )

  // Add a device
  const addDevice = useCallback(
    (ip: string) => {
      if (!deviceStates.has(ip)) {
        setDeviceStates((prev) => new Map(prev).set(ip, initialDeviceState(ip)))
      }
      if (autoConnect) {
        connectDevice(ip)
      }
    },
    [deviceStates, autoConnect, connectDevice]
  )

  // Remove a device
  const removeDevice = useCallback(
    (ip: string) => {
      disconnectDevice(ip)
      setDeviceStates((prev) => {
        const newMap = new Map(prev)
        newMap.delete(ip)
        return newMap
      })
    },
    [disconnectDevice]
  )

  // Get connection for a device
  const getConnection = useCallback(
    (ip: string): DeviceConnection | undefined => {
      const state = deviceStates.get(ip)
      if (!state) return undefined

      return {
        state,
        ws: websocketsRef.current.get(ip) || null,
        connect: () => connectDevice(ip),
        disconnect: () => disconnectDevice(ip),
        send: (msg) => sendToDevice(ip, msg),
        getStatus: () => sendToDevice(ip, { type: 'get_status' }),
        updateConfig: (config) => sendToDevice(ip, { type: 'config_update', ...config }),
        sendGameCommand: (command, gamemode) => {
          const msg: ClientMessage = { type: 'game_command', command }
          if (gamemode) (msg as any).gamemode = gamemode
          return sendToDevice(ip, msg)
        },
      }
    },
    [deviceStates, connectDevice, disconnectDevice, sendToDevice]
  )

  // Get device state
  const getDeviceState = useCallback((ip: string) => deviceStates.get(ip), [deviceStates])

  // Check if device is connected
  const isDeviceConnected = useCallback(
    (ip: string) => deviceStates.get(ip)?.connectionState === 'connected',
    [deviceStates]
  )

  // Connect all devices
  const connectAll = useCallback(() => {
    deviceStates.forEach((_, ip) => connectDevice(ip))
  }, [deviceStates, connectDevice])

  // Disconnect all devices
  const disconnectAll = useCallback(() => {
    deviceStates.forEach((_, ip) => disconnectDevice(ip))
  }, [deviceStates, disconnectDevice])

  // Broadcast command to all connected devices
  const broadcastCommand = useCallback(
    (command: 'start' | 'stop' | 'reset', gamemode?: GameMode) => {
      deviceStates.forEach((state, ip) => {
        if (state.connectionState === 'connected') {
          const msg: ClientMessage = { type: 'game_command', command }
          if (gamemode) (msg as any).gamemode = gamemode
          sendToDevice(ip, msg)
        }
      })
    },
    [deviceStates, sendToDevice]
  )

  // Get all connected device states
  const connectedDevices = useMemo(
    () => Array.from(deviceStates.values()).filter((s) => s.connectionState === 'connected'),
    [deviceStates]
  )

  // Build connections map
  const connections = useMemo(() => {
    const map = new Map<string, DeviceConnection>()
    deviceStates.forEach((_, ip) => {
      const conn = getConnection(ip)
      if (conn) map.set(ip, conn)
    })
    return map
  }, [deviceStates, getConnection])

  // Initialize connections for initial devices
  useEffect(() => {
    if (autoConnect) {
      initialDevices.forEach((ip) => {
        if (!websocketsRef.current.has(ip)) {
          connectDevice(ip)
        }
      })
    }

    // Cleanup on unmount
    return () => {
      websocketsRef.current.forEach((ws, ip) => {
        shouldReconnectRef.current.set(ip, false)
        ws.close()
      })
      reconnectTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      heartbeatIntervalsRef.current.forEach((interval) => clearInterval(interval))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const value: DeviceConnectionsContextValue = {
    connections,
    addDevice,
    removeDevice,
    getConnection,
    getDeviceState,
    isDeviceConnected,
    connectAll,
    disconnectAll,
    broadcastCommand,
    connectedDevices,
    onHitReport,
    onShotFired,
    onStatusUpdate,
  }

  return (
    <DeviceConnectionsContext.Provider value={value}>{children}</DeviceConnectionsContext.Provider>
  )
}
