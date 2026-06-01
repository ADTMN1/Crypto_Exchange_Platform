import { useEffect, useRef } from 'react'

export function useWebSocket(url: string, onMessage: (event: MessageEvent) => void) {
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    socketRef.current = new WebSocket(url)
    socketRef.current.onmessage = onMessage

    return () => {
      socketRef.current?.close()
    }
  }, [url, onMessage])

  return socketRef.current
}
