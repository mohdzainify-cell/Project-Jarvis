import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Message, ModelTag, BatteryInfo, SystemStats } from '@/types'

interface JarvisState {
  // Auth
  authenticated: boolean
  setAuthenticated: (v: boolean) => void

  // Chat
  messages: Message[]
  addMessage:    (msg: Message) => void
  updateMessage: (id: string, patch: Partial<Message>) => void
  clearMessages: () => void

  // Voice
  isListening: boolean
  setListening: (v: boolean) => void
  isSpeaking:  boolean
  setSpeaking:  (v: boolean) => void

  // Model
  activeModel: ModelTag | null
  setActiveModel: (m: ModelTag) => void

  // System
  battery: BatteryInfo
  setBattery: (b: Partial<BatteryInfo>) => void
  systemStats: SystemStats | null
  setSystemStats: (s: SystemStats) => void

  // UI
  focusMode:       boolean
  toggleFocusMode: () => void
  hudMinimized:    boolean
  toggleHUD:       () => void
  showUsage:       boolean
  toggleUsage:     () => void
  showBriefing:    boolean
  setShowBriefing: (v: boolean) => void

  // Network
  online: boolean
  setOnline: (v: boolean) => void

  // Session
  sessionId: string
}

export const useJarvisStore = create<JarvisState>()(
  persist(
    (set: (fn: Partial<JarvisState> | ((s: JarvisState) => Partial<JarvisState>)) => void) => ({
      authenticated: false,
      setAuthenticated: (v: boolean) => set({ authenticated: v }),

      messages: [],
      addMessage: (msg: Message) =>
        set((s: JarvisState) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id: string, patch: Partial<Message>) =>
        set((s: JarvisState) => ({
          messages: s.messages.map((m: Message) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),
      clearMessages: () => set({ messages: [] }),

      isListening: false,
      setListening: (v: boolean) => set({ isListening: v }),
      isSpeaking:  false,
      setSpeaking:  (v: boolean) => set({ isSpeaking: v }),

      activeModel: null,
      setActiveModel: (m: ModelTag) => set({ activeModel: m }),

      battery: { level: 100, charging: true },
      setBattery: (b: Partial<BatteryInfo>) =>
        set((s: JarvisState) => ({ battery: { ...s.battery, ...b } })),
      systemStats: null,
      setSystemStats: (s: SystemStats) => set({ systemStats: s }),

      focusMode:       false,
      toggleFocusMode: () => set((s: JarvisState) => ({ focusMode: !s.focusMode })),
      hudMinimized:    false,
      toggleHUD:       () => set((s: JarvisState) => ({ hudMinimized: !s.hudMinimized })),
      showUsage:       false,
      toggleUsage:     () => set((s: JarvisState) => ({ showUsage: !s.showUsage })),
      showBriefing:    false,
      setShowBriefing: (v: boolean) => set({ showBriefing: v }),

      online: true,
      setOnline: (v: boolean) => set({ online: v }),

      sessionId: crypto.randomUUID(),
    }),
    {
      name: 'jarvis-state',
      partialize: (s: JarvisState) => ({
        focusMode:    s.focusMode,
        hudMinimized: s.hudMinimized,
      }),
    }
  )
)