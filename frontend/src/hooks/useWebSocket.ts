import { useEffect } from 'react'
import { WebSocketMessage } from '../types'
import websocketService from '../services/websocket'
import { useAuthStore } from '../store/authStore'

export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && token) {
      websocketService.connect(token)

      return () => {
        websocketService.disconnect()
      }
    }
  }, [isAuthenticated, token])

  return {
    on: (type: string, handler: (message: WebSocketMessage) => void) =>
      websocketService.on(type, handler),
    send: (type: string, payload: unknown) => websocketService.send(type, payload),
  }
}
