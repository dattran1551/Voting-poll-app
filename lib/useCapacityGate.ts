import { useEffect, useState } from 'react'
import { getDeviceId } from './device-id'

const WAITING_RETRY_MS = 3000
const ADMITTED_HEARTBEAT_MS = 15000

export function useCapacityGate(): 'checking' | 'waiting' | 'admitted' {
  const [gateState, setGateState] = useState<'checking' | 'waiting' | 'admitted'>('checking')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function sendHeartbeat() {
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(sendHeartbeat, WAITING_RETRY_MS)
        return
      }

      try {
        const response = await fetch('/api/capacity/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: getDeviceId() }),
        })
        const body = await response.json()
        if (cancelled) return

        if (body.allowed) {
          setGateState('admitted')
          timer = setTimeout(sendHeartbeat, ADMITTED_HEARTBEAT_MS)
        } else {
          setGateState('waiting')
          timer = setTimeout(sendHeartbeat, WAITING_RETRY_MS)
        }
      } catch {
        if (cancelled) return
        timer = setTimeout(sendHeartbeat, WAITING_RETRY_MS)
      }
    }

    sendHeartbeat()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  return gateState
}
