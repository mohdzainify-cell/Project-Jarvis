import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff } from 'lucide-react'
import { useJarvisStore } from '@/store/jarvisStore'
import { useJarvis } from '@/hooks/useJarvis'
import { useVoice } from '@/hooks/useVoice'
import type { Message } from '@/types'

export default function ChatPanel() {
  const [input, setInput] = useState('')
  const { messages, isListening, isSpeaking } = useJarvisStore()
  const { sendMessage } = useJarvis()
  const { startListening, stopListening, speak } = useVoice()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Speak assistant messages aloud
  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.role === 'assistant' && !last.streaming && last.content) {
      speak(last.content)
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isSpeaking) return
    sendMessage(input.trim())
    setInput('')
    inputRef.current?.focus()
  }

  const toggleVoice = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((transcript: string) => {
        if (transcript.trim()) sendMessage(transcript.trim())
      })
    }
  }

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Messages — upper portion, scrollable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '80px 20% 0 20%',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          pointerEvents: 'auto',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg: Message) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Model tag */}
                {msg.role === 'assistant' && msg.model && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '2px 8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0,212,255,0.12)',
                    borderRadius: 3,
                    width: 'fit-content',
                  }}>
                    <span style={{ color: 'rgba(0,212,255,0.5)', fontFamily: 'Share Tech Mono', fontSize: 10 }}>
                      {msg.model.provider}
                    </span>
                    <span style={{ color: 'rgba(0,212,255,0.25)', fontSize: 10 }}>•</span>
                    <span style={{ color: 'rgba(0,212,255,0.4)', fontFamily: 'Share Tech Mono', fontSize: 10 }}>
                      {msg.model.model}
                    </span>
                  </div>
                )}

                {/* Bubble */}
                <div style={{
                  padding: '10px 16px',
                  background: msg.role === 'user'
                    ? 'rgba(0,212,255,0.08)'
                    : 'rgba(0,0,0,0.5)',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(0,212,255,0.25)' : 'rgba(0,212,255,0.1)'}`,
                  borderRadius: 4,
                  color: msg.role === 'user' ? 'rgba(0,212,255,0.9)' : 'rgba(0,212,255,0.75)',
                  fontFamily: 'Share Tech Mono, monospace',
                  fontSize: 13,
                  lineHeight: 1.7,
                  backdropFilter: 'blur(8px)',
                }}>
                  {msg.content}
                  {msg.streaming && (
                    <span style={{ display: 'inline-flex', gap: 3, marginLeft: 8, verticalAlign: 'middle' }}>
                      {[0, 1, 2].map(i => (
                        <motion.span key={i}
                          style={{ width: 4, height: 4, borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </span>
                  )}
                </div>

                <span style={{ color: 'rgba(0,212,255,0.2)', fontFamily: 'Share Tech Mono', fontSize: 9, padding: '0 4px' }}>
                  {new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input — at 75% vertical, centered */}
      <div
        style={{
          position: 'absolute',
          top: '72%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 560,
          pointerEvents: 'auto',
          zIndex: 20,
        }}
      >
        {/* Speaking indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                marginBottom: 10,
                color: 'rgba(0,212,255,0.5)',
                fontFamily: 'Share Tech Mono',
                fontSize: 10,
                letterSpacing: 4,
              }}
            >
              ◈ JARVIS IS SPEAKING...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listening indicator */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: 'center',
                marginBottom: 10,
                color: '#00d4ff',
                fontFamily: 'Share Tech Mono',
                fontSize: 10,
                letterSpacing: 4,
              }}
            >
              ◈ LISTENING...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(2,13,26,0.85)',
          border: '1px solid rgba(0,212,255,0.25)',
          borderRadius: 4,
          padding: '10px 14px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 30px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.05)',
        }}>
          {/* Voice button */}
          <button
            onClick={toggleVoice}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isListening ? '#00d4ff' : 'rgba(0,212,255,0.3)',
              padding: 4,
              flexShrink: 0,
              transition: 'color 0.2s',
            }}
          >
            {isListening
              ? <Mic size={16} style={{ filter: 'drop-shadow(0 0 6px #00d4ff)' }} />
              : <MicOff size={16} />
            }
          </button>

          {/* Text input */}
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={
              isSpeaking ? 'JARVIS is speaking...' :
                isListening ? 'Listening...' :
                  'Speak or type a command, Sir...'
            }
            disabled={isSpeaking}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#00d4ff',
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: 13,
              letterSpacing: 1,
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSpeaking}
            style={{
              background: 'none',
              border: 'none',
              cursor: input.trim() && !isSpeaking ? 'pointer' : 'not-allowed',
              color: input.trim() && !isSpeaking ? '#00d4ff' : 'rgba(0,212,255,0.2)',
              padding: 4,
              flexShrink: 0,
              transition: 'color 0.2s',
            }}
          >
            <Send size={16} />
          </button>
        </div>

        {/* Hint */}
        <p style={{
          textAlign: 'center',
          marginTop: 8,
          color: 'rgba(0,212,255,0.15)',
          fontFamily: 'Share Tech Mono',
          fontSize: 9,
          letterSpacing: 3,
        }}>
          PRESS ENTER TO SEND  •  CLICK MIC FOR VOICE
        </p>
      </div>
    </div>
  )
}