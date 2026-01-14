'use client'

import { useEffect, useMemo, useState } from 'react'
import { GameCommandType, OpCode, type ClientMessage, type ServerMessage } from '@rayz/types'

import {
  CloudOnly,
  Feature,
  GameCommProvider,
  LocalOnly,
  ModeIndicator,
  useFeatureFlags,
  useGameCommContext,
} from '@/lib/comm'

function CommDemoPanel() {
  const {
    mode,
    state,
    connectedDevices,
    send,
    broadcast,
    onMessage,
    connect,
    disconnect,
    isConnected,
    isConnecting,
  } = useGameCommContext()

  const [log, setLog] = useState<string[]>([])

  // Keep a short rolling log of incoming device messages
  useEffect(() => {
    const unsubscribe = onMessage('*', (message: ServerMessage, fromDevice: string) => {
      const line = `${new Date().toLocaleTimeString()} — ${fromDevice}: ${message.type}`
      setLog((prev) => [line, ...prev].slice(0, 24))
    })

    return () => unsubscribe()
  }, [onMessage])

  const requestStatus = () => {
    const msg: ClientMessage = { op: OpCode.GET_STATUS, type: 'get_status' }
    broadcast(msg)
  }

  const startGame = () => {
    const msg: ClientMessage = {
      op: OpCode.GAME_COMMAND,
      type: 'game_command',
      command: GameCommandType.START,
    }
    broadcast(msg)
  }

  const stopGame = () => {
    const msg: ClientMessage = {
      op: OpCode.GAME_COMMAND,
      type: 'game_command',
      command: GameCommandType.STOP,
    }
    broadcast(msg)
  }

  const pingFirstDevice = () => {
    if (!connectedDevices.length) return
    const target = connectedDevices[0]
    const msg: ClientMessage = { op: OpCode.HEARTBEAT, type: 'heartbeat' }
    send(target, msg)
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          <ModeIndicator className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {state}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Devices: {connectedDevices.length || '0'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            className="rounded-md bg-indigo-600 px-3 py-1 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            onClick={connect}
            disabled={isConnected || isConnecting}
          >
            Connect
          </button>
          <button
            className="rounded-md bg-slate-700 px-3 py-1 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-500"
            onClick={disconnect}
            disabled={!isConnected && !isConnecting}
          >
            Disconnect
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md bg-emerald-600 px-3 py-1 text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-500"
              onClick={requestStatus}
              disabled={!isConnected}
            >
              Request Status
            </button>
            <button
              className="rounded-md bg-blue-600 px-3 py-1 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-500"
              onClick={startGame}
              disabled={!isConnected}
            >
              Start Game
            </button>
            <button
              className="rounded-md bg-amber-600 px-3 py-1 text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-500"
              onClick={stopGame}
              disabled={!isConnected}
            >
              Stop Game
            </button>
            <button
              className="rounded-md bg-slate-600 px-3 py-1 text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
              onClick={pingFirstDevice}
              disabled={!isConnected || !connectedDevices.length}
            >
              Ping First Device
            </button>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Mode-aware UI
          </p>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <CloudOnly>
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-900 dark:border-blue-800 dark:bg-blue-950">
                Cloud-only features visible (leaderboards, stats, admin dashboard).
              </div>
            </CloudOnly>
            <LocalOnly>
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-800 dark:bg-amber-950">
                Local-only controls visible (LAN device control, offline play).
              </div>
            </LocalOnly>
            <Feature name="adminDashboard">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950">
                Admin Dashboard flag is ON in this mode.
              </div>
            </Feature>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Connected Devices
        </p>
        {connectedDevices.length ? (
          <ul className="mt-2 space-y-1">
            {connectedDevices.map((id) => (
              <li
                key={id}
                className="flex items-center justify-between rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700"
              >
                <span className="font-mono">{id}</span>
                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {mode}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">No devices yet.</p>
        )}
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Recent Messages
        </p>
        <div className="max-h-56 overflow-auto rounded border border-slate-200 bg-white p-2 font-mono text-[11px] dark:border-slate-800 dark:bg-slate-900">
          {log.length ? (
            <ul className="space-y-1">
              {log.map((line, idx) => (
                <li key={`${line}-${idx}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">Waiting for device traffic…</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommDemoPage({ params }: { params: { locale: string } }) {
  const { locale } = params
  const sessionId = useMemo(() => `demo-${locale}`, [locale])
  const flags = useFeatureFlags()

  return (
    <GameCommProvider sessionId={sessionId} autoConnect>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            GameComm Demo
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Dual-mode communication demo showing the shared UI talking to either the local WebSocket
            bridge or Ably depending on how the app was launched. Use the buttons to broadcast
            protocol messages defined in @rayz/types.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Feature flags resolved for this mode:{' '}
            {Object.entries(flags)
              .filter(([, enabled]) => enabled)
              .map(([name]) => name)
              .join(', ') || 'none'}
          </p>
        </header>

        <CommDemoPanel />

        <section className="space-y-2 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            How to use this demo
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run the local WS bridge (NEXT_PUBLIC_MODE=local) or configure Ably keys for cloud.
            </li>
            <li>Open this page at /comm-demo (or /en/comm-demo) while devices are online.</li>
            <li>
              Use Quick Actions to send protocol messages and watch device replies in the log.
            </li>
          </ol>
        </section>
      </div>
    </GameCommProvider>
  )
}
