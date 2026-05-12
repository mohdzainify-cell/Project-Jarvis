import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff } from 'lucide-react'

import { useJarvisStore } from '@/store/jarvisStore'
import { useJarvis } from '@/hooks/useJarvis'
import { useVoice } from '@/hooks/useVoice'

import type { Message } from '@/types'

export default function ChatPanel() {
  const [input, setInput] = useState('')

  const {
    messages,
    isListening,
    isSpeaking,
  } = useJarvisStore()

  const { sendMessage } = useJarvis()

  const {
    startListening,
    stopListening,
    speak,
  } = useVoice()

  const bottomRef = useRef<HTMLDivElement>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  // SPEAK ASSISTANT RESPONSE
  useEffect(() => {
    if (messages.length === 0) return

    const last = messages[messages.length - 1]

    if (
      last.role === 'assistant' &&
      !last.streaming &&
      last.content
    ) {
      speak(last.content)
    }
  }, [messages])

  // SEND
  const handleSend = () => {
    if (!input.trim() || isSpeaking) return

    sendMessage(input.trim())

    setInput('')

    inputRef.current?.focus()
  }

  // VOICE
  const toggleVoice = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((transcript: string) => {
        if (transcript.trim()) {
          sendMessage(transcript.trim())
        }
      })
    }
  }

  return (
    <div
      className="
        h-full
        flex
        flex-col
        overflow-hidden
      "
    >
      {/* MESSAGES */}
      <div
        className="
          flex-1
          overflow-y-auto
          px-5
          pt-5
          pb-4
          space-y-4
        "
      >
        <AnimatePresence initial={false}>
          {messages.map((msg: Message) => (
            <motion.div
              key={msg.id}
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              className={`flex ${msg.role === 'user'
                  ? 'justify-end'
                  : 'justify-start'
                }`}
            >
              <div className="max-w-[80%]">
                {/* MODEL */}
                {msg.role === 'assistant' &&
                  msg.model && (
                    <div
                      className="
                        mb-2
                        w-fit
                        rounded-lg
                        border
                        border-cyan-400/10
                        bg-black/30
                        px-2
                        py-1
                        text-[10px]
                        tracking-widest
                        text-cyan-400/50
                      "
                    >
                      {msg.model.provider}
                      {' • '}
                      {msg.model.model}
                    </div>
                  )}

                {/* BUBBLE */}
                <div
                  className={`
                    rounded-2xl
                    border
                    px-4
                    py-3
                    text-[13px]
                    leading-7
                    backdrop-blur-xl
                    shadow-[0_0_25px_rgba(0,212,255,0.05)]

                    ${msg.role === 'user'
                      ? `
                          border-cyan-400/20
                          bg-cyan-400/10
                          text-cyan-200
                        `
                      : `
                          border-cyan-400/10
                          bg-black/30
                          text-cyan-100
                        `
                    }
                  `}
                >
                  {msg.content}

                  {/* STREAMING DOTS */}
                  {msg.streaming && (
                    <span className="inline-flex gap-1 ml-2">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="
                            w-1
                            h-1
                            rounded-full
                            bg-cyan-300
                          "
                          animate={{
                            opacity: [0.3, 1, 0.3],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </span>
                  )}
                </div>

                {/* TIME */}
                <div
                  className="
                    mt-1
                    px-1
                    text-[9px]
                    tracking-widest
                    text-cyan-400/20
                  "
                >
                  {new Date(
                    msg.timestamp
                  ).toLocaleTimeString(
                    'en-GB',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* INPUT AREA */}
      <div
        className="
          border-t
          border-cyan-400/10
          bg-black/30
          backdrop-blur-2xl
          p-4
        "
      >
        {/* STATUS */}
        <AnimatePresence mode="wait">
          {isSpeaking && (
            <motion.div
              initial={{
                opacity: 0,
                y: 6,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
              }}
              className="
                mb-3
                text-center
                text-[10px]
                tracking-[0.3em]
                text-cyan-400/50
              "
            >
              ◈ JARVIS SPEAKING...
            </motion.div>
          )}

          {!isSpeaking &&
            isListening && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                }}
                className="
                  mb-3
                  text-center
                  text-[10px]
                  tracking-[0.3em]
                  text-cyan-300
                "
              >
                ◈ LISTENING...
              </motion.div>
            )}
        </AnimatePresence>

        {/* INPUT ROW */}
        <div
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-cyan-400/15
            bg-[#06111d]
            px-4
            py-3
            shadow-[0_0_30px_rgba(0,212,255,0.06)]
          "
        >
          {/* MIC */}
          <button
            onClick={toggleVoice}
            className="
              text-cyan-400/40
              transition-all
              hover:text-cyan-300
            "
          >
            {isListening ? (
              <Mic
                size={18}
                className="drop-shadow-[0_0_8px_#00d4ff]"
              />
            ) : (
              <MicOff size={18} />
            )}
          </button>

          {/* INPUT */}
          <input
            ref={inputRef}
            value={input}
            onChange={e =>
              setInput(e.target.value)
            }
            onKeyDown={e =>
              e.key === 'Enter' &&
              !e.shiftKey &&
              handleSend()
            }
            disabled={isSpeaking}
            placeholder={
              isSpeaking
                ? 'JARVIS is speaking...'
                : isListening
                  ? 'Listening...'
                  : 'Type a command...'
            }
            className="
              flex-1
              bg-transparent
              outline-none
              text-sm
              tracking-wide
              text-cyan-200
              placeholder:text-cyan-500/40
            "
          />

          {/* SEND */}
          <button
            onClick={handleSend}
            disabled={
              !input.trim() ||
              isSpeaking
            }
            className="
              text-cyan-400/40
              transition-all
              hover:text-cyan-300
              disabled:opacity-20
            "
          >
            <Send size={18} />
          </button>
        </div>

        {/* HINT */}
        <p
          className="
            mt-3
            text-center
            text-[9px]
            tracking-[0.3em]
            text-cyan-400/15
          "
        >
          ENTER TO SEND • MIC FOR VOICE
        </p>
      </div>
    </div>
  )
}