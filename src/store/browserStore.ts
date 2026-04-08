import { create } from 'zustand'

export interface Tab {
  id: string
  url: string
  title: string
  favicon: string
  isLoading: boolean
}

export interface VisitedSite {
  id: string
  url: string
  title: string
  screenshot?: string
  timestamp: number
  summary?: string
}

export interface BrowserState {
  tabs: Tab[]
  activeTabId: string | null
  agentMode: 'autonomous' | 'confirmation'
  agentActive: boolean
  visitedSites: VisitedSite[]
  isInitialized: boolean

  initialize: () => Promise<void>
  setTabs: (tabs: Tab[], activeId: string | null) => void
  setActiveTab: (tabId: string) => Promise<void>
  newTab: (url?: string) => Promise<void>
  closeTab: (tabId: string) => Promise<void>
  navigate: (url: string) => Promise<void>
  goBack: () => Promise<void>
  goForward: () => Promise<void>
  reload: () => Promise<void>
  setAgentMode: (mode: 'autonomous' | 'confirmation') => void
  setAgentActive: (active: boolean) => void
  addVisitedSite: (site: Omit<VisitedSite, 'id' | 'timestamp'>) => void
  clearVisitedSites: () => void
}

export const useBrowserStore = create<BrowserState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  agentMode: 'autonomous',
  agentActive: false,
  visitedSites: [],
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) return

    if (window.electronAPI?.browser) {
      const { tabs, activeId } = await window.electronAPI.browser.getTabs()
      const mode = await window.electronAPI.settings.get()

      set({
        tabs,
        activeTabId: activeId,
        agentMode: mode || 'autonomous',
        isInitialized: true
      })

      window.electronAPI.browser.onTabsUpdated(({ tabs, activeId }) => {
        set({ tabs, activeTabId: activeId })
      })
    } else {
      set({ isInitialized: true })
    }
  },

  setTabs: (tabs, activeId) => set({ tabs, activeTabId: activeId }),

  setActiveTab: async (tabId) => {
    if (window.electronAPI?.browser) {
      await window.electronAPI.browser.setActiveTab(tabId)
      set({ activeTabId: tabId })
    }
  },

  newTab: async (url) => {
    if (window.electronAPI?.browser) {
      const { tabId } = await window.electronAPI.browser.newTab(url)
      set({ activeTabId: tabId })
    }
  },

  closeTab: async (tabId) => {
    if (window.electronAPI?.browser) {
      await window.electronAPI.browser.closeTab(tabId)
    }
  },

  navigate: async (url) => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.navigate(activeTabId, url)
    }
  },

  goBack: async () => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.goBack(activeTabId)
    }
  },

  goForward: async () => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.goForward(activeTabId)
    }
  },

  reload: async () => {
    const { activeTabId } = get()
    if (window.electronAPI?.browser && activeTabId) {
      await window.electronAPI.browser.reload(activeTabId)
    }
  },

  setAgentMode: (mode) => {
    set({ agentMode: mode })
    if (window.electronAPI?.settings) {
      window.electronAPI.settings.set({ agentMode: mode })
    }
  },

  setAgentActive: (active) => set({ agentActive: active }),

  addVisitedSite: (site) => {
    const visited: VisitedSite = {
      ...site,
      id: `site-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now()
    }
    set((state) => ({
      visitedSites: [visited, ...state.visitedSites].slice(0, 10)
    }))
  },

  clearVisitedSites: () => set({ visitedSites: [] })
}))
