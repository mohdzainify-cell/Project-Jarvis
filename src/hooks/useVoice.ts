import { useRef, useCallback, useEffect } from 'react'
import { useJarvisStore } from '@/store/jarvisStore'

const STT_WS_URL = 'ws://localhost:8765/ws/stt'
const SPEAK_URL = 'http://localhost:8765/tts/speak'

export function useVoice() {
  const wsRef = useRef<WebSocket | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { setListening, setSpeaking } = useJarvisStore()

  const stopListening = useCallback(() => {
    try { mediaRef.current?.stop() } catch { }
    try { wsRef.current?.close() } catch { }
    mediaRef.current = null
    wsRef.current = null
    setListening(false)
  }, [setListening])

  const startListening = useCallback(async (
    onTranscript: (text: string) => void
  ) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })

      wsRef.current = new WebSocket(STT_WS_URL)

      wsRef.current.onopen = () => {
        // Choose best available codec
        const mimeType =
          MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
              ? 'audio/webm'
              : 'audio/ogg'

        mediaRef.current = new MediaRecorder(stream, { mimeType })

        mediaRef.current.ondataavailable = (e: BlobEvent) => {
          if (
            e.data.size > 0 &&
            wsRef.current?.readyState === WebSocket.OPEN
          ) {
            wsRef.current.send(e.data)
          }
        }

        mediaRef.current.start(300) // 300ms chunks
        setListening(true)
      }

      wsRef.current.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          if (
            (data.type === 'transcript' || data.type === 'final') &&
            data.text?.trim()
          ) {
            onTranscript(data.text.trim())
            if (data.type === 'final') stopListening()
          }
        } catch { }
      }

      wsRef.current.onerror = () => stopListening()
      wsRef.current.onclose = () => {
        setListening(false)
        stream.getTracks().forEach(t => t.stop())
      }

    } catch (err) {
      console.error('Microphone error:', err)
      setListening(false)
    }
  }, [setListening, stopListening])

  const speak = useCallback(async (text: string) => {
    if (!text?.trim()) return

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setSpeaking(true)

    try {
      const res = await fetch(SPEAK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        console.warn('TTS request failed:', res.status)
        setSpeaking(false)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setSpeaking(false)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }

      audio.onerror = () => {
        setSpeaking(false)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }

      await audio.play()

    } catch (err) {
      console.error('TTS error:', err)
      setSpeaking(false)
    }
  }, [setSpeaking])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setSpeaking(false)
  }, [setSpeaking])

  // Listen for Electron speak events
  useEffect(() => {
    if (window.jarvis) {
      window.jarvis.onJarvisSpeak((text: string) => speak(text))
    }
    return () => {
      if (window.jarvis) {
        window.jarvis.removeAllListeners('jarvis:speak')
      }
    }
  }, [speak])

  return { startListening, stopListening, speak, stopSpeaking }
}