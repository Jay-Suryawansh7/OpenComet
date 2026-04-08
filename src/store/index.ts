import { create } from 'zustand'

// ─── Messages ───────────────────────────────────────────────
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface ChatState {
  messages: Message[]
  isLoading: boolean
  agentStatus: 'idle' | 'thinking' | 'browsing' | 'ready'
  currentUrl: string

  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  setLoading: (loading: boolean) => void
  setAgentStatus: (status: 'idle' | 'thinking' | 'browsing' | 'ready') => void
  setCurrentUrl: (url: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  agentStatus: 'idle',
  currentUrl: '',

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setAgentStatus: (status) => set({ agentStatus: status }),
  setCurrentUrl: (url) => set({ currentUrl: url }),
  clearMessages: () => set({ messages: [] }),
}))

// ─── Provider / Model ──────────────────────────────────────
export interface ProviderModel {
  id: string
  name: string
  provider: string
}

export interface ProviderConfig {
  id: string
  name: string
  icon: string           // emoji or short id
  apiKeyLabel: string
  apiKey: string
  baseUrl: string
  models: ProviderModel[]
}

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '⬡',
    apiKeyLabel: 'OpenAI API Key',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '◈',
    apiKeyLabel: 'Anthropic API Key',
    apiKey: '',
    baseUrl: 'https://api.anthropic.com',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    icon: '◇',
    apiKeyLabel: 'Gemini API Key',
    apiKey: '',
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' },
    ],
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    icon: '▲',
    apiKeyLabel: 'NVIDIA API Key',
    apiKey: '',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    models: [
      { id: 'meta/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'nvidia' },
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'nvidia' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    icon: '⊙',
    apiKeyLabel: 'Not required',
    apiKey: '',
    baseUrl: 'http://localhost:11434',
    models: [
      { id: 'llama3', name: 'Llama 3', provider: 'ollama' },
      { id: 'mistral', name: 'Mistral', provider: 'ollama' },
      { id: 'codellama', name: 'Code Llama', provider: 'ollama' },
    ],
  },
]

export interface SettingsState {
  providers: ProviderConfig[]
  activeProviderId: string
  activeModelId: string
  temperature: number
  agentServerUrl: string
  sidebarCollapsed: boolean

  setProviders: (providers: ProviderConfig[]) => void
  setActiveProvider: (id: string) => void
  setActiveModel: (id: string) => void
  updateProviderKey: (providerId: string, key: string) => void
  setTemperature: (temp: number) => void
  setAgentServerUrl: (url: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Derived helpers
  getActiveProvider: () => ProviderConfig | undefined
  getActiveModel: () => ProviderModel | undefined
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  providers: DEFAULT_PROVIDERS,
  activeProviderId: 'openai',
  activeModelId: 'gpt-4o',
  temperature: 0.7,
  agentServerUrl: 'http://localhost:8765',
  sidebarCollapsed: false,

  setProviders: (providers) => set({ providers }),
  setActiveProvider: (id) => {
    const provider = get().providers.find((p) => p.id === id)
    set({
      activeProviderId: id,
      activeModelId: provider?.models[0]?.id || '',
    })
  },
  setActiveModel: (id) => set({ activeModelId: id }),
  updateProviderKey: (providerId, key) =>
    set((state) => ({
      providers: state.providers.map((p) =>
        p.id === providerId ? { ...p, apiKey: key } : p
      ),
    })),
  setTemperature: (temp) => set({ temperature: temp }),
  setAgentServerUrl: (url) => set({ agentServerUrl: url }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  getActiveProvider: () => {
    const state = get()
    return state.providers.find((p) => p.id === state.activeProviderId)
  },
  getActiveModel: () => {
    const state = get()
    const provider = state.providers.find((p) => p.id === state.activeProviderId)
    return provider?.models.find((m) => m.id === state.activeModelId)
  },
}))

// ─── UI state (sidebar section, etc.) ───────────────────────
export type SidebarSection = 'search' | 'computer' | 'history' | 'discover' | 'spaces' | 'settings'

export interface UIState {
  activeSection: SidebarSection
  setActiveSection: (section: SidebarSection) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeSection: 'search',
  setActiveSection: (section) => set({ activeSection: section }),
}))