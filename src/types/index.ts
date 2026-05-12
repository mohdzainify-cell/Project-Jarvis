// ─── Model & Chat Types ───────────────────────────────────────────
export type ModelProvider = 'Groq' | 'Gemini' | 'Ollama'

export interface ModelTag {
  provider: ModelProvider
  model: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: ModelTag
  streaming?: boolean
}

// ─── System Types ─────────────────────────────────────────────────
export interface BatteryInfo {
  level: number
  charging: boolean
  timeRemaining?: number
}

export interface SystemStats {
  cpu: number
  ram: number
  disk: number
  battery: BatteryInfo
  uptime: number
}

// ─── Health Types ─────────────────────────────────────────────────
export interface HealthEntry {
  id: string
  date: string
  sleep?: number
  water?: number
  exercise?: number
  mood?: 1 | 2 | 3 | 4 | 5
  weight?: number
  notes?: string
}

// ─── Briefing Types ───────────────────────────────────────────────
export interface BriefingData {
  greeting: string
  time: string
  battery: BatteryInfo
  message: string
  weather?: string
  tasks?: string[]
}

// ─── WebSocket Event Types ────────────────────────────────────────
export interface JarvisEvent {
  type: 'chunk' | 'done' | 'error' | 'tool_call' | 'announcement'
  content?: string
  model?: ModelTag
  message?: string
  tool?: string
}

// ─── Electron IPC Bridge (fixes all window.jarvis errors) ─────────
export interface JarvisElectronAPI {
  minimize:           () => void
  maximize:           () => void
  close:              () => void
  hideToHUD:          () => void
  restore:            () => void
  openURL:            (url: string) => void
  openFile:           (opts: object) => Promise<any>
  exec:               (cmd: string) => Promise<any>
  onBatteryUpdate:    (cb: (data: { charging: boolean; level?: number }) => void) => void
  onJarvisSpeak:      (cb: (text: string) => void) => void
  onNetworkChange:    (cb: (data: { online: boolean }) => void) => void
  removeAllListeners: (channel: string) => void
  platform:           string
}

declare global {
  interface Window {
    jarvis: JarvisElectronAPI
  }
}