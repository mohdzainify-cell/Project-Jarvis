import { useRef, useCallback } from 'react'
import { useJarvisStore } from '@/store/jarvisStore'
import type { Message, JarvisEvent, ModelTag } from '@/types'

const WS_URL = 'ws://localhost:8765/ws/chat'

export function useJarvis() {
  const ws = useRef<WebSocket | null>(null)
  const {
    addMessage,
    updateMessage,
    setActiveModel,
    sessionId,
  } = useJarvisStore()

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return
    ws.current = new WebSocket(WS_URL)
    ws.current.onerror = () => console.warn('JARVIS WebSocket error')
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    addMessage(userMsg)

    const assistantId = crypto.randomUUID()
    addMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    })

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      connect()
      await new Promise((r) => setTimeout(r, 600))
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      updateMessage(assistantId, {
        content: 'Unable to reach backend, Sir. Is the Python server running?',
        streaming: false,
      })
      return
    }

    ws.current.send(JSON.stringify({ message: text, session_id: sessionId }))

    let accumulated = ''

    ws.current.onmessage = (event: MessageEvent) => {
      const data: JarvisEvent = JSON.parse(event.data)

      if (data.type === 'chunk') {
        accumulated += data.content ?? ''
        updateMessage(assistantId, {
          content: accumulated,
          model: data.model as ModelTag,
        })
        if (data.model) setActiveModel(data.model as ModelTag)
      }

      if (data.type === 'done') {
        updateMessage(assistantId, { streaming: false })
        accumulated = ''
      }

      if (data.type === 'error') {
        updateMessage(assistantId, {
          content: data.message ?? 'An error occurred, Sir.',
          streaming: false,
        })
      }
    }
  }, [addMessage, updateMessage, setActiveModel, sessionId, connect])

  const disconnect = useCallback(() => {
    ws.current?.close()
  }, [])

  return { sendMessage, connect, disconnect }
}